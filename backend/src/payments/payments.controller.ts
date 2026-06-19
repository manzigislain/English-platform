import { BadRequestException, Controller, Get, Post, Param, Body, Req, UseGuards } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("payments")
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService,
    private prisma: PrismaService,
  ) {}

  // ===================== STRIPE ENDPOINTS =====================

  @UseGuards(JwtAuthGuard)
  @Post("stripe/checkout")
  async createStripeCheckout(
    @Req() req: any,
    @Body() body: { planId: string; successUrl?: string; cancelUrl?: string },
  ) {
    const user = req.user;
    const plan = await this.prisma.plan.findUnique({ where: { id: body.planId } });

    if (!plan || !plan.stripePriceId) {
      throw new BadRequestException("Plan not found or Stripe Price ID not configured");
    }

    const session = await this.stripeService.createCheckoutSession(
      { id: user.id, email: user.email, fullName: user.fullName },
      plan,
      body.successUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payments/success`,
      body.cancelUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payments/cancel`,
    );

    return { sessionId: session.id, url: session.url };
  }

  @Public()
  @Post("stripe/webhook")
  async handleStripeWebhook(@Req() req: RawBodyRequest<any>) {
    const signature = req.headers["stripe-signature"] as string;
    const rawBody = req.rawBody;

    const event = this.stripeService.verifyWebhookSignature(rawBody, signature);
    const webhook = await this.stripeService.recordWebhookReceived(event);
    if (webhook.alreadyProcessed) return { received: true, duplicate: true };

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.stripeService.handleCheckoutSessionCompleted(event.data.object.id);
          break;

        case "customer.subscription.created":
          await this.stripeService.handleSubscriptionCreated(event.data.object);
          break;

        case "customer.subscription.updated":
          await this.stripeService.handleSubscriptionUpdated(event.data.object);
          break;

        case "customer.subscription.deleted":
          await this.stripeService.handleSubscriptionDeleted(event.data.object.id);
          break;

        case "invoice.paid":
          await this.stripeService.handleInvoicePaid(event.data.object);
          break;

        case "invoice.payment_failed":
          await this.stripeService.handleInvoicePaymentFailed(event.data.object);
          break;

        case "customer.deleted":
          await this.stripeService.handleCustomerDeleted(event.data.object.id);
          break;
      }

      await this.stripeService.markWebhookProcessed(webhook.id);
    } catch (error) {
      await this.stripeService.markWebhookFailed(webhook.id, error);
      throw error;
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("stripe/checkout/:sessionId")
  async getStripeCheckoutStatus(@Param("sessionId") sessionId: string, @Req() req: any) {
    return this.stripeService.getCheckoutStatus(sessionId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("stripe/portal")
  async createCustomerPortal(@Req() req: any, @Body() body: { returnUrl?: string }) {
    return this.stripeService.createCustomerPortalSession(req.user.id, body.returnUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get("invoices/my")
  async getMyInvoices(@Req() req: any) {
    return this.stripeService.getUserInvoices(req.user.id);
  }

  // ===================== LEGACY PAYPAL ENDPOINTS =====================

  @UseGuards(JwtAuthGuard)
  @Post("create-paypal-order")
  async createPayPalOrder(@Req() req: any, @Body() body: { planId: string }) {
    return this.paymentsService.createPayPalOrder(req.user.id, body.planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("capture-paypal-order")
  async capturePayPalOrder(@Req() req: any, @Body() body: { paymentId: string; paypalOrderId: string }) {
    return this.paymentsService.capturePayPalOrder(body.paymentId, body.paypalOrderId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("bank-transfer")
  async createBankTransfer(
    @Req() req: any,
    @Body() body: { planId: string; receiptUrl: string; notes?: string },
  ) {
    return this.paymentsService.createBankTransferPayment(req.user.id, body.planId, body.receiptUrl, body.notes);
  }

  @UseGuards(JwtAuthGuard)
  @Get("status/:id")
  async getPaymentStatus(@Param("id") id: string, @Req() req: any) {
    return this.paymentsService.getPaymentStatus(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my")
  async getMyPayments(@Req() req: any) {
    return this.paymentsService.getUserPayments(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get()
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get("pending-transfers")
  async getPendingTransfers() {
    return this.paymentsService.getPendingBankTransfers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post(":id/approve")
  async approveTransfer(@Param("id") id: string, @Req() req: any) {
    return this.paymentsService.approveBankTransfer(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post(":id/reject")
  async rejectTransfer(@Param("id") id: string) {
    return this.paymentsService.rejectBankTransfer(id);
  }
}
