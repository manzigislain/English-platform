import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ============= DASHBOARD =============
  @Get("dashboard")
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ============= USERS =============
  @Get("users")
  async getUsers(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getAllUsers(page || 1, limit || 20);
  }

  @Get("users/:id")
  async getUser(@Param("id") id: string) {
    return this.adminService.getUserById(id);
  }

  @Put("users/:id")
  async updateUser(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Post("users/:id/toggle-suspend")
  async toggleSuspendUser(@Param("id") id: string) {
    return this.adminService.suspendUser(id);
  }

  // ============= COURSES =============
  @Get("courses")
  async getAllCourses() {
    return this.adminService.getAllCourses();
  }

  @Post("courses")
  async createCourse(@Body() body: any) {
    return this.adminService.createCourse(body);
  }

  @Put("courses/:id")
  async updateCourse(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateCourse(id, body);
  }

  @Delete("courses/:id")
  async deleteCourse(@Param("id") id: string) {
    return this.adminService.deleteCourse(id);
  }

  // ============= LESSONS =============
  @Get("lessons")
  async getAllLessons() {
    return this.adminService.getAllLessons();
  }

  @Post("lessons")
  async createLesson(@Body() body: any) {
    return this.adminService.createLesson(body);
  }

  @Put("lessons/:id")
  async updateLesson(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateLesson(id, body);
  }

  @Delete("lessons/:id")
  async deleteLesson(@Param("id") id: string) {
    return this.adminService.deleteLesson(id);
  }

  // ============= VOCABULARY =============
  @Get("vocabulary")
  async getVocabulary(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getAllVocabulary(page || 1, limit || 50);
  }

  @Post("vocabulary")
  async createVocabulary(@Body() body: any) {
    return this.adminService.createVocabulary(body);
  }

  @Put("vocabulary/:id")
  async updateVocabulary(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateVocabulary(id, body);
  }

  @Delete("vocabulary/:id")
  async deleteVocabulary(@Param("id") id: string) {
    return this.adminService.deleteVocabulary(id);
  }

  // ============= COMMUNITY =============
  @Get("posts")
  async getAllPosts(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getAllPosts(page || 1, limit || 20);
  }

  @Get("posts/pending")
  async getPendingPosts() {
    return this.adminService.getPendingPosts();
  }

  @Put("posts/:id/approve")
  async approvePost(@Param("id") id: string) {
    return this.adminService.approvePost(id);
  }

  @Put("posts/:id/reject")
  async rejectPost(@Param("id") id: string) {
    return this.adminService.rejectPost(id);
  }

  @Delete("posts/:id")
  async deletePost(@Param("id") id: string) {
    return this.adminService.deletePost(id);
  }

  // ============= REPORTS =============
  @Get("reports")
  async getReports() {
    return this.adminService.getReports();
  }

  @Delete("reports/:id")
  async dismissReport(@Param("id") id: string) {
    return this.adminService.dismissReport(id);
  }

  // ============= CERTIFICATES =============
  @Get("certificates")
  async getCertificates(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getAllCertificates(page || 1, limit || 20);
  }

  @Post("certificates/:id/verify")
  async verifyCertificate(@Param("id") id: string) {
    return this.adminService.verifyCertificate(id);
  }

  @Post("certificates/:id/revoke")
  async revokeCertificate(@Param("id") id: string) {
    return this.adminService.revokeCertificate(id);
  }

  // ============= PAYMENTS =============
  @Get("payments")
  async getPayments(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getAllPayments(page || 1, limit || 20);
  }

  @Get("invoices")
  async getInvoices(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getInvoices(page || 1, limit || 20);
  }

  @Get("webhook-events")
  async getWebhookEvents(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getWebhookEvents(page || 1, limit || 20);
  }

  @Get("subscription-history")
  async getSubscriptionHistory(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminService.getSubscriptionHistory(page || 1, limit || 20);
  }

  @Get("payments/pending-transfers")
  async getPendingTransfers() {
    return this.adminService.getPendingTransfers();
  }

  @Post("payments/:id/approve")
  async approvePayment(@Param("id") id: string, @Req() req: any) {
    return this.adminService.approvePayment(id, req.user.id);
  }

  @Post("payments/:id/reject")
  async rejectPayment(@Param("id") id: string) {
    return this.adminService.rejectPayment(id);
  }

  // ============= PLANS =============
  @Get("plans")
  async getPlans() {
    return this.adminService.getAllPlans();
  }

  @Post("plans")
  async createPlan(@Body() body: any) {
    return this.adminService.createPlan(body);
  }

  @Put("plans/:id")
  async updatePlan(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updatePlan(id, body);
  }

  // ============= LEVELS =============
  @Get("levels")
  async getAllLevels() {
    return this.adminService.getAllLevels();
  }

  @Post("levels")
  async createLevel(@Body() body: any) {
    return this.adminService.createLevel(body);
  }

  @Put("levels/:id")
  async updateLevel(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateLevel(id, body);
  }

  // ============= WRITING QUESTIONS =============
  @Get("writing-questions/:lessonId")
  async getWritingQuestions(@Param("lessonId") lessonId: string) {
    return this.adminService.getWritingQuestions(lessonId);
  }

  @Post("writing-questions")
  async createWritingQuestion(@Body() body: any) {
    return this.adminService.createWritingQuestion(body);
  }

  @Put("writing-questions/:id")
  async updateWritingQuestion(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateWritingQuestion(id, body);
  }

  @Delete("writing-questions/:id")
  async deleteWritingQuestion(@Param("id") id: string) {
    return this.adminService.deleteWritingQuestion(id);
  }

  // ============= SPEAKING QUESTIONS =============
  @Get("speaking-questions/:lessonId")
  async getSpeakingQuestions(@Param("lessonId") lessonId: string) {
    return this.adminService.getSpeakingQuestions(lessonId);
  }

  @Post("speaking-questions")
  async createSpeakingQuestion(@Body() body: any) {
    return this.adminService.createSpeakingQuestion(body);
  }

  @Put("speaking-questions/:id")
  async updateSpeakingQuestion(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateSpeakingQuestion(id, body);
  }

  @Delete("speaking-questions/:id")
  async deleteSpeakingQuestion(@Param("id") id: string) {
    return this.adminService.deleteSpeakingQuestion(id);
  }

  // ============= LISTENING QUESTIONS =============
  @Get("listening-questions/:lessonId")
  async getListeningQuestions(@Param("lessonId") lessonId: string) {
    return this.adminService.getListeningQuestions(lessonId);
  }

  @Post("listening-questions")
  async createListeningQuestion(@Body() body: any) {
    return this.adminService.createListeningQuestion(body);
  }

  @Put("listening-questions/:id")
  async updateListeningQuestion(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateListeningQuestion(id, body);
  }

  @Delete("listening-questions/:id")
  async deleteListeningQuestion(@Param("id") id: string) {
    return this.adminService.deleteListeningQuestion(id);
  }

  // ============= DIALOGUES =============
  @Get("dialogues/:lessonId")
  async getDialogues(@Param("lessonId") lessonId: string) {
    return this.adminService.getDialogues(lessonId);
  }

  @Post("dialogues")
  async createDialogue(@Body() body: any) {
    return this.adminService.createDialogue(body);
  }

  @Delete("dialogues/:id")
  async deleteDialogue(@Param("id") id: string) {
    return this.adminService.deleteDialogue(id);
  }

  @Post("dialogues/lines")
  async addDialogueLine(@Body() body: any) {
    return this.adminService.addDialogueLine(body);
  }

  @Put("dialogues/lines/:id")
  async updateDialogueLine(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateDialogueLine(id, body);
  }

  @Delete("dialogues/lines/:id")
  async deleteDialogueLine(@Param("id") id: string) {
    return this.adminService.deleteDialogueLine(id);
  }

  // ============= UNITS =============
  @Get("units")
  async getAllUnits() {
    return this.adminService.getAllUnits();
  }

  @Post("units")
  async createUnit(@Body() body: any) {
    return this.adminService.createUnit(body);
  }

  @Put("units/:id")
  async updateUnit(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateUnit(id, body);
  }

  @Delete("units/:id")
  async deleteUnit(@Param("id") id: string) {
    return this.adminService.deleteUnit(id);
  }

  // ============= READING =============
  @Get("reading/:lessonId")
  async getReadingActivities(@Param("lessonId") lessonId: string) {
    return this.adminService.getReadingActivities(lessonId);
  }

  @Post("reading/activities")
  async createReadingActivity(@Body() body: any) {
    return this.adminService.createReadingActivity(body);
  }

  @Put("reading/activities/:id")
  async updateReadingActivity(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateReadingActivity(id, body);
  }

  @Delete("reading/activities/:id")
  async deleteReadingActivity(@Param("id") id: string) {
    return this.adminService.deleteReadingActivity(id);
  }

  @Post("reading/questions")
  async addReadingQuestion(@Body() body: any) {
    return this.adminService.addReadingQuestion(body);
  }

  @Put("reading/questions/:id")
  async updateReadingQuestion(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateReadingQuestion(id, body);
  }

  @Delete("reading/questions/:id")
  async deleteReadingQuestion(@Param("id") id: string) {
    return this.adminService.deleteReadingQuestion(id);
  }

  // ============= PRONUNCIATION =============
  @Get("pronunciation/:lessonId")
  async getPronunciationActivities(@Param("lessonId") lessonId: string) {
    return this.adminService.getPronunciationActivities(lessonId);
  }

  @Post("pronunciation/activities")
  async createPronunciationActivity(@Body() body: any) {
    return this.adminService.createPronunciationActivity(body);
  }

  @Put("pronunciation/activities/:id")
  async updatePronunciationActivity(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updatePronunciationActivity(id, body);
  }

  @Delete("pronunciation/activities/:id")
  async deletePronunciationActivity(@Param("id") id: string) {
    return this.adminService.deletePronunciationActivity(id);
  }

  // ============= QUIZZES =============
  @Get("quiz/:lessonId")
  async getQuiz(@Param("lessonId") lessonId: string) {
    return this.adminService.getQuiz(lessonId);
  }

  @Post("quiz/generate/:lessonId")
  async generateQuiz(@Param("lessonId") lessonId: string) {
    return this.adminService.generateQuiz(lessonId);
  }

  @Post("quiz/questions")
  async addQuizQuestion(@Body() body: any) {
    return this.adminService.addQuizQuestion(body);
  }

  @Put("quiz/questions/:id")
  async updateQuizQuestion(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateQuizQuestion(id, body);
  }

  @Delete("quiz/questions/:id")
  async deleteQuizQuestion(@Param("id") id: string) {
    return this.adminService.deleteQuizQuestion(id);
  }

  @Delete("quiz/:id")
  async deleteQuiz(@Param("id") id: string) {
    return this.adminService.deleteQuiz(id);
  }

  // ============= MEDIA CENTER =============
  @Get("media-center")
  async getMediaCenter() {
    return this.adminService.getMediaCenter();
  }

  // ============= LESSON BUILDER =============
  @Get("lesson-builder/:id")
  async getLessonBuilder(@Param("id") id: string) {
    return this.adminService.getLessonBuilder(id);
  }

  @Post("lessons/:id/publish")
  async publishLesson(@Param("id") id: string) {
    return this.adminService.publishLesson(id);
  }

  @Post("lessons/:id/unpublish")
  async unpublishLesson(@Param("id") id: string) {
    return this.adminService.unpublishLesson(id);
  }
}
