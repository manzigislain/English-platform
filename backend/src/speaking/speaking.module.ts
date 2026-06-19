import { Module } from "@nestjs/common";
import { SpeakingController } from "./speaking.controller";
import { SpeakingService } from "./speaking.service";
import { UploadModule } from "../upload/upload.module";
import { TranscriptionModule } from "../transcription/transcription.module";

@Module({
  imports: [UploadModule, TranscriptionModule],
  controllers: [SpeakingController],
  providers: [SpeakingService],
})
export class SpeakingModule {}
