import { Controller, Get, Post, Param, Req, UseGuards, Body } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { StripeService } from "../payments/stripe.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService, private stripeService: StripeService) {}

  @Public()
  @Get("plans")
  async getAllPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post("activate-free")
  async activateFreePlan(@Req() req: any) {
    return this.subscriptionsService.activateFreePlan(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my")
  async getUserSubscriptions(@Req() req: any) {
    return this.subscriptionsService.getUserSubscriptions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("active")
  async getActiveSubscription(@Req() req: any) {
    return this.subscriptionsService.getUserSubscription(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel")
  async cancelSubscription(@Param("id") id: string, @Req() req: any) {
    return this.subscriptionsService.cancelSubscription(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel-at-stripe")
  async cancelSubscriptionAtStripe(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: { atPeriodEnd?: boolean },
  ) {
    return this.subscriptionsService.cancelSubscriptionAtStripe(req.user.id, id, body.atPeriodEnd);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/resume")
  async resumeSubscription(@Param("id") id: string, @Req() req: any) {
    return this.subscriptionsService.resumeSubscriptionAtStripe(req.user.id, id);
  }
}
