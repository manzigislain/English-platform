import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, fullName: true, avatarUrl: true, role: true, xp: true, isActive: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        currentLevel: true,
        userBadges: { include: { badge: true } },
        userAchievements: { include: { achievement: true } },
        _count: { select: { communityPosts: true, certificates: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(id: string, data: { fullName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updateRole(id: string, role: string) {
    return this.prisma.user.update({ where: { id }, data: { role: role as any } });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  }

  async getStats() {
    const [totalUsers, activeToday, totalXp] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.aggregate({ _sum: { xp: true } }),
    ]);
    return { totalUsers, activeToday, totalXp: totalXp._sum.xp || 0 };
  }
}
