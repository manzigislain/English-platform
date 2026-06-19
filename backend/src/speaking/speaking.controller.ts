import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SpeakingService } from "./speaking.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("speaking")
export class SpeakingController {
  constructor(private speakingService: SpeakingService) {}

  @UseGuards(JwtAuthGuard)
  @Get("questions/:lessonId")
  async getQuestions(@Param("lessonId") lessonId: string) {
    return this.speakingService.getQuestions(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("attempt")
  @UseInterceptors(FileInterceptor("audio"))
  async submitAttempt(
    @Req() req: any,
    @Body() body: { questionId: string; transcript?: string },
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    return this.speakingService.submitAttempt(
      req.user.id,
      body.questionId,
      audio?.buffer,
      body.transcript,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("attempts/:lessonId")
  async getAttempts(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.speakingService.getAttempts(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("score/:lessonId")
  async getScore(@Req() req: any, @Param("lessonId") lessonId: string) {
    return this.speakingService.getLessonScore(req.user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("questions")
  async createQuestion(@Body() body: any) {
    return this.speakingService.createQuestion(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put("questions/:id")
  async updateQuestion(@Param("id") id: string, @Body() body: any) {
    return this.speakingService.updateQuestion(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete("questions/:id")
  async deleteQuestion(@Param("id") id: string) {
    return this.speakingService.deleteQuestion(id);
  }
}
