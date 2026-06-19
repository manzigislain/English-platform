import { PrismaClient, LevelType, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = "postgresql://postgres@localhost:5432/english-platform";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data - order matters for foreign keys
  await prisma.subscriptionHistory.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.streakHistory.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.like.deleteMany();
  await prisma.report.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.certificateVerification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.scholarshipCode.deleteMany();
  await prisma.lessonAttempt.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.savedVocabulary.deleteMany();
  await prisma.vocabularyAudio.deleteMany();
  await prisma.dialogueLine.deleteMany();
  await prisma.dialogue.deleteMany();
  await prisma.listeningAttempt.deleteMany();
  await prisma.speakingAttempt.deleteMany();
  await prisma.speakingRecording.deleteMany();
  await prisma.writingAttempt.deleteMany();
  await prisma.writingQuestion.deleteMany();
  await prisma.readingAttempt.deleteMany();
  await prisma.readingQuestion.deleteMany();
  await prisma.readingActivity.deleteMany();
  await prisma.pronunciationAttempt.deleteMany();
  await prisma.pronunciationActivity.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.media.deleteMany();
  await prisma.speakingQuestion.deleteMany();
  await prisma.listeningQuestion.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.course.deleteMany();
  await prisma.level.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();

  // Create Levels
  const seedLevel = await prisma.level.create({
    data: { name: "Seed", type: "SEED" as LevelType, dariName: "تخم", description: "Free Level - Start your English journey with basics", xpRequired: 0, price: 0, order: 1, isActive: true },
  });
  const growthLevel = await prisma.level.create({
    data: { name: "Growth", type: "GROWTH" as LevelType, dariName: "رشد", description: "Paid Level - Expand your English skills further", xpRequired: 500, price: 9.99, order: 2, isActive: true },
  });
  const successLevel = await prisma.level.create({
    data: { name: "Success", type: "SUCCESS" as LevelType, dariName: "موفقیت", description: "Premium Level - Master English for professional life", xpRequired: 1500, price: 19.99, order: 3, isActive: true },
  });

  // World 1: Everyday English
  const gCourse = await prisma.course.create({ data: { title: "Greetings & Introductions", dariTitle: "سلام و احوالپرسی", description: "Learn how to greet people and introduce yourself in English", dariDescription: "یاد بگیرید چطور به انگلیسی سلام کنید", world: "Everyday English", order: 1, levelId: seedLevel.id, status: "PUBLISHED" } });
  const fCourse = await prisma.course.create({ data: { title: "Family & Relationships", dariTitle: "خانواده و روابط", description: "Learn vocabulary about family members and relationships", dariDescription: "لغات خانواده و روابط را یاد بگیرید", world: "Everyday English", order: 2, levelId: seedLevel.id, status: "PUBLISHED" } });
  const sCourse = await prisma.course.create({ data: { title: "Shopping & Prices", dariTitle: "خرید و قیمت‌ها", description: "Learn how to shop and ask for prices in English", dariDescription: "خرید به انگلیسی و قیمت پرسیدن", world: "Everyday English", order: 3, levelId: seedLevel.id, status: "PUBLISHED" } });
  const foodCourse = await prisma.course.create({ data: { title: "Food & Dining", dariTitle: "غذا و غذاخوری", description: "Learn vocabulary for food and ordering at restaurants", dariDescription: "لغات غذا و سفارش در رستوران", world: "Everyday English", order: 4, levelId: seedLevel.id, status: "PUBLISHED" } });

  // World 2: Education English
  await prisma.course.create({ data: { title: "School & Classroom", dariTitle: "مدرسه و صنف درسی", description: "English for school settings", dariDescription: "انگلیسی برای محیط مدرسه", world: "Education English", order: 1, levelId: growthLevel.id, status: "PUBLISHED" } });
  await prisma.course.create({ data: { title: "University & Studies", dariTitle: "پوهنتون و تحصیلات", description: "English for university life", dariDescription: "انگلیسی برای زندگی پوهنتونی", world: "Education English", order: 2, levelId: growthLevel.id, status: "PUBLISHED" } });

  // World 3: Career English
  await prisma.course.create({ data: { title: "CV Writing & Applications", dariTitle: "نوشتن CV", description: "Professional CV and job applications", dariDescription: "CV حرفه‌ای و درخواست کار", world: "Career English", order: 1, levelId: successLevel.id, status: "PUBLISHED" } });
  await prisma.course.create({ data: { title: "Job Interviews", dariTitle: "مصاحبه کاری", description: "Prepare for job interviews", dariDescription: "آمادگی برای مصاحبه کاری", world: "Career English", order: 2, levelId: successLevel.id, status: "PUBLISHED" } });

  // Create a unit for Greetings course
  const gUnit = await prisma.unit.create({ data: { title: "Getting Started", dariTitle: "شروع", description: "Basic greetings and introductions", courseId: gCourse.id, order: 1, status: "PUBLISHED" } });

  // Lessons for Greetings course
  const l1 = await prisma.lesson.create({ data: { title: "Basic Greetings", dariTitle: "سلام‌های ابتدایی", description: "Hello, Hi, Good morning", dariDescription: "سلام‌های رایج انگلیسی", order: 1, unitId: gUnit.id, status: "PUBLISHED" } });
  const l2 = await prisma.lesson.create({ data: { title: "Introducing Yourself", dariTitle: "معرفی خود", description: "My name is... I am from...", dariDescription: "معرفی خود به انگلیسی", order: 2, unitId: gUnit.id, status: "PUBLISHED" } });
  const l3 = await prisma.lesson.create({ data: { title: "Asking How Someone Is", dariTitle: "پرسیدن حال", description: "How are you? I'm fine", dariDescription: "پرسیدن حال به انگلیسی", order: 3, unitId: gUnit.id, status: "PUBLISHED" } });
  const l4 = await prisma.lesson.create({ data: { title: "Goodbye & Farewells", dariTitle: "خداحافظی", description: "Different ways to say goodbye", dariDescription: "راه‌های مختلف خداحافظی", order: 4, unitId: gUnit.id, status: "PUBLISHED" } });

  // Vocabulary
  const vData = [
    { ls: l1.id, items: [
      { en: "Hello", dari: "سلام", pr: "هَلو" }, { en: "Hi", dari: "سلام (خودمانی)", pr: "های" }, { en: "Good morning", dari: "صبح بخیر", pr: "گود مورنینگ" }, { en: "Good afternoon", dari: "بعد از ظهر بخیر", pr: "گود آفتِرنون" }, { en: "Good evening", dari: "عصر بخیر", pr: "گود ایو نینگ" }] },
    { ls: l2.id, items: [
      { en: "My name is...", dari: "اسم من... است", pr: "مای نیم ایز" }, { en: "I am from...", dari: "من اهل... هستم", pr: "آی اِم فرام" }, { en: "Nice to meet you", dari: "از دیدنت خوشحالم", pr: "نایس تو میت یو" }, { en: "Where are you from?", dari: "شما اهل کجا هستید؟", pr: "وِر آر یو فرام" }, { en: "What is your name?", dari: "اسم شما چیست؟", pr: "وَت ایز یور نِیم" }] },
    { ls: l3.id, items: [
      { en: "How are you?", dari: "چطور هستید؟", pr: "هاو آر یو" }, { en: "I'm fine, thank you", dari: "خوبم، مرسی", pr: "آیم فاین، تھینک یو" }, { en: "I'm good", dari: "خوبم", pr: "آیم گود" }, { en: "Not bad", dari: "بد نیستم", pr: "نات بد" }, { en: "And you?", dari: "و شما؟", pr: "اَند یو" }] },
    { ls: l4.id, items: [
      { en: "Goodbye", dari: "خداحافظ", pr: "گودبای" }, { en: "See you later", dari: "بعداً می‌بینمت", pr: "سی یو لِیتر" }, { en: "See you tomorrow", dari: "فردا می‌بینمت", pr: "سی یو تومورو" }, { en: "Take care", dari: "مراقب خودت باش", pr: "تَیک کِر" }, { en: "Have a nice day", dari: "روز خوبی داشته باشی", pr: "هَو ا نایس دِی" }] },
  ];
  for (const group of vData) {
    for (const v of group.items) {
      await prisma.vocabulary.create({ data: { englishWord: v.en, dariTranslation: v.dari, pronunciationGuide: v.pr, lessonId: group.ls } });
    }
  }

  // Exercises
  const eData = [
    { ls: l1.id, items: [
      { t: "MULTIPLE_CHOICE", q: "How do you say 'Hello' in Dari?", opts: ["سلام", "خداحافظ", "مرسی", "بله"], ans: "سلام", pts: 10, ord: 1 },
      { t: "MULTIPLE_CHOICE", q: "What does 'Good morning' mean?", opts: ["صبح بخیر", "عصر بخیر", "شب بخیر", "بعد از ظهر بخیر"], ans: "صبح بخیر", pts: 10, ord: 2 },
      { t: "TYPING", q: "Type the English word for 'سلام'", ans: "Hello", pts: 15, ord: 3 },
      { t: "MULTIPLE_CHOICE", q: "When do you say 'Good evening'?", opts: ["Morning", "Afternoon", "Evening", "Night"], ans: "Evening", pts: 10, ord: 4 },
    ]},
    { ls: l2.id, items: [
      { t: "MULTIPLE_CHOICE", q: "How do you say 'My name is...'?", opts: ["Your name is", "My name is", "His name is", "Her name is"], ans: "My name is", pts: 10, ord: 1 },
      { t: "TYPING", q: "Type 'Nice to meet you'", ans: "Nice to meet you", pts: 15, ord: 2 },
    ]},
    { ls: l3.id, items: [
      { t: "MULTIPLE_CHOICE", q: "Answer 'How are you?'", opts: ["I'm fine", "My name is", "Goodbye", "Hello"], ans: "I'm fine", pts: 10, ord: 1 },
      { t: "MULTIPLE_CHOICE", q: "What does 'Thank you' mean?", opts: ["خواهش می‌کنم", "مرسی", "خداحافظ", "سلام"], ans: "مرسی", pts: 10, ord: 2 },
    ]},
    { ls: l4.id, items: [
      { t: "MULTIPLE_CHOICE", q: "Which means 'Goodbye'?", opts: ["Hello", "Goodbye", "Thank you", "Please"], ans: "Goodbye", pts: 10, ord: 1 },
      { t: "TYPING", q: "Type 'Take care'", ans: "Take care", pts: 15, ord: 2 },
    ]},
  ];
  for (const group of eData) {
    for (const ex of group.items) {
      const data: any = { type: ex.t as any, question: ex.q, correctAnswer: ex.ans, points: ex.pts, lessonId: group.ls, order: ex.ord };
      if ((ex as any).opts) data.options = (ex as any).opts;
      await prisma.exercise.create({ data });
    }
  }

  // Badges
  const badges = [
    { n: "First Lesson", d: "Complete your first lesson", x: 50, c: { type: "first_lesson", threshold: 1 } },
    { n: "7-Day Streak", d: "Study for 7 days in a row", x: 100, c: { type: "streak", threshold: 7 } },
    { n: "30-Day Streak", d: "Study for 30 days in a row", x: 500, c: { type: "streak", threshold: 30 } },
    { n: "100 Words Learned", d: "Learn 100 vocabulary words", x: 200, c: { type: "vocabulary", threshold: 100 } },
    { n: "Perfect Score", d: "Get 100% on any lesson", x: 150, c: { type: "perfect_score", threshold: 1 } },
    { n: "Knowledge Seeker", d: "Complete 10 lessons", x: 300, c: { type: "lessons_completed", threshold: 10 } },
    { n: "English Champion", d: "Earn 5000 XP total", x: 2000, c: { type: "xp_total", threshold: 5000 } },
  ];
  for (const b of badges) {
    await prisma.badge.create({ data: { name: b.n, description: b.d, xpReward: b.x, criteria: b.c as any } });
  }

  // Achievements
  const achievements = [
    { n: "First Steps", d: "Complete 3 lessons", x: 100, c: { type: "lessons_completed", threshold: 3 } },
    { n: "Dedicated Learner", d: "Study for 7 days", x: 200, c: { type: "study_days", threshold: 7 } },
    { n: "Word Collector", d: "Save 20 vocabulary words", x: 150, c: { type: "saved_vocabulary", threshold: 20 } },
    { n: "Quiz Master", d: "Get 90%+ on 5 lessons", x: 400, c: { type: "high_accuracy", threshold: 5 } },
    { n: "Rising Star", d: "Reach Growth level", x: 500, c: { type: "level_reach", level: "Growth" } },
  ];
  for (const a of achievements) {
    await prisma.achievement.create({ data: { name: a.n, description: a.d, xpReward: a.x, criteria: a.c as any } });
  }

  // Admin user
  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { email: "admin@englishplatform.com", passwordHash: hashedPassword, fullName: "Admin User", role: "ADMIN", xp: 0, knowledgeCoins: 100, isActive: true },
  });

  console.log("Database seeded successfully!");
  console.log("Admin: admin@englishplatform.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
