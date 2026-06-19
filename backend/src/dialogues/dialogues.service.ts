import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DialoguesService {
  constructor(private prisma: PrismaService) {}

  async getDialogues(lessonId: string) {
    return this.prisma.dialogue.findMany({
      where: { lessonId },
      include: {
        lines: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getDialogue(id: string) {
    const dialogue = await this.prisma.dialogue.findUnique({
      where: { id },
      include: {
        lines: { orderBy: { order: "asc" } },
      },
    });
    if (!dialogue) throw new NotFoundException("Dialogue not found");
    return dialogue;
  }

  async createDialogue(data: {
    lessonId: string;
    title: string;
    dariTitle?: string;
  }) {
    return this.prisma.dialogue.create({
      data,
    });
  }

  async addLine(data: {
    dialogueId: string;
    speaker: string;
    english: string;
    dari?: string;
    audioUrl?: string;
    order: number;
  }) {
    return this.prisma.dialogueLine.create({
      data,
    });
  }

  async updateLine(id: string, data: any) {
    return this.prisma.dialogueLine.update({ where: { id }, data });
  }

  async deleteDialogue(id: string) {
    return this.prisma.dialogue.delete({ where: { id } });
  }

  async deleteLine(id: string) {
    return this.prisma.dialogueLine.delete({ where: { id } });
  }
}
