import { Module } from "@nestjs/common";
import { PronunciationController } from "./pronunciation.controller";
import { PronunciationService } from "./pronunciation.service";
import { UploadModule } from "../upload/upload.module";
import { TtsModule } from "../tts/tts.module";
import { TranscriptionModule } from "../transcription/transcription.module";

@Module({
  imports: [UploadModule, TtsModule, TranscriptionModule],
  controllers: [PronunciationController],
  providers: [PronunciationService],
  exports: [PronunciationService],
})
export class PronunciationModule {}
