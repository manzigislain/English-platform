import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReadingService {
  constructor(private prisma: PrismaService) {}

  async getActivities(lessonId: string) {
    return this.prisma.readingActivity.findMany({
      where: { lessonId },
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async getActivity(id: string) {
    const activity = await this.prisma.readingActivity.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!activity) throw new NotFoundException("Reading activity not found");
    return activity;
  }

  async submitAttempt(userId: string, questionId: string, answer: string) {
    const question = await this.prisma.readingQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException("Question not found");

    let isCorrect = false;
    if (question.type === "TRUE_FALSE") {
      isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    } else if (question.type === "MULTIPLE_CHOICE" || question.type === "MATCHING") {
      isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    }

    const score = isCorrect ? question.points : 0;

    const attempt = await this.prisma.readingAttempt.create({
      data: { userId, questionId, answer, isCorrect, score },
    });

    return { attempt, isCorrect, score, correctAnswer: question.correctAnswer };
  }

  async getAttempts(userId: string, lessonId: string) {
    return this.prisma.readingAttempt.findMany({
      where: { userId, question: { activity: { lessonId } } },
      include: { question: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLessonScore(userId: string, lessonId: string) {
    const activities = await this.prisma.readingActivity.findMany({
      where: { lessonId },
      include: { questions: true },
    });
    const questions = activities.flatMap((a) => a.questions);
    if (questions.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.readingAttempt.findMany({
      where: { userId, question: { activity: { lessonId } } },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  // ============= ADMIN CRUD =============

  async createActivity(data: {
    lessonId: string; title: string; dariTitle?: string;
    passage: string; dariPassage?: string; imageUrl?: string;
  }) {
    return this.prisma.readingActivity.create({ data });
  }

  async updateActivity(id: string, data: any) {
    return this.prisma.readingActivity.update({ where: { id }, data });
  }

  async deleteActivity(id: string) {
    return this.prisma.readingActivity.delete({ where: { id } });
  }

  async addQuestion(data: {
    activityId: string; type: string; question: string;
    dariQuestion?: string; options?: any; correctAnswer: string;
    points?: number; order?: number;
  }) {
    return this.prisma.readingQuestion.create({
      data: {
        activityId: data.activityId,
        type: data.type as any,
        question: data.question,
        dariQuestion: data.dariQuestion,
        options: data.options || undefined,
        correctAnswer: data.correctAnswer,
        points: data.points || 10,
        order: data.order || 0,
      },
    });
  }

  async updateQuestion(id: string, data: any) {
    return this.prisma.readingQuestion.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    return this.prisma.readingQuestion.delete({ where: { id } });
  }
}
