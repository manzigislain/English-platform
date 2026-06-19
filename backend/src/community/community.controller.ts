import { Controller, Get, Post, Param, Body, Req, Query, UseGuards } from "@nestjs/common";
import { CommunityService } from "./community.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";

@Controller("community")
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post("posts")
  async createPost(@Req() req: any, @Body() body: any) {
    return this.communityService.createPost(req.user.id, body);
  }

  @Public()
  @Get("posts")
  async getPosts(@Query("page") page?: number, @Query("limit") limit?: number, @Query("status") status?: string) {
    return this.communityService.findAll(page || 1, limit || 20, status);
  }

  @Public()
  @Get("posts/:id")
  async getPost(@Param("id") id: string) {
    return this.communityService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("posts/:id/comments")
  async addComment(@Req() req: any, @Param("id") id: string, @Body() body: { content: string }) {
    return this.communityService.addComment(req.user.id, id, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post("posts/:id/like")
  async toggleLike(@Req() req: any, @Param("id") id: string) {
    return this.communityService.toggleLike(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("posts/:id/report")
  async reportPost(@Req() req: any, @Param("id") id: string, @Body() body: { reason: string }) {
    return this.communityService.reportPost(req.user.id, id, body.reason);
  }
}
