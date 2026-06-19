import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UploadService } from "../upload/upload.service";
import { TranscriptionService } from "../transcription/transcription.service";

@Injectable()
export class SpeakingService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private transcriptionService: TranscriptionService,
  ) {}

  async getQuestions(lessonId: string) {
    return this.prisma.speakingQuestion.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async submitAttempt(
    userId: string,
    questionId: string,
    audioBuffer?: Buffer,
    transcript?: string,
  ) {
    const question = await this.prisma.speakingQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException("Question not found");

    let audioUrl: string | undefined;
    let finalTranscript = transcript || "";
    let accuracy = 0;
    let pronunciationScore = 0;
    let matchedWords: string[] = [];
    let missedWords: string[] = [];

    if (audioBuffer) {
      const result = await this.uploadService.uploadAudio(
        audioBuffer,
        `speaking-${userId}-${Date.now()}`,
        "english-platform/speaking",
      );
      audioUrl = result.url;

      await this.prisma.speakingRecording.create({
        data: {
          userId,
          audioUrl: result.url,
          duration: Math.round(audioBuffer.length / 16000),
          fileSize: audioBuffer.length,
        },
      });

      // Use OpenAI Whisper for real speech-to-text transcription
      try {
        const whisperResult = await this.transcriptionService.transcribeAudio(
          audioBuffer,
          `speaking-${userId}-${Date.now()}.webm`,
        );
        finalTranscript = whisperResult.transcript;

        // Score pronunciation by comparing Whisper transcript against expected answer
        if (question.expectedAnswer) {
          const scoring = this.transcriptionService.scorePronunciation(
            finalTranscript,
            question.expectedAnswer,
          );
          accuracy = scoring.accuracy;
          pronunciationScore = scoring.pronunciationScore;
          matchedWords = scoring.matchedWords;
          missedWords = scoring.missedWords;
        }
      } catch (err) {
        console.error("Whisper transcription failed, using browser transcript if available:", err);
        // Fallback to basic scoring with browser transcript
        if (transcript && question.expectedAnswer) {
          const normalizedTranscript = transcript.toLowerCase().trim();
          const normalizedExpected = question.expectedAnswer.toLowerCase().trim();
          const words = normalizedExpected.split(/\s+/);
          const matched = words.filter((w) => normalizedTranscript.includes(w));
          accuracy = Math.round((matched.length / words.length) * 100);
          pronunciationScore = accuracy;
        }
      }
    } else if (transcript && question.expectedAnswer) {
      // No audio but transcript provided - use basic scoring
      const normalizedTranscript = transcript.toLowerCase().trim();
      const normalizedExpected = question.expectedAnswer.toLowerCase().trim();
      const words = normalizedExpected.split(/\s+/);
      const matched = words.filter((w) => normalizedTranscript.includes(w));
      accuracy = Math.round((matched.length / words.length) * 100);
      pronunciationScore = accuracy;
    }

    const score = Math.round((accuracy / 100) * question.points);

    const attempt = await this.prisma.speakingAttempt.create({
      data: {
        userId,
        questionId,
        transcript: finalTranscript,
        audioUrl,
        accuracy,
        pronunciationScore,
        score,
        completed: true,
      },
    });

    return {
      attempt,
      accuracy,
      pronunciationScore,
      score,
      transcript: finalTranscript,
      matchedWords,
      missedWords,
    };
  }

  async getAttempts(userId: string, lessonId: string) {
    return this.prisma.speakingAttempt.findMany({
      where: {
        userId,
        question: { lessonId },
      },
      include: { question: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLessonScore(userId: string, lessonId: string) {
    const questions = await this.prisma.speakingQuestion.findMany({
      where: { lessonId },
    });

    if (questions.length === 0) return { score: 0, total: 0, percentage: 0 };

    const attempts = await this.prisma.speakingAttempt.findMany({
      where: {
        userId,
        question: { lessonId },
      },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const avgAccuracy = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)
      : 0;

    return { score: earnedPoints, total: totalPoints, percentage, avgAccuracy };
  }

  async createQuestion(data: {
    lessonId: string;
    type: string;
    question: string;
    expectedAnswer?: string;
    audioUrl?: string;
    points?: number;
    order?: number;
  }) {
    return this.prisma.speakingQuestion.create({
      data: {
        lessonId: data.lessonId,
        type: data.type as any,
        question: data.question,
        expectedAnswer: data.expectedAnswer,
        audioUrl: data.audioUrl,
        points: data.points || 10,
        order: data.order || 0,
      },
    });
  }

  async updateQuestion(id: string, data: any) {
    return this.prisma.speakingQuestion.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    return this.prisma.speakingQuestion.delete({ where: { id } });
  }
}
