import { Module } from "@nestjs/common";
import { LessonsController } from "./lessons.controller";
import { LessonsService } from "./lessons.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";

@Module({
  imports: [SubscriptionsModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
