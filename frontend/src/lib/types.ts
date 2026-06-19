export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
  xp: number;
  knowledgeCoins: number;
  dailyStreak: number;
  isActive: boolean;
  currentLevel?: Level;
  createdAt?: string;
  currentLevelId?: string;
}

export interface Level {
  id: string;
  name: string;
  type: "SEED" | "GROWTH" | "SUCCESS";
  dariName: string;
  description: string;
  xpRequired: number;
  price?: number;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  dariTitle: string;
  description: string;
  dariDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  world: string;
  order: number;
  levelId: string;
  level?: Level;
  lessons?: Lesson[];
  isActive?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: { lessons: number; units: number };
}

export interface Unit {
  id: string;
  title: string;
  dariTitle?: string;
  description: string;
  dariDescription?: string;
  order: number;
  courseId: string;
  course?: Course;
  lessons?: Lesson[];
  isActive?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: { lessons: number };
}

export interface Lesson {
  id: string;
  title: string;
  dariTitle: string;
  description: string;
  dariDescription?: string;
  order: number;
  unitId?: string;
  unit?: Unit;
  courseId?: string;
  course?: Course;
  passingScore: number;
  vocabularies?: Vocabulary[];
  exercises?: Exercise[];
  writingQuestions?: WritingQuestion[];
  speakingQuestions?: SpeakingQuestion[];
  listeningQuestions?: ListeningQuestion[];
  readingActivities?: ReadingActivity[];
  pronunciationActivities?: PronunciationActivity[];
  quizzes?: Quiz[];
  dialogues?: Dialogue[];
  isActive?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: {
    vocabularies: number; exercises: number; writingQuestions: number;
    speakingQuestions: number; listeningQuestions: number; dialogues: number;
    readingActivities: number; pronunciationActivities: number; quizzes: number;
  };
}

export interface Vocabulary {
  id: string;
  englishWord: string;
  dariTranslation: string;
  pronunciationGuide?: string;
  exampleSentence?: string;
  dariSentence?: string;
  audioUrl?: string;
  lessonId?: string;
  audio?: {
    id: string;
    audioUrl: string;
    fileSize?: number;
    duration?: number;
  };
}

export interface Exercise {
  id: string;
  type: "MULTIPLE_CHOICE" | "MATCHING" | "LISTENING" | "TYPING";
  question: string;
  dariQuestion?: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

// ============= WRITING =============
export interface WritingQuestion {
  id: string;
  lessonId: string;
  type: "TRANSLATE_DARI_ENGLISH" | "SENTENCE_COMPLETION" | "TYPE_ANSWER";
  question: string;
  dariQuestion?: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export interface WritingAttempt {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  createdAt: string;
}

// ============= SPEAKING =============
export interface SpeakingQuestion {
  id: string;
  lessonId: string;
  type: "LISTEN_REPEAT" | "QUESTION_ANSWER";
  question: string;
  dariQuestion?: string;
  expectedAnswer?: string;
  audioUrl?: string;
  points: number;
  order: number;
}

export interface SpeakingAttempt {
  id: string;
  userId: string;
  questionId: string;
  transcript?: string;
  audioUrl?: string;
  accuracy: number;
  pronunciationScore: number;
  score: number;
  completed: boolean;
  createdAt: string;
}

// ============= LISTENING =============
export interface ListeningQuestion {
  id: string;
  lessonId: string;
  type: "MULTIPLE_CHOICE" | "FILL_BLANK" | "SHORT_ANSWER";
  question: string;
  dariQuestion?: string;
  audioUrl: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export interface ListeningAttempt {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  createdAt: string;
}

// ============= DIALOGUES =============
export interface Dialogue {
  id: string;
  lessonId: string;
  title: string;
  dariTitle?: string;
  lines: DialogueLine[];
}

export interface DialogueLine {
  id: string;
  dialogueId: string;
  speaker: string;
  english: string;
  dari?: string;
  audioUrl?: string;
  order: number;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  dariContent?: string;
  type: "QUESTION" | "TESTIMONY" | "MOTIVATION" | "LEARNING_TIP";
  status: "PENDING" | "APPROVED" | "REJECTED";
  user: { id: string; fullName: string; avatarUrl?: string; email?: string };
  _count: { comments: number; likes: number; reports?: number };
  comments?: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  user: { id: string; fullName: string; avatarUrl?: string };
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  criteria: Record<string, any>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  criteria: Record<string, any>;
}

export interface Certificate {
  id: string;
  certificateId: string;
  title: string;
  fullName: string;
  completionDate: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  isVerified?: boolean;
  user?: { id: string; fullName: string; email: string };
}

export interface Plan {
  id: string;
  name: string;
  type: "SEED" | "GROWTH" | "SUCCESS";
  price: number;
  currency: string;
  durationDays: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: Record<string, any>;
  isActive: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  planId?: string;
  plan?: Plan;
  user?: { id: string; fullName: string; email: string };
  receiptUrl?: string;
  adminApproved?: boolean;
  createdAt: string;
  receipts?: PaymentReceipt[];
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptUrl: string;
  notes?: string;
  verified: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  courses: number;
  lessons: number;
  communityPosts: number;
  payments: number;
  certificates: number;
  totalRevenue: number;
  completedLessons: number;
}

export interface ReadingActivity {
  id: string;
  lessonId: string;
  title: string;
  dariTitle?: string;
  passage: string;
  dariPassage?: string;
  imageUrl?: string;
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  activityId: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MATCHING";
  question: string;
  dariQuestion?: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export interface PronunciationActivity {
  id: string;
  lessonId: string;
  word: string;
  dariWord?: string;
  audioUrl?: string;
  points: number;
  order: number;
}

export interface PronunciationAttempt {
  id: string;
  userId: string;
  activityId: string;
  audioUrl?: string;
  transcript?: string;
  accuracy: number;
  score: number;
  completed: boolean;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  dariTitle?: string;
  passingScore: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  sourceType: "READING" | "SPEAKING" | "LISTENING" | "WRITING" | "VOCABULARY" | "PRONUNCIATION";
  question: string;
  dariQuestion?: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
}

export interface LessonCompletionResult {
  completed: boolean;
  xpEarned: number;
  sections: {
    reading: { score: number; total: number; percentage: number; passed?: boolean };
    writing: { score: number; total: number; percentage: number; passed?: boolean };
    speaking: { score: number; total: number; percentage: number; passed?: boolean };
    listening: { score: number; total: number; percentage: number; passed?: boolean };
    pronunciation: { score: number; total: number; percentage: number; passed?: boolean };
    quiz: { score: number; total: number; percentage: number; passed?: boolean };
  };
}
