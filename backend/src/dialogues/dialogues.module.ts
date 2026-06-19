import { Module } from "@nestjs/common";
import { DialoguesController } from "./dialogues.controller";
import { DialoguesService } from "./dialogues.service";

@Module({
  controllers: [DialoguesController],
  providers: [DialoguesService],
})
export class DialoguesModule {}
