import { Controller, Get, Put, Post, Param, Body, Req, UseGuards, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get("stats/summary")
  async getStats() {
    return this.usersService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get()
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.usersService.findAll(page || 1, limit || 20);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("profile")
  async updateProfile(@Req() req: any, @Body() body: { fullName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put(":id/role")
  async updateRole(@Param("id") id: string, @Body() body: { role: string }) {
    return this.usersService.updateRole(id, body.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put(":id/toggle-active")
  async toggleActive(@Param("id") id: string) {
    return this.usersService.toggleActive(id);
  }
}
