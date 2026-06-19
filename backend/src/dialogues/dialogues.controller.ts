import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { DialoguesService } from "./dialogues.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";

@Controller("dialogues")
export class DialoguesController {
  constructor(private dialoguesService: DialoguesService) {}

  @Public()
  @Get("lesson/:lessonId")
  async getDialogues(@Param("lessonId") lessonId: string) {
    return this.dialoguesService.getDialogues(lessonId);
  }

  @Public()
  @Get(":id")
  async getDialogue(@Param("id") id: string) {
    return this.dialoguesService.getDialogue(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  async createDialogue(@Body() body: { lessonId: string; title: string; dariTitle?: string }) {
    return this.dialoguesService.createDialogue(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("lines")
  async addLine(
    @Body() body: { dialogueId: string; speaker: string; english: string; dari?: string; audioUrl?: string; order: number },
  ) {
    return this.dialoguesService.addLine(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put("lines/:id")
  async updateLine(@Param("id") id: string, @Body() body: any) {
    return this.dialoguesService.updateLine(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  async deleteDialogue(@Param("id") id: string) {
    return this.dialoguesService.deleteDialogue(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete("lines/:id")
  async deleteLine(@Param("id") id: string) {
    return this.dialoguesService.deleteLine(id);
  }
}
