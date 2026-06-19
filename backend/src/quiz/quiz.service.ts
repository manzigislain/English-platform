import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async getQuiz(lessonId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { lessonId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    return quiz;
  }

  async generateQuiz(lessonId: string, userId: string) {
    // Check if quiz already exists
    const existing = await this.prisma.quiz.findFirst({
      where: { lessonId },
      include: { questions: true },
    });
    if (existing) return existing;

    // Collect questions from all sections
    const [readingQs, vocab, writingQs, speakingQs, listeningQs] = await Promise.all([
      this.prisma.readingQuestion.findMany({
        where: { activity: { lessonId } },
        select: { id: true, type: true, question: true, options: true, correctAnswer: true, points: true },
      }),
      this.prisma.vocabulary.findMany({
        where: { lessonId },
        select: { id: true, englishWord: true, dariTranslation: true },
      }),
      this.prisma.writingQuestion.findMany({
        where: { lessonId },
        select: { id: true, type: true, question: true, options: true, correctAnswer: true, points: true },
      }),
      this.prisma.speakingQuestion.findMany({
        where: { lessonId },
        select: { id: true, type: true, question: true, expectedAnswer: true, points: true },
      }),
      this.prisma.listeningQuestion.findMany({
        where: { lessonId },
        select: { id: true, type: true, question: true, options: true, correctAnswer: true, points: true },
      }),
    ]);

    if (readingQs.length === 0 && vocab.length === 0 && writingQs.length === 0 && speakingQs.length === 0 && listeningQs.length === 0) {
      return null;
    }

    // Create quiz
    const quiz = await this.prisma.quiz.create({
      data: {
        lessonId,
        title: "End of Lesson Quiz",
        passingScore: 70,
      },
    });

    // Add reading questions
    const quizQuestions: any[] = [];
    for (const q of readingQs) {
      const qq = await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          sourceType: "READING",
          question: q.question,
          options: q.options || undefined,
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          order: quizQuestions.length + 1,
        },
      });
      quizQuestions.push(qq);
    }

    // Add vocabulary questions
    for (const v of vocab) {
      const qq = await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          sourceType: "VOCABULARY",
          question: `What is the Dari translation of "${v.englishWord}"?`,
          correctAnswer: v.dariTranslation,
          points: 10,
          order: quizQuestions.length + 1,
        },
      });
      quizQuestions.push(qq);
    }

    // Add writing questions
    for (const q of writingQs) {
      const qq = await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          sourceType: "WRITING",
          question: q.question,
          options: q.options || undefined,
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          order: quizQuestions.length + 1,
        },
      });
      quizQuestions.push(qq);
    }

    // Add speaking questions (as written questions in quiz)
    for (const q of speakingQs) {
      if (q.expectedAnswer) {
        const qq = await this.prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            sourceType: "SPEAKING",
            question: q.question,
            correctAnswer: q.expectedAnswer,
            points: q.points || 10,
            order: quizQuestions.length + 1,
          },
        });
        quizQuestions.push(qq);
      }
    }

    // Add listening questions
    for (const q of listeningQs) {
      const qq = await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          sourceType: "LISTENING",
          question: q.question,
          options: q.options || undefined,
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          order: quizQuestions.length + 1,
        },
      });
      quizQuestions.push(qq);
    }

    return this.prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  }

  async submitAttempt(userId: string, quizId: string, questionId: string, answer: string) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException("Question not found");

    let isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    const score = isCorrect ? question.points : 0;

    const attempt = await this.prisma.quizAttempt.create({
      data: { userId, quizId, questionId, answer, isCorrect, score },
    });

    return { attempt, isCorrect, score, correctAnswer: question.correctAnswer };
  }

  async getQuizScore(userId: string, quizId: string) {
    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
    });
    if (questions.length === 0) return { score: 0, total: 0, percentage: 0, passed: false };

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, quizId },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = attempts.reduce((sum, a) => sum + a.score, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return {
      score: earnedPoints,
      total: totalPoints,
      percentage,
      passed: percentage >= 70,
    };
  }
}
