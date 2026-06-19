import {
  Controller, Get, Post, Param, Body, Req, UseGuards,
  UploadedFile, UseInterceptors, Delete,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PronunciationService } from "./pronunciation.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("pronunciation")
export class PronunciationController {
  constructor(private pronunciationService: PronunciationService) {}

  @UseGuards(JwtAuthGuard)
  @Get("activities/:lessonId")
  async getActivities(@Param("lessonId") lessonId: string) {
    return this.pronunciationService.getActivities(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("attempt")
  @UseInterceptors(FileInterceptor("audio"))
  async submitAttempt(
    @Req() req: any,
    @Body() body: { activityId: string },
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    return this.pronunciationService.submitAttempt(
      req.user.id,
      body.activityId,
      audio?.buffer,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("attempts/:lessonId")
  async getAttempts(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.pronunciationService.getAttempts(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("score/:lessonId")
  async getScore(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.pronunciationService.getLessonScore(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("activities")
  async createActivity(@Body() body: any) {
    return this.pronunciationService.createActivity(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("activities/:id")
  async updateActivity(@Param("id") id: string, @Body() body: any) {
    return this.pronunciationService.updateActivity(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete("activities/:id")
  async deleteActivity(@Param("id") id: string) {
    return this.pronunciationService.deleteActivity(id);
  }
}
