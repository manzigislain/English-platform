const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface RequestOptions {
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: Record<string, string> = {
    ...options.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; fullName: string }) =>
      request("/auth/register", { method: "POST", body: data }),
    login: (data: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: data }),
    logout: () => request("/auth/logout", { method: "POST" }),
    profile: () => request("/auth/profile"),
  },
  courses: {
    list: (levelId?: string) => request(`/courses${levelId ? `?levelId=${levelId}` : ""}`),
    get: (id: string) => request(`/courses/${id}`),
  },
  lessons: {
    get: (id: string) => request(`/lessons/${id}`),
    complete: (id: string, data: { score: number; accuracy: number }) =>
      request(`/lessons/${id}/complete`, { method: "POST", body: data }),
    checkCompletion: (id: string) => request(`/lessons/${id}/check-completion`),
  },
  writing: {
    getQuestions: (lessonId: string) => request(`/writing/questions/${lessonId}`),
    submitAttempt: (questionId: string, answer: string) =>
      request("/writing/attempt", { method: "POST", body: { questionId, answer } }),
    getScore: (lessonId: string) => request(`/writing/score/${lessonId}`),
    getAttempts: (lessonId: string) => request(`/writing/attempts/${lessonId}`),
  },
  speaking: {
    getQuestions: (lessonId: string) => request(`/speaking/questions/${lessonId}`),
    submitAttempt: (questionId: string, formData: FormData) =>
      request("/speaking/attempt", { method: "POST", body: formData, headers: {} }),
    getScore: (lessonId: string) => request(`/speaking/score/${lessonId}`),
    getAttempts: (lessonId: string) => request(`/speaking/attempts/${lessonId}`),
  },
  listening: {
    getQuestions: (lessonId: string) => request(`/listening/questions/${lessonId}`),
    submitAttempt: (questionId: string, answer: string) =>
      request("/listening/attempt", { method: "POST", body: { questionId, answer } }),
    getScore: (lessonId: string) => request(`/listening/score/${lessonId}`),
    getAttempts: (lessonId: string) => request(`/listening/attempts/${lessonId}`),
  },
  dialogues: {
    getByLesson: (lessonId: string) => request(`/dialogues/lesson/${lessonId}`),
    get: (id: string) => request(`/dialogues/${id}`),
  },
  community: {
    getPosts: (page = 1) => request(`/community/posts?page=${page}`),
    getPost: (id: string) => request(`/community/posts/${id}`),
    createPost: (data: Record<string, any>) =>
      request("/community/posts", { method: "POST", body: data }),
    addComment: (postId: string, content: string) =>
      request(`/community/posts/${postId}/comments`, { method: "POST", body: { content } }),
    toggleLike: (postId: string) =>
      request(`/community/posts/${postId}/like`, { method: "POST" }),
    reportPost: (postId: string, reason: string) =>
      request(`/community/posts/${postId}/report`, { method: "POST", body: { reason } }),
  },
  gamification: {
    leaderboard: () => request("/gamification/leaderboard"),
    progress: () => request("/gamification/progress"),
    checkBadges: () => request("/gamification/check-badges", { method: "POST" }),
    toggleSaveVocabulary: (id: string) =>
      request(`/gamification/vocabulary/${id}/save`, { method: "POST" }),
  },
  certificates: {
    generate: (title: string) =>
      request("/certificates/generate", { method: "POST", body: { title } }),
    my: () => request("/certificates/my"),
    verify: (id: string) => request(`/certificates/${id}`),
  },
  subscriptions: {
    getPlans: () => request("/subscriptions/plans"),
    activateFree: () => request("/subscriptions/activate-free", { method: "POST" }),
    getMy: () => request("/subscriptions/my"),
    getActive: () => request("/subscriptions/active"),
    cancelAtStripe: (subscriptionId: string, atPeriodEnd: boolean = true) =>
      request(`/subscriptions/${subscriptionId}/cancel-at-stripe`, { method: "POST", body: { atPeriodEnd } }),
    resume: (subscriptionId: string) =>
      request(`/subscriptions/${subscriptionId}/resume`, { method: "POST" }),
  },
  payments: {
    createPayPalOrder: (planId: string) =>
      request("/payments/create-paypal-order", { method: "POST", body: { planId } }),
    capturePayPalOrder: (paymentId: string, paypalOrderId: string) =>
      request("/payments/capture-paypal-order", { method: "POST", body: { paymentId, paypalOrderId } }),
    bankTransfer: (planId: string, receiptUrl: string, notes?: string) =>
      request("/payments/bank-transfer", { method: "POST", body: { planId, receiptUrl, notes } }),
    getStatus: (id: string) => request(`/payments/status/${id}`),
    getMyPayments: () => request("/payments/my"),
    createStripeCheckout: (planId: string, successUrl: string, cancelUrl: string) =>
      request("/payments/stripe/checkout", { method: "POST", body: { planId, successUrl, cancelUrl } }),
    getStripeCheckoutStatus: (sessionId: string) => request(`/payments/stripe/checkout/${sessionId}`),
    createCustomerPortal: (returnUrl: string) =>
      request("/payments/stripe/portal", { method: "POST", body: { returnUrl } }),
    getMyInvoices: () => request("/payments/invoices/my"),
  },
  admin: {
    dashboard: () => request("/admin/dashboard"),
    users: (page = 1) => request(`/admin/users?page=${page}`),
    getUser: (id: string) => request(`/admin/users/${id}`),
    updateUser: (id: string, data: any) => request(`/admin/users/${id}`, { method: "PUT", body: data }),
    toggleSuspendUser: (id: string) => request(`/admin/users/${id}/toggle-suspend`, { method: "POST" }),
    courses: () => request("/admin/courses"),
    createCourse: (data: any) => request("/admin/courses", { method: "POST", body: data }),
    updateCourse: (id: string, data: any) => request(`/admin/courses/${id}`, { method: "PUT", body: data }),
    deleteCourse: (id: string) => request(`/admin/courses/${id}`, { method: "DELETE" }),
    lessons: () => request("/admin/lessons"),
    createLesson: (data: any) => request("/admin/lessons", { method: "POST", body: data }),
    updateLesson: (id: string, data: any) => request(`/admin/lessons/${id}`, { method: "PUT", body: data }),
    deleteLesson: (id: string) => request(`/admin/lessons/${id}`, { method: "DELETE" }),
    vocabulary: (page = 1) => request(`/admin/vocabulary?page=${page}`),
    createVocabulary: (data: any) => request("/admin/vocabulary", { method: "POST", body: data }),
    updateVocabulary: (id: string, data: any) => request(`/admin/vocabulary/${id}`, { method: "PUT", body: data }),
    deleteVocabulary: (id: string) => request(`/admin/vocabulary/${id}`, { method: "DELETE" }),
    posts: (page = 1) => request(`/admin/posts?page=${page}`),
    pendingPosts: () => request("/admin/posts/pending"),
    approvePost: (id: string) => request(`/admin/posts/${id}/approve`, { method: "PUT" }),
    rejectPost: (id: string) => request(`/admin/posts/${id}/reject`, { method: "PUT" }),
    deletePost: (id: string) => request(`/admin/posts/${id}`, { method: "DELETE" }),
    reports: () => request("/admin/reports"),
    dismissReport: (id: string) => request(`/admin/reports/${id}`, { method: "DELETE" }),
    certificates: (page = 1) => request(`/admin/certificates?page=${page}`),
    verifyCertificate: (id: string) => request(`/admin/certificates/${id}/verify`, { method: "POST" }),
    revokeCertificate: (id: string) => request(`/admin/certificates/${id}/revoke`, { method: "POST" }),
    payments: (page = 1) => request(`/admin/payments?page=${page}`),
    invoices: (page = 1) => request(`/admin/invoices?page=${page}`),
    webhookEvents: (page = 1) => request(`/admin/webhook-events?page=${page}`),
    subscriptionHistory: (page = 1) => request(`/admin/subscription-history?page=${page}`),
    pendingTransfers: () => request("/admin/payments/pending-transfers"),
    approvePayment: (id: string) => request(`/admin/payments/${id}/approve`, { method: "POST" }),
    rejectPayment: (id: string) => request(`/admin/payments/${id}/reject`, { method: "POST" }),
    plans: () => request("/admin/plans"),
    createPlan: (data: any) => request("/admin/plans", { method: "POST", body: data }),
    updatePlan: (id: string, data: any) => request(`/admin/plans/${id}`, { method: "PUT", body: data }),
    levels: () => request("/admin/levels"),
    createLevel: (data: any) => request("/admin/levels", { method: "POST", body: data }),
    updateLevel: (id: string, data: any) => request(`/admin/levels/${id}`, { method: "PUT", body: data }),
    // ============= AUDIO MANAGEMENT =============
    uploadVocabularyAudio: (id: string, audioFile: File) => {
      const fd = new FormData();
      fd.append("audio", audioFile);
      return request(`/admin/audio/vocabulary/${id}`, { method: "POST", body: fd, headers: {} });
    },
    deleteVocabularyAudio: (id: string) => request(`/admin/audio/vocabulary/${id}`, { method: "DELETE" }),
    uploadListeningAudio: (id: string, audioFile: File) => {
      const fd = new FormData();
      fd.append("audio", audioFile);
      return request(`/admin/audio/listening/${id}`, { method: "POST", body: fd, headers: {} });
    },
    deleteListeningAudio: (id: string) => request(`/admin/audio/listening/${id}`, { method: "DELETE" }),
    uploadDialogueAudio: (id: string, audioFile: File) => {
      const fd = new FormData();
      fd.append("audio", audioFile);
      return request(`/admin/audio/dialogue/${id}`, { method: "POST", body: fd, headers: {} });
    },
    deleteDialogueAudio: (id: string) => request(`/admin/audio/dialogue/${id}`, { method: "DELETE" }),
    uploadSpeakingAudio: (id: string, audioFile: File) => {
      const fd = new FormData();
      fd.append("audio", audioFile);
      return request(`/admin/audio/speaking/${id}`, { method: "POST", body: fd, headers: {} });
    },
    deleteSpeakingAudio: (id: string) => request(`/admin/audio/speaking/${id}`, { method: "DELETE" }),
    uploadGenericAudio: (audioFile: File) => {
      const fd = new FormData();
      fd.append("audio", audioFile);
      return request("/admin/audio/upload", { method: "POST", body: fd, headers: {} });
    },
    // ============= WRITING QUESTIONS =============
    getWritingQuestions: (lessonId: string) => request(`/admin/writing-questions/${lessonId}`),
    createWritingQuestion: (data: any) => request("/admin/writing-questions", { method: "POST", body: data }),
    updateWritingQuestion: (id: string, data: any) => request(`/admin/writing-questions/${id}`, { method: "PUT", body: data }),
    deleteWritingQuestion: (id: string) => request(`/admin/writing-questions/${id}`, { method: "DELETE" }),
    // ============= SPEAKING QUESTIONS =============
    getSpeakingQuestions: (lessonId: string) => request(`/admin/speaking-questions/${lessonId}`),
    createSpeakingQuestion: (data: any) => request("/admin/speaking-questions", { method: "POST", body: data }),
    updateSpeakingQuestion: (id: string, data: any) => request(`/admin/speaking-questions/${id}`, { method: "PUT", body: data }),
    deleteSpeakingQuestion: (id: string) => request(`/admin/speaking-questions/${id}`, { method: "DELETE" }),
    // ============= LISTENING QUESTIONS =============
    getListeningQuestions: (lessonId: string) => request(`/admin/listening-questions/${lessonId}`),
    createListeningQuestion: (data: any) => request("/admin/listening-questions", { method: "POST", body: data }),
    updateListeningQuestion: (id: string, data: any) => request(`/admin/listening-questions/${id}`, { method: "PUT", body: data }),
    deleteListeningQuestion: (id: string) => request(`/admin/listening-questions/${id}`, { method: "DELETE" }),
    // ============= DIALOGUES =============
    getDialogues: (lessonId: string) => request(`/admin/dialogues/${lessonId}`),
    createDialogue: (data: any) => request("/admin/dialogues", { method: "POST", body: data }),
    deleteDialogue: (id: string) => request(`/admin/dialogues/${id}`, { method: "DELETE" }),
    addDialogueLine: (data: any) => request("/admin/dialogues/lines", { method: "POST", body: data }),
    updateDialogueLine: (id: string, data: any) => request(`/admin/dialogues/lines/${id}`, { method: "PUT", body: data }),
    deleteDialogueLine: (id: string) => request(`/admin/dialogues/lines/${id}`, { method: "DELETE" }),
    // ============= UNITS =============
    units: () => request("/admin/units"),
    createUnit: (data: any) => request("/admin/units", { method: "POST", body: data }),
    updateUnit: (id: string, data: any) => request(`/admin/units/${id}`, { method: "PUT", body: data }),
    deleteUnit: (id: string) => request(`/admin/units/${id}`, { method: "DELETE" }),
    // ============= READING =============
    getReadingActivities: (lessonId: string) => request(`/admin/reading/${lessonId}`),
    createReadingActivity: (data: any) => request("/admin/reading/activities", { method: "POST", body: data }),
    updateReadingActivity: (id: string, data: any) => request(`/admin/reading/activities/${id}`, { method: "PUT", body: data }),
    deleteReadingActivity: (id: string) => request(`/admin/reading/activities/${id}`, { method: "DELETE" }),
    addReadingQuestion: (data: any) => request("/admin/reading/questions", { method: "POST", body: data }),
    updateReadingQuestion: (id: string, data: any) => request(`/admin/reading/questions/${id}`, { method: "PUT", body: data }),
    deleteReadingQuestion: (id: string) => request(`/admin/reading/questions/${id}`, { method: "DELETE" }),
    // ============= PRONUNCIATION =============
    getPronunciationActivities: (lessonId: string) => request(`/admin/pronunciation/${lessonId}`),
    createPronunciationActivity: (data: any) => request("/admin/pronunciation/activities", { method: "POST", body: data }),
    updatePronunciationActivity: (id: string, data: any) => request(`/admin/pronunciation/activities/${id}`, { method: "PUT", body: data }),
    deletePronunciationActivity: (id: string) => request(`/admin/pronunciation/activities/${id}`, { method: "DELETE" }),
    // ============= QUIZZES =============
    getQuiz: (lessonId: string) => request(`/admin/quiz/${lessonId}`),
    generateQuiz: (lessonId: string) => request(`/admin/quiz/generate/${lessonId}`, { method: "POST" }),
    addQuizQuestion: (data: any) => request("/admin/quiz/questions", { method: "POST", body: data }),
    updateQuizQuestion: (id: string, data: any) => request(`/admin/quiz/questions/${id}`, { method: "PUT", body: data }),
    deleteQuizQuestion: (id: string) => request(`/admin/quiz/questions/${id}`, { method: "DELETE" }),
    deleteQuiz: (id: string) => request(`/admin/quiz/${id}`, { method: "DELETE" }),
    // ============= MEDIA CENTER =============
    mediaCenter: () => request("/admin/media-center"),
    // ============= LESSON BUILDER =============
    getLessonBuilder: (id: string) => request(`/admin/lesson-builder/${id}`),
    publishLesson: (id: string) => request(`/admin/lessons/${id}/publish`, { method: "POST" }),
    unpublishLesson: (id: string) => request(`/admin/lessons/${id}/unpublish`, { method: "POST" }),
  },
  reading: {
    getActivities: (lessonId: string) => request(`/reading/activities/${lessonId}`),
    submitAttempt: (questionId: string, answer: string) =>
      request("/reading/attempt", { method: "POST", body: { questionId, answer } }),
    getScore: (lessonId: string) => request(`/reading/score/${lessonId}`),
    getAttempts: (lessonId: string) => request(`/reading/attempts/${lessonId}`),
  },
  pronunciation: {
    getActivities: (lessonId: string) => request(`/pronunciation/activities/${lessonId}`),
    submitAttempt: (activityId: string, formData: FormData) =>
      request("/pronunciation/attempt", { method: "POST", body: formData, headers: {} }),
    getScore: (lessonId: string) => request(`/pronunciation/score/${lessonId}`),
    getAttempts: (lessonId: string) => request(`/pronunciation/attempts/${lessonId}`),
  },
  quiz: {
    get: (lessonId: string) => request(`/quiz/${lessonId}`),
    generate: (lessonId: string) => request(`/quiz/generate/${lessonId}`, { method: "POST" }),
    submitAttempt: (quizId: string, questionId: string, answer: string) =>
      request("/quiz/attempt", { method: "POST", body: { quizId, questionId, answer } }),
    getScore: (quizId: string) => request(`/quiz/score/${quizId}`),
  },
};
