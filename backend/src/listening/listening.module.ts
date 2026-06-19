import { Module } from "@nestjs/common";
import { ListeningController } from "./listening.controller";
import { ListeningService } from "./listening.service";
import { UploadModule } from "../upload/upload.module";

@Module({
  imports: [UploadModule],
  controllers: [ListeningController],
  providers: [ListeningService],
})
export class ListeningModule {}
