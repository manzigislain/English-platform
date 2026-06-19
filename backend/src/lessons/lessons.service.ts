import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, status: "PUBLISHED" },
      include: {
        unit: { select: { id: true, title: true, dariTitle: true, course: { select: { id: true, title: true } } } },
        vocabularies: {
          include: { audio: true },
        },
        writingQuestions: { orderBy: { order: "asc" } },
        speakingQuestions: { orderBy: { order: "asc" } },
        listeningQuestions: { orderBy: { order: "asc" } },
        dialogues: {
          include: { lines: { orderBy: { order: "asc" } } },
        },
        readingActivities: {
          include: { questions: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "asc" },
        },
        pronunciationActivities: { orderBy: { order: "asc" } },
        quizzes: {
          include: { questions: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        exercises: { orderBy: { order: "asc" } },
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");
    return lesson;
  }

  async completeLesson(userId: string, lessonId: string, score: number, accuracy: number) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, status: "PUBLISHED" } });
    if (!lesson) throw new NotFoundException("Lesson not found");

    const xpEarned = Math.round(score * (accuracy / 100));
    const completed = accuracy >= 60;

    await this.prisma.lessonAttempt.create({
      data: { userId, lessonId, score, accuracy, xpEarned, completed },
    });

    await this.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completed, score, xpEarned: { increment: xpEarned }, completedAt: completed ? new Date() : undefined },
      create: { userId, lessonId, completed, score, xpEarned },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned } },
    });

    await this.updateStreak(userId);

    return { xpEarned, completed, accuracy, score };
  }

  /**
   * Check if a lesson is fully completed based on the 6-section rule:
   * Reading >= 70%, Speaking >= 70%, Listening >= 70%, Writing >= 70%,
   * Pronunciation >= 70%, Quiz >= 70%
   */
  async checkLessonCompletion(userId: string, lessonId: string) {
    const [readingScore, writingScore, speakingScore, listeningScore, pronunciationScore, quizScore] = await Promise.all([
      this.getReadingScore(userId, lessonId),
      this.getWritingScore(userId, lessonId),
      this.getSpeakingScore(userId, lessonId),
      this.getListeningScore(userId, lessonId),
      this.getPronunciationScore(userId, lessonId),
      this.getQuizScore(userId, lessonId),
    ]);

    const readingPassed = readingScore.percentage >= 70;
    const writingPassed = writingScore.percentage >= 70;
    const speakingPassed = speakingScore.percentage >= 70;
    const listeningPassed = listeningScore.percentage >= 70;
    const pronunciationPassed = pronunciationScore.percentage >= 70;
    const quizPassed = quizScore.percentage >= 70;

    const allPassed = readingPassed && writingPassed && speakingPassed && listeningPassed && pronunciationPassed && quizPassed;

    if (allPassed) {
      const totalPercentage = Math.round(
        (readingScore.percentage + writingScore.percentage + speakingScore.percentage +
          listeningScore.percentage + pronunciationScore.percentage + quizScore.percentage) / 6
      );
      const xpEarned = Math.round(totalPercentage * 2);

      await this.prisma.lessonAttempt.create({
        data: { userId, lessonId, score: totalPercentage, accuracy: totalPercentage, xpEarned, completed: true },
      });

      await this.prisma.userProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { completed: true, score: totalPercentage, xpEarned: { increment: xpEarned }, completedAt: new Date() },
        create: { userId, lessonId, completed: true, score: totalPercentage, xpEarned },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpEarned } },
      });

      await this.updateStreak(userId);

      return {
        completed: true,
        xpEarned,
        sections: {
          reading: readingScore, writing: writingScore, speaking: speakingScore,
          listening: listeningScore, pronunciation: pronunciationScore, quiz: quizScore,
        },
      };
    }

    return {
      completed: false,
      xpEarned: 0,
      sections: {
        reading: { ...readingScore, passed: readingPassed },
        writing: { ...writingScore, passed: writingPassed },
        speaking: { ...speakingScore, passed: speakingPassed },
        listening: { ...listeningScore, passed: listeningPassed },
        pronunciation: { ...pronunciationScore, passed: pronunciationPassed },
        quiz: { ...quizScore, passed: quizPassed },
      },
    };
  }

  private async getReadingScore(userId: string, lessonId: string) {
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

  private async getWritingScore(userId: string, lessonId: string) {
    const questions = await this.prisma.writingQuestion.findMany({ where: { lessonId } });
    if (questions.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.writingAttempt.findMany({
      where: { userId, question: { lessonId } },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  private async getSpeakingScore(userId: string, lessonId: string) {
    const questions = await this.prisma.speakingQuestion.findMany({ where: { lessonId } });
    if (questions.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.speakingAttempt.findMany({
      where: { userId, question: { lessonId } },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  private async getListeningScore(userId: string, lessonId: string) {
    const questions = await this.prisma.listeningQuestion.findMany({ where: { lessonId } });
    if (questions.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.listeningAttempt.findMany({
      where: { userId, question: { lessonId } },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  private async getPronunciationScore(userId: string, lessonId: string) {
    const activities = await this.prisma.pronunciationActivity.findMany({ where: { lessonId } });
    if (activities.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.pronunciationAttempt.findMany({
      where: { userId, activity: { lessonId } },
    });

    const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  private async getQuizScore(userId: string, lessonId: string) {
    const quiz = await this.prisma.quiz.findFirst({ where: { lessonId } });
    if (!quiz) return { score: 0, total: 0, percentage: 100 };

    const questions = await this.prisma.quizQuestion.findMany({ where: { quizId: quiz.id } });
    if (questions.length === 0) return { score: 0, total: 0, percentage: 100 };

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, quizId: quiz.id },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score: earnedPoints, total: totalPoints, percentage };
  }

  private async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const lastActive = user.lastActiveDate;
    let newStreak = user.dailyStreak;

    if (!lastActive || lastActive < yesterday) {
      newStreak = 1;
    } else if (lastActive >= yesterday && lastActive < today) {
      newStreak += 1;
    }

    const streakXp = newStreak > 1 ? newStreak * 5 : 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyStreak: newStreak, lastActiveDate: today },
    });

    if (streakXp > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: streakXp } },
      });
    }

    await this.prisma.streakHistory.upsert({
      where: { userId_date: { userId, date: today } },
      update: { xpEarned: streakXp },
      create: { userId, date: today, xpEarned: streakXp },
    });
  }

  async create(data: { title: string; dariTitle: string; description: string; unitId?: string; order: number }) {
    return this.prisma.lesson.create({
      data: {
        title: data.title,
        dariTitle: data.dariTitle,
        description: data.description,
        unitId: data.unitId || undefined,
        order: data.order,
        status: "PUBLISHED",
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.lesson.update({ where: { id }, data: { status: "ARCHIVED" } });
  }
}
