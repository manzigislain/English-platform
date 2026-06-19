import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ReadingService } from "./reading.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("reading")
export class ReadingController {
  constructor(private readingService: ReadingService) {}

  @UseGuards(JwtAuthGuard)
  @Get("activities/:lessonId")
  async getActivities(@Param("lessonId") lessonId: string) {
    return this.readingService.getActivities(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("activity/:id")
  async getActivity(@Param("id") id: string) {
    return this.readingService.getActivity(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("attempt")
  async submitAttempt(
    @Req() req: any,
    @Body() body: { questionId: string; answer: string },
  ) {
    return this.readingService.submitAttempt(req.user.id, body.questionId, body.answer);
  }

  @UseGuards(JwtAuthGuard)
  @Get("attempts/:lessonId")
  async getAttempts(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.readingService.getAttempts(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("score/:lessonId")
  async getScore(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.readingService.getLessonScore(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("activities")
  async createActivity(@Body() body: any) {
    return this.readingService.createActivity(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put("activities/:id")
  async updateActivity(@Param("id") id: string, @Body() body: any) {
    return this.readingService.updateActivity(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete("activities/:id")
  async deleteActivity(@Param("id") id: string) {
    return this.readingService.deleteActivity(id);
  }
}
