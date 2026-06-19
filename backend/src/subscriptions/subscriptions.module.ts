import { Module, forwardRef } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionGuard } from "./subscription.guard";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionGuard],
  exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule {}
