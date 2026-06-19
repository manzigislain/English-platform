import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ListeningService {
  constructor(private prisma: PrismaService) {}

  async getQuestions(lessonId: string) {
    return this.prisma.listeningQuestion.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async submitAttempt(userId: string, questionId: string, answer: string) {
    const question = await this.prisma.listeningQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException("Question not found");

    let isCorrect = false;
    if (question.type === "MULTIPLE_CHOICE") {
      isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    } else if (question.type === "FILL_BLANK") {
      isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    } else if (question.type === "SHORT_ANSWER") {
      // For short answer, do relaxed matching
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
      isCorrect = normalizedAnswer === normalizedCorrect || normalizedAnswer.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedAnswer);
    }

    const score = isCorrect ? question.points : 0;

    const attempt = await this.prisma.listeningAttempt.create({
      data: {
        userId,
        questionId,
        answer,
        isCorrect,
        score,
      },
    });

    return { attempt, isCorrect, score, correctAnswer: question.correctAnswer };
  }

  async getAttempts(userId: string, lessonId: string) {
    return this.prisma.listeningAttempt.findMany({
      where: {
        userId,
        question: { lessonId },
      },
      include: { question: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLessonScore(userId: string, lessonId: string) {
    const questions = await this.prisma.listeningQuestion.findMany({
      where: { lessonId },
    });

    if (questions.length === 0) return { score: 0, total: 0, percentage: 0 };

    const attempts = await this.prisma.listeningAttempt.findMany({
      where: {
        userId,
        question: { lessonId },
      },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  async createQuestion(data: {
    lessonId: string;
    type: string;
    question: string;
    audioUrl: string;
    correctAnswer: string;
    options?: any;
    points?: number;
    order?: number;
  }) {
    return this.prisma.listeningQuestion.create({
      data: {
        lessonId: data.lessonId,
        type: data.type as any,
        question: data.question,
        audioUrl: data.audioUrl,
        correctAnswer: data.correctAnswer,
        options: data.options || undefined,
        points: data.points || 10,
        order: data.order || 0,
      },
    });
  }

  async updateQuestion(id: string, data: any) {
    return this.prisma.listeningQuestion.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    return this.prisma.listeningQuestion.delete({ where: { id } });
  }
}
