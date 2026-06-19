import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../payments/stripe.service";

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService, private stripeService: StripeService) {}

  async getAllPlans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
  }

  async getPlanByType(type: string) {
    return this.prisma.plan.findFirst({ where: { type: type as any, isActive: true } });
  }

  async activateFreePlan(userId: string) {
    const plan = await this.prisma.plan.findFirst({ where: { type: "SEED", isActive: true } });
    if (!plan) throw new NotFoundException("Free plan not found");

    const existing = await this.prisma.subscription.findUnique({
      where: { userId_planId: { userId, planId: plan.id } },
    });
    if (existing && existing.status === "ACTIVE") {
      return { plan, subscription: existing, message: "Free plan already active" };
    }

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10);

    const subscription = existing
      ? await this.prisma.subscription.update({ where: { id: existing.id }, data: { status: "ACTIVE", endDate } })
      : await this.prisma.subscription.create({
          data: { userId, planId: plan.id, status: "ACTIVE", startDate: new Date(), endDate },
        });

    return { plan, subscription, message: "Free plan activated successfully" };
  }

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", endDate: { gte: new Date() } },
      include: { plan: true },
      orderBy: { endDate: "desc" },
    });
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async activateSubscription(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const existing = await this.prisma.subscription.findUnique({
      where: { userId_planId: { userId, planId } },
    });

    if (existing) {
      const updated = await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", startDate: new Date(), endDate, cancelledAt: null },
      });
      await this.createHistory(updated.id, userId, existing.status, "ACTIVE", "manual_activation");
      return updated;
    }

    const subscription = await this.prisma.subscription.create({
      data: { userId, planId, status: "ACTIVE", startDate: new Date(), endDate },
    });
    await this.createHistory(subscription.id, userId, null, "ACTIVE", "manual_activation");
    return subscription;
  }

  async checkAccess(userId: string, requiredLevel: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", endDate: { gte: new Date() } },
      include: { plan: true },
      orderBy: { endDate: "desc" },
    });

    if (!sub) return requiredLevel === "SEED";

    const planRank = { SEED: 0, GROWTH: 1, SUCCESS: 2 };
    const requiredRank = planRank[requiredLevel as keyof typeof planRank] ?? 0;
    const userRank = planRank[sub.plan.type as keyof typeof planRank] ?? 0;

    return userRank >= requiredRank;
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await this.createHistory(subscriptionId, userId, sub.status, "CANCELLED", "local_cancel");
    return updated;
  }

  async cancelSubscriptionAtStripe(userId: string, subscriptionId: string, atPeriodEnd: boolean = true) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) throw new NotFoundException("Subscription not found");

    if (!sub.stripeSubscriptionId) {
      throw new BadRequestException("This subscription is not linked to Stripe");
    }

    // Cancel at Stripe
    const cancelledSubscription = await this.stripeService.cancelSubscriptionAtStripe(sub.stripeSubscriptionId, atPeriodEnd);

    // Update local subscription
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        status: atPeriodEnd ? "ACTIVE" : "CANCELLED",
        cancelledAt: !atPeriodEnd ? new Date() : null,
        autoRenew: false,
      },
    });
    await this.createHistory(
      subscriptionId,
      userId,
      sub.status,
      atPeriodEnd ? "ACTIVE" : "CANCELLED",
      atPeriodEnd ? "stripe_cancel_at_period_end" : "stripe_cancel_now",
    );

    return { subscription: updated, stripeSubscription: cancelledSubscription, message: `Subscription cancelled${atPeriodEnd ? " at period end" : ""}` };
  }

  async resumeSubscriptionAtStripe(userId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { id: subscriptionId, userId } });
    if (!sub) throw new NotFoundException("Subscription not found");
    if (!sub.stripeSubscriptionId) throw new BadRequestException("This subscription is not linked to Stripe");

    const stripeSubscription = await this.stripeService.resumeSubscriptionAtStripe(sub.stripeSubscriptionId);
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: false, autoRenew: true, status: "ACTIVE", cancelledAt: null },
    });
    await this.createHistory(subscriptionId, userId, sub.status, "ACTIVE", "stripe_resume");

    return { subscription: updated, stripeSubscription, message: "Subscription resumed" };
  }

  private async createHistory(subscriptionId: string, userId: string, fromStatus: any, toStatus: any, reason: string) {
    await this.prisma.subscriptionHistory.create({
      data: { subscriptionId, userId, fromStatus, toStatus, reason },
    });
  }
}
