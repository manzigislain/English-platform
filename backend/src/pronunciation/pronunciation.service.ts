import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UploadService } from "../upload/upload.service";
import { TranscriptionService } from "../transcription/transcription.service";
import { TtsService } from "../tts/tts.service";

@Injectable()
export class PronunciationService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private transcriptionService: TranscriptionService,
    private ttsService: TtsService,
  ) {}

  async getActivities(lessonId: string) {
    return this.prisma.pronunciationActivity.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async submitAttempt(
    userId: string,
    activityId: string,
    audioBuffer?: Buffer,
  ) {
    const activity = await this.prisma.pronunciationActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException("Pronunciation activity not found");

    let audioUrl: string | undefined;
    let transcript = "";
    let accuracy = 0;
    let score = 0;

    if (audioBuffer) {
      const result = await this.uploadService.uploadAudio(
        audioBuffer,
        `pronunciation-${userId}-${Date.now()}`,
        "english-platform/pronunciation",
      );
      audioUrl = result.url;

      // Use Whisper for speech-to-text
      try {
        const whisperResult = await this.transcriptionService.transcribeAudio(
          audioBuffer,
          `pronunciation-${Date.now()}.webm`,
        );
        transcript = whisperResult.transcript;

        // Compare against the expected word
        const scoring = this.transcriptionService.scorePronunciation(
          transcript,
          activity.word,
        );
        accuracy = scoring.accuracy;
        score = Math.round((accuracy / 100) * activity.points);
      } catch (err) {
        console.error("Whisper transcription failed:", err);
      }
    }

    const attempt = await this.prisma.pronunciationAttempt.create({
      data: {
        userId,
        activityId,
        audioUrl,
        transcript,
        accuracy,
        score,
        completed: true,
      },
    });

    return { attempt, accuracy, score, transcript };
  }

  async getAttempts(userId: string, lessonId: string) {
    return this.prisma.pronunciationAttempt.findMany({
      where: { userId, activity: { lessonId } },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLessonScore(userId: string, lessonId: string) {
    const activities = await this.prisma.pronunciationActivity.findMany({
      where: { lessonId },
    });
    if (activities.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.pronunciationAttempt.findMany({
      where: { userId, activity: { lessonId } },
    });

    const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  // ============= ADMIN CRUD =============

  async createActivity(data: {
    lessonId: string; word: string; dariWord?: string;
    vocabularyId?: string; points?: number; order?: number;
  }) {
    const activity = await this.prisma.pronunciationActivity.create({
      data: {
        lessonId: data.lessonId,
        word: data.word,
        dariWord: data.dariWord,
        vocabularyId: data.vocabularyId,
        points: data.points || 10,
        order: data.order || 0,
      },
    });

    // Auto-generate pronunciation audio using AI TTS
    try {
      const audioBuffer = await this.ttsService.generateSpeech(data.word);
      const safeName = data.word.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const result = await this.uploadService.uploadAudio(
        audioBuffer,
        `pronunciation-${safeName}-${Date.now()}`,
        "english-platform/pronunciation",
      );
      await this.prisma.pronunciationActivity.update({
        where: { id: activity.id },
        data: { audioUrl: result.url },
      });
    } catch (err) {
      console.error("TTS generation failed for pronunciation:", data.word, err);
    }

    return this.prisma.pronunciationActivity.findUnique({
      where: { id: activity.id },
    });
  }

  async updateActivity(id: string, data: any) {
    return this.prisma.pronunciationActivity.update({ where: { id }, data });
  }

  async deleteActivity(id: string) {
    return this.prisma.pronunciationActivity.delete({ where: { id } });
  }
}
