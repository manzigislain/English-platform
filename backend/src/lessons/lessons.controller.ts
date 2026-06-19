import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";
import { SubscriptionGuard } from "../subscriptions/subscription.guard";
import { RequiredPlan } from "../subscriptions/plan-level.decorator";

@Controller("lessons")
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Public()
  @Get(":id")
  @UseGuards(SubscriptionGuard)
  @RequiredPlan("SEED")
  async findById(@Param("id") id: string) {
    return this.lessonsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/complete")
  async completeLesson(
    @Param("id") id: string,
    @Body() body: { score: number; accuracy: number },
    @Req() req: any,
  ) {
    return this.lessonsService.completeLesson(req.user.id, id, body.score, body.accuracy);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/check-completion")
  async checkCompletion(@Param("id") id: string, @Req() req: any) {
    return this.lessonsService.checkLessonCompletion(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put(":id")
  async update(@Param("id") id: string, @Body() body: any) {
    return this.lessonsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.lessonsService.remove(id);
  }
}
