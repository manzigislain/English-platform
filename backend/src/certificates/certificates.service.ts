import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async generate(userId: string, title: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const certificateId = "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
    return this.prisma.certificate.create({
      data: {
        certificateId,
        userId,
        title,
        fullName: user.fullName,
        qrCodeUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${certificateId}`,
      },
    });
  }

  async getByCertificateId(certificateId: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { certificateId },
      include: { user: { select: { fullName: true } } },
    });
    if (!cert) throw new NotFoundException("Certificate not found");
    return cert;
  }

  async verifyCertificate(certificateId: string, ipAddress?: string, userAgent?: string) {
    const cert = await this.getByCertificateId(certificateId);
    await this.prisma.certificateVerification.create({
      data: { certificateId: cert.id, ipAddress, userAgent },
    });
    await this.prisma.certificate.update({
      where: { id: cert.id },
      data: { isVerified: true },
    });
    return { valid: true, certificate: cert };
  }

  async getUserCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
