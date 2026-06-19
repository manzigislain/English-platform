import { Controller, Post, Body, UseGuards, Get, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  async register(@Body() body: { email: string; password: string; fullName: string }) {
    return this.authService.register(body.email, body.password, body.fullName);
  }

  @Public()
  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  async refresh(@Body() body: { refreshToken: string }, @Req() req: any) {
    return this.authService.refreshTokens(req.user.id, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
