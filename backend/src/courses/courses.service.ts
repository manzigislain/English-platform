import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(levelId?: string) {
    const where = levelId ? { levelId } : {};
    return this.prisma.course.findMany({
      where: { ...where, status: "PUBLISHED" },
      include: { level: true, _count: { select: { units: true } } },
      orderBy: { order: "asc" },
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        level: true,
        units: {
          where: { status: "PUBLISHED" },
          include: {
            _count: { select: { lessons: true } },
            lessons: {
              where: { status: "PUBLISHED" },
              include: {
                _count: {
                  select: {
                    vocabularies: true, exercises: true, writingQuestions: true,
                    speakingQuestions: true, listeningQuestions: true,
                    readingActivities: true, pronunciationActivities: true, quizzes: true,
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!course) throw new NotFoundException("Course not found");
    return course;
  }

  async create(data: { title: string; dariTitle: string; description: string; world: string; levelId: string; order: number }) {
    return this.prisma.course.create({ data: { ...data, status: "PUBLISHED" } });
  }

  async update(id: string, data: any) {
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: "ARCHIVED" } });
  }
}
