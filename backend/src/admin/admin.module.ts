import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminAudioController } from "./audio.controller";
import { AdminService } from "./admin.service";
import { UploadModule } from "../upload/upload.module";
import { TtsModule } from "../tts/tts.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [UploadModule, TtsModule, PrismaModule],
  controllers: [AdminController, AdminAudioController],
  providers: [AdminService],
})
export class AdminModule {}
