import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, data: { title: string; content: string; type: string; dariContent?: string }) {
    return this.prisma.communityPost.create({
      data: {
        title: data.title,
        content: data.content,
        dariContent: data.dariContent,
        type: data.type as any,
        status: "PENDING",
        userId,
      },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    else where.status = "APPROVED";

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        comments: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { likes: true } },
      },
    });
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  async addComment(userId: string, postId: string, content: string) {
    return this.prisma.comment.create({
      data: { userId, postId, content },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.like.create({ data: { userId, postId } });
    return { liked: true };
  }

  async reportPost(userId: string, postId: string, reason: string) {
    return this.prisma.report.create({ data: { userId, postId, reason } });
  }

  async moderatePost(postId: string, status: string) {
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { status: status as any },
    });
  }
}
