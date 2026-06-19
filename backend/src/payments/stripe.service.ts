import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";

type CheckoutUser = { id: string; email: string; fullName?: string };
type CheckoutPlan = {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  stripePriceId: string | null;
};

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private configService: ConfigService, private prisma: PrismaService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    if (!secretKey || secretKey.includes("YOUR_TEST_SECRET_KEY_HERE")) {
      throw new Error("STRIPE_SECRET_KEY must be configured with a real Stripe secret key");
    }

    this.stripe = new Stripe(secretKey);
    this.webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET") || "";
  }

  getStripeInstance(): Stripe {
    return this.stripe;
  }

  async getOrCreateCustomer(user: CheckoutUser): Promise<string> {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new NotFoundException("User not found");
    if (dbUser.stripeCustomerId) return dbUser.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.fullName || dbUser.fullName,
      metadata: { userId: user.id },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(
    user: CheckoutUser,
    plan: CheckoutPlan,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    if (!plan.stripePriceId) throw new BadRequestException("Stripe Price ID not configured for this plan");
    if (plan.price <= 0) throw new BadRequestException("Free plans do not use Stripe Checkout");

    const existingActive = await this.prisma.subscription.findFirst({
      where: { userId: user.id, planId: plan.id, status: "ACTIVE", endDate: { gte: new Date() } },
    });
    if (existingActive) throw new BadRequestException("You already have an active subscription for this plan");

    const customer = await this.getOrCreateCustomer(user);
    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: "PENDING",
        paymentMethod: "STRIPE",
      },
    });

    const session = await this.stripe.checkout.sessions.create({
      customer,
      client_reference_id: user.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: this.ensureSessionPlaceholder(successUrl),
      cancel_url: this.ensureSessionPlaceholder(cancelUrl),
      metadata: { userId: user.id, planId: plan.id, paymentId: payment.id },
      subscription_data: { metadata: { userId: user.id, planId: plan.id, paymentId: payment.id } },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return session;
  }

  async getCheckoutStatus(sessionId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { plan: true },
    });
    if (!payment) throw new NotFoundException("Checkout session not found");
    if (payment.userId !== userId) throw new ForbiddenException("Checkout session does not belong to this user");

    if (payment.status !== "COMPLETED") {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await this.handleCheckoutSessionCompleted(sessionId);
      }
    }

    const refreshedPayment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { plan: true },
    });
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, planId: payment.planId || undefined },
      include: { plan: true },
      orderBy: { updatedAt: "desc" },
    });

    return { payment: refreshedPayment, subscription };
  }

  async createCustomerPortalSession(userId: string, returnUrl?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) throw new BadRequestException("No Stripe customer exists for this user");

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${this.frontendUrl()}/billing`,
    });

    return { url: session.url };
  }

  async getUserInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: { subscription: { include: { plan: true } }, payment: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async recordWebhookReceived(event: Stripe.Event): Promise<{ id: string; alreadyProcessed: boolean }> {
    const existing = await this.prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
    if (existing) return { id: existing.id, alreadyProcessed: existing.processed };

    const created = await this.prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payload: event as any,
      },
    });
    return { id: created.id, alreadyProcessed: false };
  }

  async markWebhookProcessed(id: string) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { processed: true, processedAt: new Date(), error: null },
    });
  }

  async markWebhookFailed(id: string, error: unknown) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { processed: false, error: error instanceof Error ? error.message : String(error) },
    });
  }

  async handleCheckoutSessionCompleted(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (session.payment_status !== "paid") return;

    const userId = session.metadata?.userId || session.client_reference_id || undefined;
    const planId = session.metadata?.planId || undefined;
    const paymentId = session.metadata?.paymentId || undefined;
    if (!userId || !planId) throw new BadRequestException("Checkout session metadata is incomplete");

    const amount = (session.amount_total || 0) / 100;
    await this.prisma.payment.updateMany({
      where: paymentId ? { id: paymentId, userId } : { stripeCheckoutSessionId: sessionId, userId },
      data: {
        status: "COMPLETED",
        amount,
        currency: (session.currency || "usd").toUpperCase(),
        paymentMethod: "STRIPE",
        planId,
      },
    });

    const stripeSubscription =
      typeof session.subscription === "string"
        ? await this.stripe.subscriptions.retrieve(session.subscription)
        : (session.subscription as Stripe.Subscription | null);
    if (stripeSubscription) {
      await this.upsertStripeSubscription(stripeSubscription, "checkout.session.completed");
    }
  }

  async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
    await this.upsertStripeSubscription(stripeSubscription, "customer.subscription.created");
  }

  async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    await this.upsertStripeSubscription(stripeSubscription, "customer.subscription.updated");
  }

  async handleSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelAtPeriodEnd: false },
    });
    await this.createSubscriptionHistory(subscription.id, subscription.userId, subscription.status as any, "CANCELLED", "customer.subscription.deleted");
  }

  async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const data = invoice as any;
    const stripeSubscriptionId = data.subscription?.toString();
    if (!stripeSubscriptionId) return;

    let subscription = await this.prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
    if (!subscription) {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      subscription = await this.upsertStripeSubscription(stripeSubscription, "invoice.paid");
    }
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: data.period_end ? new Date(data.period_end * 1000) : subscription.currentPeriodEnd,
        endDate: data.period_end ? new Date(data.period_end * 1000) : subscription.endDate,
      },
    });

    await this.upsertInvoiceAndPayment(invoice, subscription.userId, subscription.id, "COMPLETED");
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const data = invoice as any;
    const stripeSubscriptionId = data.subscription?.toString();
    if (!stripeSubscriptionId) return;

    const subscription = await this.prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });
    await this.createSubscriptionHistory(subscription.id, subscription.userId, subscription.status as any, "EXPIRED", "invoice.payment_failed");
    await this.upsertInvoiceAndPayment(invoice, subscription.userId, subscription.id, "FAILED");
  }

  async handleCustomerDeleted(customerId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (!user) return;

    await this.prisma.subscription.updateMany({
      where: { userId: user.id, stripeCustomerId: customerId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: null } });
  }

  verifyWebhookSignature(body: Buffer | undefined, signature: string | undefined): Stripe.Event {
    if (!this.webhookSecret || this.webhookSecret.includes("YOUR_WEBHOOK_SECRET_HERE")) {
      throw new BadRequestException("STRIPE_WEBHOOK_SECRET must be configured with a real webhook secret");
    }
    if (!body || !signature) throw new BadRequestException("Missing Stripe webhook body or signature");
    return this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
  }

  async cancelSubscriptionAtStripe(stripeSubscriptionId: string, atPeriodEnd = true): Promise<Stripe.Subscription> {
    if (atPeriodEnd) {
      return this.stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
    }
    return this.stripe.subscriptions.cancel(stripeSubscriptionId);
  }

  async resumeSubscriptionAtStripe(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false });
  }

  async createStripeProductAndPrice(
    planId: string,
    name: string,
    price: number,
    interval: "month" | "year" = "month",
  ): Promise<{ productId: string; priceId: string }> {
    const product = await this.stripe.products.create({ name, metadata: { planId } });
    const priceObj = await this.stripe.prices.create({
      product: product.id,
      recurring: { interval, interval_count: 1 },
      unit_amount: Math.round(price * 100),
      currency: "usd",
      metadata: { planId },
    } as any);

    await this.prisma.plan.update({
      where: { id: planId },
      data: { stripeProductId: product.id, stripePriceId: priceObj.id },
    });

    return { productId: product.id, priceId: priceObj.id };
  }

  private async upsertStripeSubscription(stripeSubscription: Stripe.Subscription, reason: string) {
    const data = stripeSubscription as any;
    const stripePriceId = stripeSubscription.items.data[0]?.price.id;
    const stripeProductId = stripeSubscription.items.data[0]?.price.product?.toString();
    const plan = await this.prisma.plan.findFirst({ where: { stripePriceId } });
    if (!plan) throw new NotFoundException(`Plan not found for Stripe Price ID: ${stripePriceId}`);

    const customerId = stripeSubscription.customer?.toString();
    const userId =
      stripeSubscription.metadata?.userId ||
      (customerId ? (await this.prisma.user.findUnique({ where: { stripeCustomerId: customerId } }))?.id : undefined);
    if (!userId) throw new BadRequestException("User not found for Stripe subscription");

    const currentPeriodStart = data.current_period_start ? new Date(data.current_period_start * 1000) : new Date();
    const currentPeriodEnd = data.current_period_end
      ? new Date(data.current_period_end * 1000)
      : this.fallbackEndDate(plan.durationDays);
    const status = this.mapStripeSubscriptionStatus(stripeSubscription.status);

    const existing =
      (await this.prisma.subscription.findUnique({ where: { stripeSubscriptionId: stripeSubscription.id } })) ||
      (await this.prisma.subscription.findUnique({ where: { userId_planId: { userId, planId: plan.id } } }));

    const payload = {
      userId,
      planId: plan.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId,
      stripeProductId,
      status,
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      autoRenew: !stripeSubscription.cancel_at_period_end,
      cancelledAt: status === "CANCELLED" ? new Date() : null,
    } as any;

    const subscription = existing
      ? await this.prisma.subscription.update({ where: { id: existing.id }, data: payload })
      : await this.prisma.subscription.create({ data: payload });

    if (customerId) {
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }
    await this.createSubscriptionHistory(subscription.id, userId, existing?.status as any, status, reason, {
      stripeSubscriptionId: stripeSubscription.id,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });

    return subscription;
  }

  private async upsertInvoiceAndPayment(invoice: Stripe.Invoice, userId: string, subscriptionId: string, paymentStatus: "COMPLETED" | "FAILED") {
    const data = invoice as any;
    const stripeInvoiceId = invoice.id;
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    const amountPaid = (invoice.amount_paid || 0) / 100;
    const amountDue = (invoice.amount_due || 0) / 100;
    const currency = (invoice.currency || "usd").toUpperCase();

    const payment = await this.prisma.payment.upsert({
      where: { stripeInvoiceId },
      update: {
        status: paymentStatus,
        amount: paymentStatus === "COMPLETED" ? amountPaid : amountDue,
        currency,
        paymentMethod: "STRIPE",
        receiptUrl: invoice.hosted_invoice_url || undefined,
      },
      create: {
        userId,
        planId: subscription?.planId,
        amount: paymentStatus === "COMPLETED" ? amountPaid : amountDue,
        currency,
        status: paymentStatus,
        paymentMethod: "STRIPE",
        stripeInvoiceId,
        receiptUrl: invoice.hosted_invoice_url || undefined,
      },
    });

    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId },
      update: {
        paymentId: payment.id,
        status: invoice.status || paymentStatus.toLowerCase(),
        amountDue,
        amountPaid,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
        paidAt: data.status_transitions?.paid_at ? new Date(data.status_transitions.paid_at * 1000) : undefined,
      },
      create: {
        userId,
        subscriptionId,
        paymentId: payment.id,
        stripeInvoiceId,
        stripeSubscriptionId: data.subscription?.toString(),
        stripeCustomerId: data.customer?.toString(),
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
        amountDue,
        amountPaid,
        currency,
        status: invoice.status || paymentStatus.toLowerCase(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
        paidAt: data.status_transitions?.paid_at ? new Date(data.status_transitions.paid_at * 1000) : undefined,
      },
    });
  }

  private async createSubscriptionHistory(
    subscriptionId: string,
    userId: string,
    fromStatus: any,
    toStatus: any,
    reason: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.subscriptionHistory.create({
      data: { subscriptionId, userId, fromStatus, toStatus, reason, metadata: metadata as any },
    });
  }

  private mapStripeSubscriptionStatus(status: string) {
    if (status === "active" || status === "trialing") return "ACTIVE";
    if (status === "canceled" || status === "unpaid") return "CANCELLED";
    if (status === "incomplete" || status === "incomplete_expired" || status === "past_due") return "PENDING";
    return "EXPIRED";
  }

  private fallbackEndDate(durationDays: number) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    return endDate;
  }

  private ensureSessionPlaceholder(url: string) {
    if (url.includes("session_id=")) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
  }

  private frontendUrl() {
    return this.configService.get<string>("APP_URL") || this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";
  }
}
