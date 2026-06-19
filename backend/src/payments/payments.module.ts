import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";

@Module({
  imports: [forwardRef(() => SubscriptionsModule), ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}
