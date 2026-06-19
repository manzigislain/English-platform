import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TtsService } from "../tts/tts.service";
import { UploadService } from "../upload/upload.service";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ttsService: TtsService,
    private uploadService: UploadService,
  ) {}

  // ============= DASHBOARD =============
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      courses,
      lessons,
      posts,
      payments,
      certificates,
      totalRevenue,
      monthlyRevenue,
      activeSubscribers,
      expiredSubscribers,
      cancelledPlans,
      recentPayments,
      webhookLogs,
      invoices,
      completedLessons,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.course.count({ where: { status: "PUBLISHED" } }),
      this.prisma.lesson.count({ where: { status: "PUBLISHED" } }),
      this.prisma.communityPost.count(),
      this.prisma.payment.count(),
      this.prisma.certificate.count(),
      this.prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({ where: { status: "ACTIVE", endDate: { gte: new Date() } } }),
      this.prisma.subscription.count({ where: { status: "EXPIRED" } }),
      this.prisma.subscription.count({ where: { status: "CANCELLED" } }),
      this.prisma.payment.findMany({
        where: { status: "COMPLETED" },
        include: { user: { select: { id: true, fullName: true, email: true } }, plan: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.webhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 10 }),
      this.prisma.invoice.findMany({
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.userProgress.count({ where: { completed: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      courses,
      lessons,
      communityPosts: posts,
      payments,
      certificates,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      activeSubscribers,
      expiredSubscribers,
      cancelledPlans,
      recentPayments,
      paymentLogs: recentPayments,
      webhookLogs,
      invoices,
      completedLessons,
    };
  }

  // ============= USERS =============
  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, fullName: true, avatarUrl: true,
          role: true, xp: true, isActive: true, createdAt: true,
          dailyStreak: true, knowledgeCoins: true,
          _count: { select: { communityPosts: true, certificates: true, progress: { where: { completed: true } } } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        currentLevel: true,
        progress: { include: { lesson: true }, orderBy: { updatedAt: "desc" } },
        subscriptions: { include: { plan: true } },
        payments: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 10 },
        certificates: true,
        _count: { select: { communityPosts: true, comments: true } },
      },
    });
  }

  async updateUser(id: string, data: { fullName?: string; email?: string; role?: any; isActive?: boolean }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async suspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");
    return this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  }

  // ============= COURSES =============
  async getAllCourses() {
    return this.prisma.course.findMany({
      include: {
        level: true,
        _count: { select: { units: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async createCourse(data: {
    title: string; dariTitle: string; description: string;
    world: string; levelId: string; order: number; thumbnailUrl?: string;
  }) {
    return this.prisma.course.create({ data: { ...data, status: "PUBLISHED" } });
  }

  async updateCourse(id: string, data: any) {
    return this.prisma.course.update({ where: { id }, data });
  }

  async deleteCourse(id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  // ============= LESSONS =============
  async getAllLessons() {
    return this.prisma.lesson.findMany({
      include: {
        unit: { select: { id: true, title: true, course: { select: { title: true } } } },
        _count: { select: { vocabularies: true, writingQuestions: true, speakingQuestions: true, listeningQuestions: true, dialogues: true, readingActivities: true, pronunciationActivities: true, quizzes: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async createLesson(data: {
    title: string; dariTitle: string; description: string;
    unitId?: string; order: number;
  }) {
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

  async updateLesson(id: string, data: any) {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async deleteLesson(id: string) {
    return this.prisma.lesson.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  // ============= COMMUNITY =============
  async getPendingPosts() {
    return this.prisma.communityPost.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllPosts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        skip, take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } }, _count: { select: { comments: true, likes: true, reports: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.communityPost.count(),
    ]);
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async approvePost(postId: string) {
    return this.prisma.communityPost.update({ where: { id: postId }, data: { status: "APPROVED" } });
  }

  async rejectPost(postId: string) {
    return this.prisma.communityPost.update({ where: { id: postId }, data: { status: "REJECTED" } });
  }

  async deletePost(postId: string) {
    return this.prisma.communityPost.delete({ where: { id: postId } });
  }

  // ============= REPORTS =============
  async getReports() {
    return this.prisma.report.findMany({
      include: { user: { select: { id: true, fullName: true } }, post: { select: { id: true, title: true, content: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async dismissReport(reportId: string) {
    return this.prisma.report.delete({ where: { id: reportId } });
  }

  // ============= CERTIFICATES =============
  async getAllCertificates(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [certificates, total] = await Promise.all([
      this.prisma.certificate.findMany({
        skip, take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.certificate.count(),
    ]);
    return { certificates, total, page, totalPages: Math.ceil(total / limit) };
  }

  async revokeCertificate(id: string) {
    return this.prisma.certificate.update({ where: { id }, data: { isVerified: false } });
  }

  async verifyCertificate(id: string) {
    return this.prisma.certificate.update({ where: { id }, data: { isVerified: true } });
  }

  // ============= PAYMENTS =============
  async getAllPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip, take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } }, plan: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payment.count(),
    ]);
    return { payments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getInvoices(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          subscription: { include: { plan: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.invoice.count(),
    ]);
    return { invoices, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getWebhookEvents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({ skip, take: limit, orderBy: { receivedAt: "desc" } }),
      this.prisma.webhookEvent.count(),
    ]);
    return { events, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getSubscriptionHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
      this.prisma.subscriptionHistory.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          subscription: { include: { plan: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.subscriptionHistory.count(),
    ]);
    return { history, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPendingTransfers() {
    return this.prisma.payment.findMany({
      where: { paymentMethod: "BANK_TRANSFER", status: "PENDING", adminApproved: false },
      include: { user: { select: { id: true, fullName: true, email: true } }, plan: true, receipts: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async approvePayment(id: string, adminUserId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { plan: true } });
    if (!payment) throw new Error("Payment not found");

    await this.prisma.payment.update({
      where: { id },
      data: { status: "COMPLETED", adminApproved: true, approvedBy: adminUserId, approvedAt: new Date() },
    });

    if (payment.planId) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (payment.plan?.durationDays || 30));

      const existing = await this.prisma.subscription.findUnique({
        where: { userId_planId: { userId: payment.userId, planId: payment.planId } },
      });

      if (existing) {
        await this.prisma.subscription.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", startDate: new Date(), endDate, cancelledAt: null },
        });
      } else {
        await this.prisma.subscription.create({
          data: { userId: payment.userId, planId: payment.planId, status: "ACTIVE", startDate: new Date(), endDate },
        });
      }
    }

    return { success: true, message: "Payment approved and subscription activated" };
  }

  async rejectPayment(id: string) {
    return this.prisma.payment.update({ where: { id }, data: { status: "FAILED" } });
  }

  // ============= PLANS =============
  async getAllPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: "asc" } });
  }

  async createPlan(data: any) {
    return this.prisma.plan.create({ data });
  }

  async updatePlan(id: string, data: any) {
    return this.prisma.plan.update({ where: { id }, data });
  }

  // ============= LEVELS =============
  async getAllLevels() {
    return this.prisma.level.findMany({ orderBy: { order: "asc" } });
  }

  async createLevel(data: any) {
    return this.prisma.level.create({ data });
  }

  async updateLevel(id: string, data: any) {
    return this.prisma.level.update({ where: { id }, data });
  }

  // ============= VOCABULARY =============
  async getAllVocabulary(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        skip, take: limit,
        include: {
          lesson: { select: { title: true } },
          audio: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.vocabulary.count(),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createVocabulary(data: {
    englishWord: string; dariTranslation: string;
    pronunciationGuide?: string; exampleSentence?: string;
    lessonId: string;
  }) {
    const vocab = await this.prisma.vocabulary.create({ data });

    // Auto-generate pronunciation audio using OpenAI TTS
    try {
      const audioBuffer = await this.ttsService.generateSpeech(data.englishWord);
      const safeName = data.englishWord.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const result = await this.uploadService.uploadAudio(
        audioBuffer,
        `vocab-${safeName}-${Date.now()}`,
        "english-platform/audio/vocabulary",
      );
      await this.prisma.vocabularyAudio.create({
        data: {
          vocabularyId: vocab.id,
          audioUrl: result.url,
          fileSize: audioBuffer.length,
          duration: Math.round(audioBuffer.length / 16000),
        },
      });
    } catch (err) {
      console.error("TTS generation failed for vocabulary:", data.englishWord, err);
      // Non-blocking: vocabulary created without audio
    }

    return this.prisma.vocabulary.findUnique({
      where: { id: vocab.id },
      include: { audio: true, lesson: { select: { title: true } } },
    });
  }

  async updateVocabulary(id: string, data: any) {
    return this.prisma.vocabulary.update({ where: { id }, data });
  }

  async deleteVocabulary(id: string) {
    return this.prisma.vocabulary.delete({ where: { id } });
  }

  // ============= WRITING QUESTIONS =============
  async getWritingQuestions(lessonId: string) {
    return this.prisma.writingQuestion.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async createWritingQuestion(data: {
    lessonId: string; type: string; question: string;
    correctAnswer: string; options?: any; points?: number; order?: number;
  }) {
    return this.prisma.writingQuestion.create({
      data: {
        lessonId: data.lessonId,
        type: data.type as any,
        question: data.question,
        correctAnswer: data.correctAnswer,
        options: data.options || undefined,
        points: data.points || 10,
        order: data.order || 0,
      },
    });
  }

  async updateWritingQuestion(id: string, data: any) {
    return this.prisma.writingQuestion.update({ where: { id }, data });
  }

  async deleteWritingQuestion(id: string) {
    return this.prisma.writingQuestion.delete({ where: { id } });
  }

  // ============= SPEAKING QUESTIONS =============
  async getSpeakingQuestions(lessonId: string) {
    return this.prisma.speakingQuestion.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async createSpeakingQuestion(data: {
    lessonId: string; type: string; question: string;
    expectedAnswer?: string; audioUrl?: string; points?: number; order?: number;
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

  async updateSpeakingQuestion(id: string, data: any) {
    return this.prisma.speakingQuestion.update({ where: { id }, data });
  }

  async deleteSpeakingQuestion(id: string) {
    return this.prisma.speakingQuestion.delete({ where: { id } });
  }

  // ============= LISTENING QUESTIONS =============
  async getListeningQuestions(lessonId: string) {
    return this.prisma.listeningQuestion.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async createListeningQuestion(data: {
    lessonId: string; type: string; question: string;
    audioUrl: string; correctAnswer: string; options?: any; points?: number; order?: number;
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

  async updateListeningQuestion(id: string, data: any) {
    return this.prisma.listeningQuestion.update({ where: { id }, data });
  }

  async deleteListeningQuestion(id: string) {
    return this.prisma.listeningQuestion.delete({ where: { id } });
  }

  // ============= DIALOGUES =============
  async getDialogues(lessonId: string) {
    return this.prisma.dialogue.findMany({
      where: { lessonId },
      include: { lines: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async createDialogue(data: { lessonId: string; title: string; dariTitle?: string }) {
    return this.prisma.dialogue.create({ data });
  }

  async deleteDialogue(id: string) {
    return this.prisma.dialogue.delete({ where: { id } });
  }

  async addDialogueLine(data: {
    dialogueId: string; speaker: string; english: string;
    dari?: string; audioUrl?: string; order?: number;
  }) {
    return this.prisma.dialogueLine.create({
      data: {
        dialogueId: data.dialogueId,
        speaker: data.speaker,
        english: data.english,
        dari: data.dari,
        order: data.order || 0,
      },
    });
  }

  async updateDialogueLine(id: string, data: any) {
    return this.prisma.dialogueLine.update({ where: { id }, data });
  }

  async deleteDialogueLine(id: string) {
    return this.prisma.dialogueLine.delete({ where: { id } });
  }

  // ============= UNITS =============
  async getAllUnits() {
    return this.prisma.unit.findMany({
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { lessons: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async createUnit(data: {
    title: string; dariTitle?: string; description: string;
    dariDescription?: string; courseId: string; order: number;
  }) {
    return this.prisma.unit.create({ data: { ...data, status: "PUBLISHED" } });
  }

  async updateUnit(id: string, data: any) {
    return this.prisma.unit.update({ where: { id }, data });
  }

  async deleteUnit(id: string) {
    return this.prisma.unit.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  // ============= READING ACTIVITIES =============
  async getReadingActivities(lessonId: string) {
    return this.prisma.readingActivity.findMany({
      where: { lessonId },
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async createReadingActivity(data: {
    lessonId: string; title: string; dariTitle?: string;
    passage: string; dariPassage?: string; imageUrl?: string;
  }) {
    return this.prisma.readingActivity.create({ data });
  }

  async updateReadingActivity(id: string, data: any) {
    return this.prisma.readingActivity.update({ where: { id }, data });
  }

  async deleteReadingActivity(id: string) {
    return this.prisma.readingActivity.delete({ where: { id } });
  }

  async addReadingQuestion(data: {
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

  async updateReadingQuestion(id: string, data: any) {
    return this.prisma.readingQuestion.update({ where: { id }, data });
  }

  async deleteReadingQuestion(id: string) {
    return this.prisma.readingQuestion.delete({ where: { id } });
  }

  // ============= PRONUNCIATION ACTIVITIES =============
  async getPronunciationActivities(lessonId: string) {
    return this.prisma.pronunciationActivity.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async createPronunciationActivity(data: {
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
    // Auto-generate TTS audio
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
      console.error("TTS failed for pronunciation activity:", err);
    }
    return this.prisma.pronunciationActivity.findUnique({ where: { id: activity.id } });
  }

  async updatePronunciationActivity(id: string, data: any) {
    return this.prisma.pronunciationActivity.update({ where: { id }, data });
  }

  async deletePronunciationActivity(id: string) {
    return this.prisma.pronunciationActivity.delete({ where: { id } });
  }

  // ============= QUIZZES =============
  async getQuiz(lessonId: string) {
    return this.prisma.quiz.findFirst({
      where: { lessonId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  }

  async createQuiz(data: { lessonId: string; title: string; dariTitle?: string; passingScore?: number; timeLimit?: number }) {
    return this.prisma.quiz.create({ data });
  }

  async addQuizQuestion(data: {
    quizId: string; sourceType: string; question: string;
    dariQuestion?: string; options?: any; correctAnswer: string;
    points?: number; order?: number;
  }) {
    return this.prisma.quizQuestion.create({
      data: {
        quizId: data.quizId,
        sourceType: data.sourceType as any,
        question: data.question,
        dariQuestion: data.dariQuestion,
        options: data.options || undefined,
        correctAnswer: data.correctAnswer,
        points: data.points || 10,
        order: data.order || 0,
      },
    });
  }

  async updateQuizQuestion(id: string, data: any) {
    return this.prisma.quizQuestion.update({ where: { id }, data });
  }

  async deleteQuizQuestion(id: string) {
    return this.prisma.quizQuestion.delete({ where: { id } });
  }

  async deleteQuiz(id: string) {
    return this.prisma.quiz.delete({ where: { id } });
  }

  async generateQuiz(lessonId: string) {
    // Check if quiz exists
    const existing = await this.prisma.quiz.findFirst({
      where: { lessonId },
      include: { questions: true },
    });
    if (existing) return existing;

    // Collect questions from all sections
    const [readingQs, vocab, writingQs, speakingQs, listeningQs] = await Promise.all([
      this.prisma.readingQuestion.findMany({
        where: { activity: { lessonId } },
        select: { question: true, options: true, correctAnswer: true, points: true },
      }),
      this.prisma.vocabulary.findMany({
        where: { lessonId },
        select: { englishWord: true, dariTranslation: true },
      }),
      this.prisma.writingQuestion.findMany({
        where: { lessonId },
        select: { question: true, options: true, correctAnswer: true, points: true },
      }),
      this.prisma.speakingQuestion.findMany({
        where: { lessonId },
        select: { question: true, expectedAnswer: true, points: true },
      }),
      this.prisma.listeningQuestion.findMany({
        where: { lessonId },
        select: { question: true, options: true, correctAnswer: true, points: true },
      }),
    ]);

    if (readingQs.length === 0 && vocab.length === 0 && writingQs.length === 0 && speakingQs.length === 0 && listeningQs.length === 0) {
      return { message: "No content to generate quiz from" };
    }

    const quiz = await this.prisma.quiz.create({
      data: { lessonId, title: "End of Lesson Quiz", passingScore: 70 },
    });

    let order = 0;
    for (const q of readingQs) {
      await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id, sourceType: "READING",
          question: q.question, options: q.options || undefined,
          correctAnswer: q.correctAnswer, points: q.points || 10, order: ++order,
        },
      });
    }
    for (const v of vocab) {
      await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id, sourceType: "VOCABULARY",
          question: `What is the Dari translation of "${v.englishWord}"?`,
          correctAnswer: v.dariTranslation, points: 10, order: ++order,
        },
      });
    }
    for (const q of writingQs) {
      await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id, sourceType: "WRITING",
          question: q.question, options: q.options || undefined,
          correctAnswer: q.correctAnswer, points: q.points || 10, order: ++order,
        },
      });
    }
    for (const q of speakingQs) {
      if (q.expectedAnswer) {
        await this.prisma.quizQuestion.create({
          data: {
            quizId: quiz.id, sourceType: "SPEAKING",
            question: q.question, correctAnswer: q.expectedAnswer,
            points: q.points || 10, order: ++order,
          },
        });
      }
    }
    for (const q of listeningQs) {
      await this.prisma.quizQuestion.create({
        data: {
          quizId: quiz.id, sourceType: "LISTENING",
          question: q.question, options: q.options || undefined,
          correctAnswer: q.correctAnswer, points: q.points || 10, order: ++order,
        },
      });
    }

    return this.prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  }

  // ============= MEDIA CENTER =============
  async getMediaCenter() {
    const [vocabAudio, listeningQs, speakingQs, dialogueLines, activities] = await Promise.all([
      this.prisma.vocabularyAudio.findMany({
        include: { vocabulary: { select: { englishWord: true, lessonId: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.listeningQuestion.findMany({
        where: { audioUrl: { not: "" } },
        select: { id: true, audioUrl: true, question: true, lessonId: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.speakingQuestion.findMany({
        where: { audioUrl: { not: null } },
        select: { id: true, audioUrl: true, question: true, lessonId: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.dialogueLine.findMany({
        where: { audioUrl: { not: null } },
        include: { dialogue: { select: { title: true, lessonId: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.pronunciationActivity.findMany({
        where: { audioUrl: { not: null } },
        select: { id: true, audioUrl: true, word: true, lessonId: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return {
      vocabularyAudio: vocabAudio,
      listeningAudio: listeningQs,
      speakingAudio: speakingQs,
      dialogueAudio: dialogueLines,
      pronunciationAudio: activities,
    };
  }

  // ============= LESSON BUILDER =============
  async getLessonBuilder(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
        vocabularies: { include: { audio: true }, orderBy: { createdAt: "desc" } },
        writingQuestions: { orderBy: { order: "asc" } },
        speakingQuestions: { orderBy: { order: "asc" } },
        listeningQuestions: { orderBy: { order: "asc" } },
        dialogues: { include: { lines: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "asc" } },
        readingActivities: { include: { questions: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "asc" } },
        pronunciationActivities: { orderBy: { order: "asc" } },
        quizzes: { include: { questions: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: {
            vocabularies: true, writingQuestions: true, speakingQuestions: true,
            listeningQuestions: true, dialogues: true, readingActivities: true,
            pronunciationActivities: true, quizzes: true,
          },
        },
      },
    });
  }

  // ============= PUBLISH LESSON =============
  async publishLesson(id: string) {
    return this.prisma.lesson.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
  }

  async unpublishLesson(id: string) {
    return this.prisma.lesson.update({
      where: { id },
      data: { status: "DRAFT" },
    });
  }
}
