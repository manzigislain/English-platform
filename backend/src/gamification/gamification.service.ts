import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(limit = 20) {
    return this.prisma.user.findMany({
      orderBy: { xp: "desc" },
      take: limit,
      select: { id: true, fullName: true, avatarUrl: true, xp: true, dailyStreak: true, currentLevel: true },
    });
  }

  async getUserProgress(userId: string) {
    const [user, lessonsCompleted, streakHistory, badges, achievements, savedWords] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, fullName: true, avatarUrl: true,
          role: true, isActive: true, xp: true, knowledgeCoins: true,
          dailyStreak: true, currentLevelId: true, createdAt: true,
          currentLevel: true,
        },
      }),
      this.prisma.userProgress.count({ where: { userId, completed: true } }),
      this.prisma.streakHistory.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 30,
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      this.prisma.savedVocabulary.count({ where: { userId } }),
    ]);

    return { user, lessonsCompleted, streakHistory, badges, achievements, savedWords };
  }

  async toggleSaveVocabulary(userId: string, vocabularyId: string) {
    const existing = await this.prisma.savedVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });
    if (existing) {
      await this.prisma.savedVocabulary.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.prisma.savedVocabulary.create({ data: { userId, vocabularyId } });
    return { saved: true };
  }

  async checkAndAwardBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userBadges: true },
    });
    if (!user) return [];

    const allBadges = await this.prisma.badge.findMany();
    const earnedBadgeIds = user.userBadges.map((ub) => ub.badgeId);
    const newBadges: any[] = [];

    const totalCompleted = await this.prisma.userProgress.count({ where: { userId, completed: true } });
    const maxStreak = user.dailyStreak;
    const savedWords = await this.prisma.savedVocabulary.count({ where: { userId } });

    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;
      const criteria = badge.criteria as any;
      let earned = false;

      if (criteria.type === "first_lesson" && totalCompleted >= criteria.threshold) earned = true;
      if (criteria.type === "streak" && maxStreak >= criteria.threshold) earned = true;
      if (criteria.type === "vocabulary" && savedWords >= criteria.threshold) earned = true;
      if (criteria.type === "lessons_completed" && totalCompleted >= criteria.threshold) earned = true;
      if (criteria.type === "xp_total" && user.xp >= criteria.threshold) earned = true;

      if (earned) {
        await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        await this.prisma.user.update({ where: { id: userId }, data: { xp: { increment: badge.xpReward } } });
        newBadges.push(badge);
      }
    }

    return newBadges;
  }
}
