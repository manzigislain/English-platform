import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createPayPalOrder(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException("Plan not found");
    if (plan.price <= 0) throw new BadRequestException("This plan is free, use the free activation endpoint");

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: plan.price,
        currency: plan.currency,
        status: "PENDING",
        paymentMethod: "PAYPAL",
        planId,
      },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: "ORDER_CREATED",
        amount: plan.price,
        currency: plan.currency,
        response: { planName: plan.name, planType: plan.type },
      },
    });

    return {
      paymentId: payment.id,
      amount: plan.price,
      currency: plan.currency,
      description: `${plan.name} Plan - ${plan.type}`,
      paypalOrderId: `ORDER-${payment.id}-${Date.now()}`,
    };
  }

  async capturePayPalOrder(paymentId: string, paypalOrderId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.userId !== userId) throw new BadRequestException("Payment does not belong to user");

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "COMPLETED",
        paypalOrderId,
        paypalCaptureId: `CAPTURE-${paymentId}-${Date.now()}`,
        adminApproved: true,
        approvedAt: new Date(),
      },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        paymentId,
        paypalOrderId,
        paypalCaptureId: updatedPayment.paypalCaptureId,
        status: "COMPLETED",
        amount: payment.amount,
        currency: payment.currency,
        response: { capturedAt: new Date().toISOString() },
      },
    });

    if (payment.planId) {
      await this.subscriptionsService.activateSubscription(userId, payment.planId);
    }

    return { success: true, payment: updatedPayment, message: "Payment captured and subscription activated" };
  }

  async createBankTransferPayment(userId: string, planId: string, receiptUrl: string, notes?: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException("Plan not found");

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: plan.price,
        currency: plan.currency,
        status: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        planId,
        receiptUrl,
        adminApproved: false,
      },
    });

    await this.prisma.paymentReceipt.create({
      data: { paymentId: payment.id, receiptUrl, notes, verified: false },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: "RECEIPT_UPLOADED",
        amount: plan.price,
        currency: plan.currency,
        response: { receiptUrl, notes, awaitingApproval: true },
      },
    });

    return { payment, message: "Receipt uploaded. Awaiting admin approval." };
  }

  async getPaymentStatus(paymentId: string, userId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true, receipts: true, transactions: { orderBy: { createdAt: "desc" } } },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (userId && payment.userId !== userId) throw new BadRequestException("Access denied");
    return payment;
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { plan: true, receipts: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllPayments() {
    return this.prisma.payment.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } }, plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPendingBankTransfers() {
    return this.prisma.payment.findMany({
      where: { paymentMethod: "BANK_TRANSFER", status: "PENDING", adminApproved: false },
      include: { user: { select: { id: true, fullName: true, email: true } }, plan: true, receipts: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveBankTransfer(paymentId: string, adminUserId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.paymentMethod !== "BANK_TRANSFER") throw new BadRequestException("Not a bank transfer payment");

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", adminApproved: true, approvedBy: adminUserId, approvedAt: new Date() },
    });

    await this.prisma.paymentReceipt.updateMany({
      where: { paymentId },
      data: { verified: true },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        paymentId,
        status: "APPROVED_BY_ADMIN",
        amount: payment.amount,
        currency: payment.currency,
        response: { approvedBy: adminUserId, approvedAt: new Date().toISOString() },
      },
    });

    if (payment.planId) {
      await this.subscriptionsService.activateSubscription(payment.userId, payment.planId);
    }

    return { success: true, payment: updated, message: "Bank transfer approved and subscription activated" };
  }

  async rejectBankTransfer(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException("Payment not found");

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED" },
    });
  }
}
