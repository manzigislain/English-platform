import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ListeningService } from "./listening.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("listening")
export class ListeningController {
  constructor(private listeningService: ListeningService) {}

  @UseGuards(JwtAuthGuard)
  @Get("questions/:lessonId")
  async getQuestions(@Param("lessonId") lessonId: string) {
    return this.listeningService.getQuestions(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("attempt")
  async submitAttempt(
    @Req() req: any,
    @Body() body: { questionId: string; answer: string },
  ) {
    return this.listeningService.submitAttempt(req.user.id, body.questionId, body.answer);
  }

  @UseGuards(JwtAuthGuard)
  @Get("attempts/:lessonId")
  async getAttempts(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.listeningService.getAttempts(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("score/:lessonId")
  async getScore(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.listeningService.getLessonScore(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("questions")
  async createQuestion(@Body() body: any) {
    return this.listeningService.createQuestion(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put("questions/:id")
  async updateQuestion(@Param("id") id: string, @Body() body: any) {
    return this.listeningService.updateQuestion(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete("questions/:id")
  async deleteQuestion(@Param("id") id: string) {
    return this.listeningService.deleteQuestion(id);
  }
}
