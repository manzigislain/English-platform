import { Controller, Get, Post, Param, Req, UseGuards } from "@nestjs/common";
import { GamificationService } from "./gamification.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";

@Controller("gamification")
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Public()
  @Get("leaderboard")
  async getLeaderboard() {
    return this.gamificationService.getLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get("progress")
  async getProgress(@Req() req: any) {
    return this.gamificationService.getUserProgress(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("vocabulary/:id/save")
  async toggleSave(@Param("id") id: string, @Req() req: any) {
    return this.gamificationService.toggleSaveVocabulary(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("check-badges")
  async checkBadges(@Req() req: any) {
    return this.gamificationService.checkAndAwardBadges(req.user.id);
  }
}
