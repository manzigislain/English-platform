import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UploadService } from "../upload/upload.service";
import { PrismaService } from "../prisma/prisma.service";
import * as path from "path";

@Controller("admin/audio")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminAudioController {
  constructor(
    private uploadService: UploadService,
    private prisma: PrismaService,
  ) {}

  // ======================== VOCABULARY AUDIO ========================

  @Post("vocabulary/:id")
  @UseInterceptors(FileInterceptor("audio"))
  async uploadVocabularyAudio(
    @Param("id") id: string,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio) throw new BadRequestException("Audio file is required");
    if (!audio.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are allowed");
    }

    const vocab = await this.prisma.vocabulary.findUnique({ where: { id } });
    if (!vocab) throw new NotFoundException("Vocabulary word not found");

    // Delete existing audio if any
    const existingAudio = await this.prisma.vocabularyAudio.findUnique({
      where: { vocabularyId: id },
    });
    if (existingAudio?.audioUrl) {
      const publicId = this.extractPublicId(existingAudio.audioUrl);
      if (publicId) await this.uploadService.deleteAudioFile(publicId).catch(() => {});
      await this.prisma.vocabularyAudio.delete({ where: { id: existingAudio.id } }).catch(() => {});
    }

    // Upload new audio to Cloudinary
    const safeName = vocab.englishWord.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const result = await this.uploadService.uploadAudio(
      audio.buffer,
      `vocab-${safeName}-${Date.now()}`,
      "english-platform/audio/vocabulary",
    );

    // Save to VocabularyAudio table
    const vocabAudio = await this.prisma.vocabularyAudio.create({
      data: {
        vocabularyId: id,
        audioUrl: result.url,
        fileSize: audio.size,
        duration: Math.round(audio.buffer.length / 16000),
      },
    });

    // Also create a Media record so media center can list this file
    await this.prisma.media.create({
      data: {
        mediaType: "VOCABULARY_AUDIO",
        fileUrl: result.url,
        lessonId: vocab.lessonId,
        activityId: id,
        createdBy: "admin",
      },
    });

    return { success: true, audio: vocabAudio, publicId: result.publicId };
  }

  @Delete("vocabulary/:id")
  async deleteVocabularyAudio(@Param("id") id: string) {
    const existingAudio = await this.prisma.vocabularyAudio.findUnique({
      where: { vocabularyId: id },
    });
    if (!existingAudio) throw new NotFoundException("No audio found for this vocabulary word");

    const publicId = this.extractPublicId(existingAudio.audioUrl);
    if (publicId) await this.uploadService.deleteAudioFile(publicId);

    await this.prisma.vocabularyAudio.delete({ where: { id: existingAudio.id } });

    return { success: true, message: "Audio deleted" };
  }

  // ======================== LISTENING QUESTION AUDIO ========================

  @Post("listening/:id")
  @UseInterceptors(FileInterceptor("audio"))
  async uploadListeningAudio(
    @Param("id") id: string,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio) throw new BadRequestException("Audio file is required");
    if (!audio.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are allowed");
    }

    const question = await this.prisma.listeningQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException("Listening question not found");

    // Delete old audio from Cloudinary if updating
    if (question.audioUrl) {
      const oldPublicId = this.extractPublicId(question.audioUrl);
      if (oldPublicId) await this.uploadService.deleteAudioFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadService.uploadAudio(
      audio.buffer,
      `listening-${id}-${Date.now()}`,
      "english-platform/audio/listening",
    );

    await this.prisma.listeningQuestion.update({
      where: { id },
      data: { audioUrl: result.url },
    });

    // Create media record for listening audio
    await this.prisma.media.create({
      data: {
        mediaType: "LISTENING_AUDIO",
        fileUrl: result.url,
        lessonId: question.lessonId,
        activityId: id,
        createdBy: "admin",
      },
    });

    return { success: true, url: result.url, publicId: result.publicId };
  }

  @Delete("listening/:id")
  async deleteListeningAudio(@Param("id") id: string) {
    const question = await this.prisma.listeningQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException("Listening question not found");
    if (!question.audioUrl) throw new NotFoundException("No audio for this question");

    const publicId = this.extractPublicId(question.audioUrl);
    if (publicId) await this.uploadService.deleteAudioFile(publicId);

    await this.prisma.listeningQuestion.update({
      where: { id },
      data: { audioUrl: "" },
    });

    return { success: true, message: "Audio deleted" };
  }

  // ======================== DIALOGUE LINE AUDIO ========================

  @Post("dialogue/:id")
  @UseInterceptors(FileInterceptor("audio"))
  async uploadDialogueAudio(
    @Param("id") id: string,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio) throw new BadRequestException("Audio file is required");
    if (!audio.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are allowed");
    }

    const line = await this.prisma.dialogueLine.findUnique({ where: { id } });
    if (!line) throw new NotFoundException("Dialogue line not found");

    // Delete old audio
    if (line.audioUrl) {
      const oldPublicId = this.extractPublicId(line.audioUrl);
      if (oldPublicId) await this.uploadService.deleteAudioFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadService.uploadAudio(
      audio.buffer,
      `dialogue-${id}-${Date.now()}`,
      "english-platform/audio/dialogues",
    );

    await this.prisma.dialogueLine.update({
      where: { id },
      data: { audioUrl: result.url },
    });

    // Also create media record for this dialogue audio (attach to lesson via dialogue)
    const dialogue = await this.prisma.dialogue.findUnique({ where: { id: line.dialogueId } });
    if (dialogue) {
      await this.prisma.media.create({
        data: {
          mediaType: "DIALOGUE_AUDIO",
          fileUrl: result.url,
          lessonId: dialogue.lessonId,
          activityId: id,
          createdBy: "admin",
        },
      }).catch(() => {});
    }

    return { success: true, url: result.url, publicId: result.publicId };
  }

  @Delete("dialogue/:id")
  async deleteDialogueAudio(@Param("id") id: string) {
    const line = await this.prisma.dialogueLine.findUnique({ where: { id } });
    if (!line) throw new NotFoundException("Dialogue line not found");
    if (!line.audioUrl) throw new NotFoundException("No audio for this dialogue line");

    const publicId = this.extractPublicId(line.audioUrl);
    if (publicId) await this.uploadService.deleteAudioFile(publicId);

    await this.prisma.dialogueLine.update({
      where: { id },
      data: { audioUrl: null },
    });

    return { success: true, message: "Audio deleted" };
  }

  // ======================== SPEAKING QUESTION AUDIO ========================

  @Post("speaking/:id")
  @UseInterceptors(FileInterceptor("audio"))
  async uploadSpeakingAudio(
    @Param("id") id: string,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio) throw new BadRequestException("Audio file is required");
    if (!audio.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are allowed");
    }

    const question = await this.prisma.speakingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException("Speaking question not found");

    if (question.audioUrl) {
      const oldPublicId = this.extractPublicId(question.audioUrl);
      if (oldPublicId) await this.uploadService.deleteAudioFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadService.uploadAudio(
      audio.buffer,
      `speaking-q-${id}-${Date.now()}`,
      "english-platform/audio/speaking",
    );

    await this.prisma.speakingQuestion.update({
      where: { id },
      data: { audioUrl: result.url },
    });

    // Create media record for speaking audio
    await this.prisma.media.create({
      data: {
        mediaType: "SPEAKING_AUDIO",
        fileUrl: result.url,
        lessonId: question.lessonId,
        activityId: id,
        createdBy: "admin",
      },
    }).catch(() => {});

    return { success: true, url: result.url, publicId: result.publicId };
  }

  @Delete("speaking/:id")
  async deleteSpeakingAudio(@Param("id") id: string) {
    const question = await this.prisma.speakingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException("Speaking question not found");
    if (!question.audioUrl) throw new NotFoundException("No audio for this question");

    const publicId = this.extractPublicId(question.audioUrl);
    if (publicId) await this.uploadService.deleteAudioFile(publicId);

    await this.prisma.speakingQuestion.update({
      where: { id },
      data: { audioUrl: null },
    });

    return { success: true, message: "Audio deleted" };
  }

  // ======================== VIDEO UPLOAD ========================

  @Post("video/:lessonId")
  @UseInterceptors(FileInterceptor("video"))
  async uploadLessonVideo(
    @Param("lessonId") lessonId: string,
    @UploadedFile() video?: Express.Multer.File,
  ) {
    if (!video) throw new BadRequestException("Video file is required");
    if (!video.mimetype.startsWith("video/")) {
      throw new BadRequestException("Only video files are allowed");
    }

    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("Lesson not found");

    const result = await this.uploadService.uploadVideo(
      video.buffer,
      `lesson-video-${lessonId}-${Date.now()}`,
      "english-platform/videos/lessons",
    );

    // Save to Media table
    await this.prisma.media.create({
      data: {
        mediaType: "LESSON_VIDEO",
        fileUrl: result.url,
        lessonId: lessonId,
        createdBy: "admin",
      },
    });

    return { success: true, url: result.url, publicId: result.publicId };
  }

  @Post("video/speaking/:questionId")
  @UseInterceptors(FileInterceptor("video"))
  async uploadSpeakingVideo(
    @Param("questionId") questionId: string,
    @UploadedFile() video?: Express.Multer.File,
  ) {
    if (!video) throw new BadRequestException("Video file is required");
    if (!video.mimetype.startsWith("video/")) {
      throw new BadRequestException("Only video files are allowed");
    }

    const question = await this.prisma.speakingQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Speaking question not found");

    const result = await this.uploadService.uploadVideo(
      video.buffer,
      `speaking-video-${questionId}-${Date.now()}`,
      "english-platform/videos/speaking",
    );

    // Update the speaking question with video URL
    await this.prisma.speakingQuestion.update({
      where: { id: questionId },
      data: { videoUrl: result.url },
    });

    // Save to Media table
    await this.prisma.media.create({
      data: {
        mediaType: "SPEAKING_VIDEO",
        fileUrl: result.url,
        lessonId: question.lessonId,
        activityId: questionId,
        createdBy: "admin",
      },
    });

    return { success: true, url: result.url, publicId: result.publicId };
  }

  // ======================== SPEAKING PROMPT AUDIO UPLOAD ========================

  @Post("speaking-prompt/:questionId")
  @UseInterceptors(FileInterceptor("audio"))
  async uploadSpeakingPromptAudio(
    @Param("questionId") questionId: string,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio) throw new BadRequestException("Audio file is required");
    if (!audio.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are allowed");
    }

    const question = await this.prisma.speakingQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Speaking question not found");

    // Delete old audio
    if (question.audioUrl) {
      const oldPublicId = this.extractPublicId(question.audioUrl);
      if (oldPublicId) await this.uploadService.deleteAudioFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadService.uploadAudio(
      audio.buffer,
      `speaking-prompt-${questionId}-${Date.now()}`,
      "english-platform/audio/speaking",
    );

    await this.prisma.speakingQuestion.update({
      where: { id: questionId },
      data: { audioUrl: result.url },
    });

    // Save to Media table
    await this.prisma.media.create({
      data: {
        mediaType: "SPEAKING_AUDIO",
        fileUrl: result.url,
        lessonId: question.lessonId,
        activityId: questionId,
        createdBy: "admin",
      },
    });

    return { success: true, url: result.url, publicId: result.publicId };
  }

  // ======================== GENERIC AUDIO UPLOAD ========================

  @Post("upload")
  @UseInterceptors(FileInterceptor("audio"))
  async uploadGenericAudio(
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio) throw new BadRequestException("Audio file is required");
    if (!audio.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are allowed");
    }

    const result = await this.uploadService.uploadAudio(
      audio.buffer,
      `generic-${Date.now()}`,
      "english-platform/audio/generic",
    );

    return { success: true, url: result.url, publicId: result.publicId };
  }

  // ======================== HELPERS ========================

  /**
   * Extract Cloudinary public ID from a URL
   */
  private extractPublicId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      // Find the part after "upload" in the path
      const uploadIndex = pathParts.indexOf("upload");
      if (uploadIndex === -1) return null;
      // The public ID is everything after "upload/v1234567/" (version can vary)
      const afterUpload = pathParts.slice(uploadIndex + 1).join("/");
      // Remove version prefix like "v1234567/"
      const withoutVersion = afterUpload.replace(/^v\d+\//, "");
      // Remove file extension
      return withoutVersion.replace(/\.[^/.]+$/, "");
    } catch {
      return null;
    }
  }
}
