import { Controller, Get, Post, Param, Body, Req, UseGuards } from "@nestjs/common";
import { CertificatesService } from "./certificates.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";

@Controller("certificates")
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @UseGuards(JwtAuthGuard)
  @Post("generate")
  async generate(@Req() req: any, @Body() body: { title: string }) {
    return this.certificatesService.generate(req.user.id, body.title);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my")
  async getMyCertificates(@Req() req: any) {
    return this.certificatesService.getUserCertificates(req.user.id);
  }

  @Public()
  @Get(":certificateId")
  async getByCertificateId(@Param("certificateId") certificateId: string) {
    return this.certificatesService.getByCertificateId(certificateId);
  }

  @Public()
  @Post(":certificateId/verify")
  async verify(@Param("certificateId") certificateId: string, @Req() req: any) {
    return this.certificatesService.verifyCertificate(certificateId, req.ip, req.headers["user-agent"]);
  }
}
