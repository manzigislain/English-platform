import { Controller, Get, Post, Param, Body, Req, UseGuards } from "@nestjs/common";
import { QuizService } from "./quiz.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";
import { SubscriptionGuard } from "../subscriptions/subscription.guard";
import { RequiredPlan } from "../subscriptions/plan-level.decorator";

@Controller("quiz")
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Public()
  @Get(":lessonId")
  @UseGuards(SubscriptionGuard)
  @RequiredPlan("SEED")
  async getQuiz(@Param("lessonId") lessonId: string) {
    return this.quizService.getQuiz(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("generate/:lessonId")
  async generateQuiz(@Param("lessonId") lessonId: string, @Req() req: any) {
    return this.quizService.generateQuiz(lessonId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("attempt")
  async submitAttempt(
    @Req() req: any,
    @Body() body: { quizId: string; questionId: string; answer: string },
  ) {
    return this.quizService.submitAttempt(req.user.id, body.quizId, body.questionId, body.answer);
  }

  @UseGuards(JwtAuthGuard)
  @Get("score/:quizId")
  async getScore(@Req() req: any, @Param("quizId") quizId: string) {
    return this.quizService.getQuizScore(req.user.id, quizId);
  }
}
