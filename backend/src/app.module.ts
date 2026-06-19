import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CoursesModule } from "./courses/courses.module";
import { LessonsModule } from "./lessons/lessons.module";
import { CommunityModule } from "./community/community.module";
import { GamificationModule } from "./gamification/gamification.module";
import { CertificatesModule } from "./certificates/certificates.module";
import { PaymentsModule } from "./payments/payments.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { AdminModule } from "./admin/admin.module";
import { WritingModule } from "./writing/writing.module";
import { SpeakingModule } from "./speaking/speaking.module";
import { ListeningModule } from "./listening/listening.module";
import { DialoguesModule } from "./dialogues/dialogues.module";
import { UploadModule } from "./upload/upload.module";
import { ReadingModule } from "./reading/reading.module";
import { PronunciationModule } from "./pronunciation/pronunciation.module";
import { QuizModule } from "./quiz/quiz.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    CommunityModule,
    GamificationModule,
    CertificatesModule,
    PaymentsModule,
    SubscriptionsModule,
    AdminModule,
    WritingModule,
    SpeakingModule,
    ListeningModule,
    DialoguesModule,
    UploadModule,
    ReadingModule,
    PronunciationModule,
    QuizModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
