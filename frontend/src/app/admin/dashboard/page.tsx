"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, BookOpen, FileText, DollarSign, CheckCircle2, XCircle, Clock,
  Shield, BarChart3, Activity, Plus, Edit3, Trash2, Search, Loader2,
  ChevronDown, MoreHorizontal, MessageSquare, Award, CreditCard,
  Volume2, Bookmark, Flag, Eye, Ban, Zap, TrendingUp, ArrowUpDown,
  Mic, Headphones, MessageCircle, Layers, GripVertical, HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { DashboardStats, User, Course, Lesson, Vocabulary, CommunityPost, Certificate, Payment, Plan, Level } from "@/lib/types";

type AdminTab = "dashboard" | "courses" | "units" | "lessons" | "vocabulary" | "writing" | "speaking" | "listening" | "reading" | "pronunciation" | "quiz" | "dialogues" | "lesson-builder" | "media" | "community" | "certificates" | "payments" | "users" | "plans";

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminTab | null;

  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || "dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.admin.dashboard();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { type: AdminTab; label: string; icon: any }[] = [
    { type: "dashboard", label: "Dashboard", icon: BarChart3 },
    { type: "courses", label: "Courses", icon: BookOpen },
    { type: "units", label: "Units", icon: Layers },
    { type: "lessons", label: "Lessons", icon: FileText },
    { type: "vocabulary", label: "Vocabulary", icon: Bookmark },
    { type: "writing", label: "Writing", icon: Edit3 },
    { type: "speaking", label: "Speaking", icon: Mic },
    { type: "listening", label: "Listening", icon: Headphones },
    { type: "reading", label: "Reading", icon: BookOpen },
    { type: "pronunciation", label: "Pronunciation", icon: Volume2 },
    { type: "quiz", label: "Quiz", icon: HelpCircle },
    { type: "dialogues", label: "Dialogues", icon: MessageCircle },
    { type: "lesson-builder", label: "Lesson Builder", icon: Layers },
    { type: "media", label: "Media Center", icon: Volume2 },
    { type: "community", label: "Community", icon: MessageSquare },
    { type: "certificates", label: "Certificates", icon: Award },
    { type: "payments", label: "Payments", icon: DollarSign },
    { type: "plans", label: "Plans", icon: CreditCard },
    { type: "users", label: "Users", icon: Users },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
        <p className="mt-1 text-sm text-text-light">Manage your learning platform</p>
      </div>

      {/* Tab Navigation - styled for admin */}
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
              activeTab === tab.type
                ? "bg-primary text-white shadow-sm"
                : "text-text-light hover:bg-gray-100 hover:text-text",
            )}
          >
            <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      {!loading && activeTab === "dashboard" && <DashboardTab stats={stats} onRefresh={loadDashboard} />}
      {activeTab === "courses" && <CoursesTab />}
      {activeTab === "lessons" && <LessonsTab />}
      {activeTab === "vocabulary" && <VocabularyTab />}
      {activeTab === "writing" && <WritingQuestionsTab />}
      {activeTab === "speaking" && <SpeakingQuestionsTab />}
      {activeTab === "listening" && <ListeningQuestionsTab />}
      {activeTab === "dialogues" && <DialoguesTab />}
      {activeTab === "reading" && <ReadingTab />}
      {activeTab === "pronunciation" && <PronunciationTab />}
      {activeTab === "quiz" && <QuizTab />}
      {activeTab === "units" && <UnitsTab />}
      {activeTab === "lesson-builder" && <LessonBuilderTab />}
      {activeTab === "media" && <MediaCenterTab />}

      {activeTab === "community" && <CommunityTab />}
      {activeTab === "certificates" && <CertificatesTab />}
      {activeTab === "payments" && <PaymentsTab />}
      {activeTab === "plans" && <PlansTab />}
      {activeTab === "users" && <UsersTab />}

    </div>
  );
}

// ======================== DASHBOARD TAB ========================
function DashboardTab({ stats, onRefresh }: { stats: DashboardStats | null; onRefresh: () => void }) {
  if (!stats) return <div className="py-12 text-center text-text-light">Unable to load dashboard data. <button onClick={onRefresh} className="text-primary hover:underline">Retry</button></div>;

  const cards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers.toString(), color: "bg-blue-50 text-blue-600" },
    { icon: Activity, label: "Active Users", value: stats.activeUsers.toString(), color: "bg-green-50 text-green-600" },
    { icon: BookOpen, label: "Courses", value: stats.courses.toString(), color: "bg-emerald-50 text-emerald-600" },
    { icon: FileText, label: "Lessons", value: stats.lessons.toString(), color: "bg-amber-50 text-amber-600" },
    { icon: TrendingUp, label: "Completed Lessons", value: stats.completedLessons.toString(), color: "bg-indigo-50 text-indigo-600" },
    { icon: MessageSquare, label: "Community Posts", value: stats.communityPosts.toString(), color: "bg-purple-50 text-purple-600" },
    { icon: DollarSign, label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, color: "bg-green-50 text-green-600" },
    { icon: Award, label: "Certificates", value: stats.certificates.toString(), color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Overview</h2>
        <button onClick={onRefresh} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-light hover:bg-gray-50">
          Refresh
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className={cn("mb-3 inline-flex rounded-lg p-2.5", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">{card.value}</div>
            <div className="text-xs text-text-light">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== COURSES TAB ========================
function CoursesTab() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", dariTitle: "", description: "", world: "", levelId: "", order: 1, thumbnailUrl: "", price: 0 });
  const [levels, setLevels] = useState<Level[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([api.admin.courses(), api.admin.levels()]);
      setCourses(c);
      setLevels(l);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      if (editing) { await api.admin.updateCourse(editing.id, form); }
      else { await api.admin.createCourse(form); }
      setShowForm(false); setEditing(null);
      setForm({ title: "", dariTitle: "", description: "", world: "", levelId: "", order: 1, thumbnailUrl: "", price: 0 });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    try { await api.admin.deleteCourse(id); loadData(); } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Course Management</h2>
        <button onClick={() => { setEditing(null); setForm({ title: "", dariTitle: "", description: "", world: "", levelId: "", order: 1, thumbnailUrl: "", price: 0 }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm">
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold">{editing ? "Edit Course" : "New Course"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (English)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.dariTitle} onChange={(e) => setForm({ ...form, dariTitle: e.target.value })} placeholder="Title (Dari)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:col-span-2 sm:text-sm" />
            <input value={form.world} onChange={(e) => setForm({ ...form, world: e.target.value })} placeholder="World" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm">
              <option value="">Select Level</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <input value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} type="number" placeholder="Order" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} type="number" step="0.01" placeholder="Price" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="Thumbnail URL" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white sm:text-sm">{editing ? "Update" : "Create"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light sm:text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {courses.map((course: any) => (
          <div key={course.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary sm:h-12 sm:w-12 sm:text-lg">{course.title.charAt(0)}</div>
              <div>
                <div className="text-sm font-bold sm:text-base">{course.title}</div>
                <div className="text-xs text-text-light">{course.world} • {course._count?.units || 0} units</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditing(course); setForm({ title: course.title, dariTitle: course.dariTitle, description: course.description, world: course.world, levelId: course.levelId, order: course.order, thumbnailUrl: course.thumbnailUrl || "", price: course.price || 0 }); setShowForm(true); }} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => handleDelete(course.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="py-8 text-center text-text-light">No courses yet.</p>}
      </div>
    </div>
  );
}

// ======================== LESSONS TAB ========================
function LessonsTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", dariTitle: "", description: "", unitId: "", order: 1 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const [l, u] = await Promise.all([api.admin.lessons(), api.admin.units()]); setLessons(l); setUnits(u); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      if (editing) { await api.admin.updateLesson(editing.id, form); } else { await api.admin.createLesson(form); }
      setShowForm(false); setEditing(null); setForm({ title: "", dariTitle: "", description: "", unitId: "", order: 1 }); loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this lesson?")) return; await api.admin.deleteLesson(id); loadData(); };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Lesson Management</h2>
        <button onClick={() => { setEditing(null); setForm({ title: "", dariTitle: "", description: "", unitId: "", order: 1 }); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Lesson</button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold">{editing ? "Edit Lesson" : "New Lesson"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (English)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.dariTitle} onChange={(e) => setForm({ ...form, dariTitle: e.target.value })} placeholder="Title (Dari)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:col-span-2 sm:text-sm" />
            <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm">
              <option value="">Select Unit</option>
              {units.map((u: any) => <option key={u.id} value={u.id}>{u.title} ({u.course?.title || "No course"})</option>)}
            </select>
            <input value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} type="number" placeholder="Order" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white sm:text-sm">{editing ? "Update" : "Create"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light sm:text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {lessons.map((lesson: any) => (
          <div key={lesson.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 shadow-sm sm:p-4">
            <div>
              <div className="text-sm font-bold sm:text-base">{lesson.title}</div>
              <div className="text-xs text-text-light">{lesson.unit?.title || "No unit"} • W:{lesson._count?.writingQuestions || 0} S:{lesson._count?.speakingQuestions || 0} L:{lesson._count?.listeningQuestions || 0}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditing(lesson); setForm({ title: lesson.title, dariTitle: lesson.dariTitle, description: lesson.description, unitId: lesson.unitId || "", order: lesson.order }); setShowForm(true); }} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => handleDelete(lesson.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && <p className="py-8 text-center text-text-light">No lessons yet.</p>}
      </div>
    </div>
  );
}

// ======================== VOCABULARY TAB ========================
function VocabularyTab() {
  const [items, setItems] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploadingAudio, setUploadingAudio] = useState<string | null>(null);
  const [form, setForm] = useState({ englishWord: "", dariTranslation: "", pronunciationGuide: "", exampleSentence: "", lessonId: "", audioUrl: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const [v, l] = await Promise.all([api.admin.vocabulary(), api.admin.lessons()]); setItems(v.items || v); setLessons(l); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      if (editing) { await api.admin.updateVocabulary(editing.id, form); } else { await api.admin.createVocabulary(form); }
      setShowForm(false); setEditing(null); setForm({ englishWord: "", dariTranslation: "", pronunciationGuide: "", exampleSentence: "", lessonId: "", audioUrl: "" }); loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this word?")) return; await api.admin.deleteVocabulary(id); loadData(); };

  const handleAudioUpload = async (vocabId: string, file: File) => {
    setUploadingAudio(vocabId);
    try {
      await api.admin.uploadVocabularyAudio(vocabId, file);
      loadData();
    } catch (err: any) { alert(err.message); } finally { setUploadingAudio(null); }
  };

  const handleAudioDelete = async (vocabId: string) => {
    if (!confirm("Delete this audio?")) return;
    try {
      await api.admin.deleteVocabularyAudio(vocabId);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Vocabulary Management</h2>
        <button onClick={() => { setEditing(null); setForm({ englishWord: "", dariTranslation: "", pronunciationGuide: "", exampleSentence: "", lessonId: "", audioUrl: "" }); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Word</button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold">{editing ? "Edit Word" : "New Vocabulary Word"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.englishWord} onChange={(e) => setForm({ ...form, englishWord: e.target.value })} placeholder="English Word" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.dariTranslation} onChange={(e) => setForm({ ...form, dariTranslation: e.target.value })} placeholder="Dari Translation" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.pronunciationGuide} onChange={(e) => setForm({ ...form, pronunciationGuide: e.target.value })} placeholder="Pronunciation Guide" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.exampleSentence} onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })} placeholder="Example Sentence" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:col-span-2 sm:text-sm" />
            <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm">
              <option value="">Select Lesson</option>
              {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white sm:text-sm">{editing ? "Update" : "Create"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light sm:text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">English</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Dari</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Lesson</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Audio</th>
              <th className="px-3 py-2.5 text-right font-medium text-text-light sm:px-4 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item: any) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">{item.englishWord}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">{item.dariTranslation}</td>
                <td className="px-3 py-2.5 text-text-light sm:px-4 sm:py-3">{item.lesson?.title || "-"}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  {(item.audio?.audioUrl || item.audioUrl) ? (
                    <div className="flex items-center gap-2">
                      <audio controls src={item.audio?.audioUrl || item.audioUrl} className="h-8 w-32" />
                      <button onClick={() => handleAudioDelete(item.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="audio/*,.mp3"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioUpload(item.id, file);
                          e.target.value = "";
                        }}
                      />
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                        {uploadingAudio === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" />
                            Upload MP3
                          </>
                        )}
                      </span>
                    </label>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                  <button onClick={() => { setEditing(item); setForm({ englishWord: item.englishWord, dariTranslation: item.dariTranslation, pronunciationGuide: item.pronunciationGuide || "", exampleSentence: item.exampleSentence || "", lessonId: item.lessonId, audioUrl: item.audioUrl || "" }); setShowForm(true); }} className="rounded-lg p-1 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-light">No vocabulary words yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== COMMUNITY TAB ========================
function CommunityTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"posts" | "pending" | "reports">("pending");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const [p, pend, r] = await Promise.all([api.admin.posts(), api.admin.pendingPosts(), api.admin.reports()]); setPosts(p.posts || []); setPending(pend); setReports(r); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => { await api.admin.approvePost(id); loadData(); };
  const handleReject = async (id: string) => { await api.admin.rejectPost(id); loadData(); };
  const handleDelete = async (id: string) => { if (confirm("Delete this post?")) { await api.admin.deletePost(id); loadData(); } };
  const handleDismissReport = async (id: string) => { await api.admin.dismissReport(id); loadData(); };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Community Management</h2>
        <div className="flex gap-1.5">
          {(["pending", "posts", "reports"] as const).map((tab) => (
            <button key={tab} onClick={() => setSubTab(tab)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", subTab === tab ? "bg-primary text-white" : "bg-gray-100 text-text-light")}>
              {tab === "pending" ? `Pending (${pending.length})` : tab === "posts" ? "Posts" : `Reports (${reports.length})`}
            </button>
          ))}
        </div>
      </div>
      {subTab === "pending" && (
        <div className="space-y-2">
          {pending.map((post: any) => (
            <div key={post.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">{post.type}</span>
                <Clock className="h-3 w-3 text-text-light" />
              </div>
              <h3 className="text-sm font-bold">{post.title}</h3>
              <p className="mb-2 text-xs text-text-light">{post.content?.substring(0, 200)}</p>
              <p className="mb-3 text-xs text-text-light">by {post.user?.fullName}</p>
              <div className="flex gap-1.5">
                <button onClick={() => handleApprove(post.id)} className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"><CheckCircle2 className="h-3 w-3" /> Approve</button>
                <button onClick={() => handleReject(post.id)} className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"><XCircle className="h-3 w-3" /> Reject</button>
                <button onClick={() => handleDelete(post.id)} className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-text-light hover:bg-gray-100"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="py-8 text-center text-text-light">No pending posts.</p>}
        </div>
      )}
      {subTab === "reports" && (
        <div className="space-y-2">
          {reports.map((report: any) => (
            <div key={report.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-red-500" /> <span className="text-sm font-medium">Reported by {report.user?.fullName}</span></div>
                <button onClick={() => handleDismissReport(report.id)} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium hover:bg-gray-200">Dismiss</button>
              </div>
              <p className="mt-2 text-xs">{report.reason}</p>
            </div>
          ))}
          {reports.length === 0 && <p className="py-8 text-center text-text-light">No reports.</p>}
        </div>
      )}
      {subTab === "posts" && (
        <div className="space-y-2">
          {posts.map((post: any) => (
            <div key={post.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-sm">
              <div>
                <div className="text-sm font-bold">{post.title}</div>
                <div className="text-xs text-text-light">{post.user?.fullName} • <span className={cn(post.status === "APPROVED" ? "text-green-600" : post.status === "REJECTED" ? "text-red-600" : "text-amber-600")}>{post.status}</span></div>
              </div>
              <button onClick={() => handleDelete(post.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {posts.length === 0 && <p className="py-8 text-center text-text-light">No posts.</p>}
        </div>
      )}
    </div>
  );
}

// ======================== CERTIFICATES TAB ========================
function CertificatesTab() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { setLoading(true); try { const data = await api.admin.certificates(); setCertificates(data.certificates || []); } catch (err) { console.error(err); } finally { setLoading(false); } };
  const handleVerify = async (id: string) => { await api.admin.verifyCertificate(id); loadData(); };
  const handleRevoke = async (id: string) => { await api.admin.revokeCertificate(id); loadData(); };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Certificate Management</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Certificate ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">User</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Title</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Status</th>
              <th className="px-3 py-2.5 text-right font-medium text-text-light sm:px-4 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert: any) => (
              <tr key={cert.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2.5 font-mono text-xs sm:px-4 sm:py-3">{cert.certificateId}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">{cert.user?.fullName || cert.fullName}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">{cert.title}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", cert.isVerified ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600")}>{cert.isVerified ? "Verified" : "Unverified"}</span>
                </td>
                <td className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                  {!cert.isVerified ? (
                    <button onClick={() => handleVerify(cert.id)} className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-100">Verify</button>
                  ) : (
                    <button onClick={() => handleRevoke(cert.id)} className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
            {certificates.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-light">No certificates yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== PAYMENTS TAB ========================
function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"all" | "pending">("pending");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { setLoading(true); try { const [p, pt] = await Promise.all([api.admin.payments(), api.admin.pendingTransfers()]); setPayments(p.payments || []); setPendingTransfers(pt); } catch (err) { console.error(err); } finally { setLoading(false); } };
  const handleApprove = async (id: string) => { await api.admin.approvePayment(id); loadData(); };
  const handleReject = async (id: string) => { await api.admin.rejectPayment(id); loadData(); };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Payment Management</h2>
        <div className="flex gap-1.5">
          <button onClick={() => setSubTab("pending")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", subTab === "pending" ? "bg-primary text-white" : "bg-gray-100 text-text-light")}>Pending ({pendingTransfers.length})</button>
          <button onClick={() => setSubTab("all")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", subTab === "all" ? "bg-primary text-white" : "bg-gray-100 text-text-light")}>All Payments</button>
        </div>
      </div>
      {subTab === "pending" && (
        <div className="space-y-2">
          {pendingTransfers.map((payment: any) => (
            <div key={payment.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">{payment.user?.fullName}</div>
                  <div className="text-xs text-text-light">${payment.amount} • {payment.plan?.name || "N/A"} • {formatDate(payment.createdAt)}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleApprove(payment.id)} className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"><CheckCircle2 className="h-3 w-3" /> Approve</button>
                  <button onClick={() => handleReject(payment.id)} className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"><XCircle className="h-3 w-3" /> Reject</button>
                </div>
              </div>
            </div>
          ))}
          {pendingTransfers.length === 0 && <p className="py-8 text-center text-text-light">No pending transfers.</p>}
        </div>
      )}
      {subTab === "all" && (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          <table className="w-full text-xs sm:text-sm">
            <thead className="border-b border-border bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">User</th>
                <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Amount</th>
                <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Method</th>
                <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: any) => (
                <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">{payment.user?.fullName || "N/A"}</td>
                  <td className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">${payment.amount}</td>
                  <td className="px-3 py-2.5 capitalize sm:px-4 sm:py-3">{payment.paymentMethod?.toLowerCase().replace("_", " ") || "N/A"}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", payment.status === "COMPLETED" ? "bg-green-50 text-green-600" : payment.status === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>{payment.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-text-light sm:px-4 sm:py-3">{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-light">No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ======================== PLANS TAB ========================
function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", type: "SEED", price: 0, currency: "USD", durationDays: 30, features: {} });

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => { setLoading(true); try { const data = await api.admin.plans(); setPlans(data); } catch (err) { console.error(err); } finally { setLoading(false); } };

  const handleSubmit = async () => {
    try {
      const features = typeof form.features === "string" ? JSON.parse(form.features as any) : form.features;
      const data = { ...form, features };
      if (editing) { await api.admin.updatePlan(editing.id, data); } else { await api.admin.createPlan(data); }
      setShowForm(false); setEditing(null); setForm({ name: "", type: "SEED", price: 0, currency: "USD", durationDays: 30, features: {} }); loadPlans();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Plan Management</h2>
        <button onClick={() => { setEditing(null); setForm({ name: "", type: "SEED", price: 0, currency: "USD", durationDays: 30, features: {} }); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Plan</button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold">{editing ? "Edit Plan" : "New Plan"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plan Name" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm">
              <option value="SEED">Seed</option><option value="GROWTH">Growth</option><option value="SUCCESS">Success</option>
            </select>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} type="number" step="0.01" placeholder="Price" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="Currency" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 30 })} type="number" placeholder="Duration (days)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white sm:text-sm">{editing ? "Update" : "Create"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light sm:text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Type</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Price</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Duration</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan: Plan) => (
              <tr key={plan.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">{plan.name}</td>
                <td className="px-3 py-2.5 capitalize sm:px-4 sm:py-3">{plan.type.toLowerCase()}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">${plan.price.toFixed(2)}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">{plan.durationDays} days</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", plan.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600")}>{plan.isActive ? "Active" : "Inactive"}</span>
                </td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-light">No plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== READING TAB ========================
function ReadingTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", dariTitle: "", passage: "", dariPassage: "", imageUrl: "" });

  useEffect(() => { loadLessons(); }, []);
  const loadLessons = async () => { setLoading(true); const l = await api.admin.lessons(); setLessons(l); setLoading(false); };
  const loadActivities = async (lessonId: string) => { if (!lessonId) return; setLoading(true); const data = await api.admin.getReadingActivities(lessonId); setActivities(data || []); setLoading(false); };
  useEffect(() => { if (selectedLesson) loadActivities(selectedLesson); else setActivities([]); }, [selectedLesson]);

  const handleCreate = async () => {
    try { await api.admin.createReadingActivity({ ...form, lessonId: selectedLesson }); setShowForm(false); setForm({ title: "", dariTitle: "", passage: "", dariPassage: "", imageUrl: "" }); loadActivities(selectedLesson); } catch (err: any) { alert(err.message); }
  };
  const handleDelete = async (id: string) => { if (!confirm("Delete?")) return; await api.admin.deleteReadingActivity(id); loadActivities(selectedLesson); };
  const handleDeleteQuestion = async (id: string) => { if (!confirm("Delete question?")) return; await api.admin.deleteReadingQuestion(id); loadActivities(selectedLesson); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Reading Activities</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <button onClick={() => setShowForm(true)} className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white"><Plus className="h-4 w-4" /> Add Reading Passage</button>
          {showForm && (
            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold">New Reading Passage</h3>
              <div className="grid gap-3">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.dariTitle} onChange={(e) => setForm({ ...form, dariTitle: e.target.value })} placeholder="Dari Title" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <textarea value={form.passage} onChange={(e) => setForm({ ...form, passage: e.target.value })} placeholder="Reading passage..." rows={5} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Image URL (optional)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleCreate} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white">Create</button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {activities.map((act: any) => (
              <div key={act.id} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold">{act.title}</h3>
                  <button onClick={() => handleDelete(act.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <p className="mb-4 text-xs text-text-light line-clamp-3">{act.passage}</p>
                <div className="space-y-2">
                  {act.questions?.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
                      <span className="flex-1">{q.question}</span>
                      <span className="text-text-light">{q.type} • {q.points}pts</span>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="ml-2 rounded p-0.5 text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={async () => {
                  const q = prompt("Enter question text:"); if (!q) return;
                  const type = prompt("Type (MULTIPLE_CHOICE / TRUE_FALSE / MATCHING):") || "MULTIPLE_CHOICE";
                  const answer = prompt("Correct answer:"); if (!answer) return;
                  await api.admin.addReadingQuestion({ activityId: act.id, type, question: q, correctAnswer: answer });
                  loadActivities(selectedLesson);
                }} className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3 w-3" /> Add Question</button>
              </div>
            ))}
            {activities.length === 0 && <p className="py-8 text-center text-text-light">No reading passages yet.</p>}
          </div>
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage reading activities.</p></div>}
    </div>
  );
}

// ======================== PRONUNCIATION TAB ========================
function PronunciationTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ word: "", dariWord: "", points: 10 });

  useEffect(() => { loadLessons(); }, []);
  const loadLessons = async () => { setLoading(true); const l = await api.admin.lessons(); setLessons(l); setLoading(false); };
  const loadActivities = async (lessonId: string) => { if (!lessonId) return; setLoading(true); const data = await api.admin.getPronunciationActivities(lessonId); setActivities(data || []); setLoading(false); };
  useEffect(() => { if (selectedLesson) loadActivities(selectedLesson); else setActivities([]); }, [selectedLesson]);

  const handleCreate = async () => {
    try { await api.admin.createPronunciationActivity({ ...form, lessonId: selectedLesson }); setShowForm(false); setForm({ word: "", dariWord: "", points: 10 }); loadActivities(selectedLesson); } catch (err: any) { alert(err.message); }
  };
  const handleDelete = async (id: string) => { if (!confirm("Delete?")) return; await api.admin.deletePronunciationActivity(id); loadActivities(selectedLesson); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Pronunciation Activities</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <button onClick={() => setShowForm(true)} className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white"><Plus className="h-4 w-4" /> Add Word</button>
          {showForm && (
            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold">New Pronunciation Word</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} placeholder="English word" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.dariWord} onChange={(e) => setForm({ ...form, dariWord: e.target.value })} placeholder="Dari (optional)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })} type="number" placeholder="Points" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
              </div>
              <p className="mt-2 text-xs text-text-light">Pronunciation audio will be auto-generated using AI TTS.</p>
              <div className="mt-4 flex gap-2">
                <button onClick={handleCreate} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white">Create</button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {activities.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">{a.word.charAt(0)}</div>
                  <div>
                    <div className="font-bold">{a.word}</div>
                    {a.dariWord && <div className="text-xs text-text-light">{a.dariWord}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.audioUrl && (
                    <button onClick={() => new Audio(a.audioUrl).play().catch(() => {})} className="rounded-lg p-1.5 text-primary hover:bg-primary/10">
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="text-xs text-text-light">{a.points}pts</span>
                  <button onClick={() => handleDelete(a.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="py-8 text-center text-text-light">No pronunciation words yet.</p>}
          </div>
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage pronunciation.</p></div>}
    </div>
  );
}

// ======================== QUIZ TAB ========================
function QuizTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadLessons(); }, []);
  const loadLessons = async () => { setLoading(true); const l = await api.admin.lessons(); setLessons(l); setLoading(false); };
  const loadQuiz = async (lessonId: string) => { if (!lessonId) return; setLoading(true); const data = await api.admin.getQuiz(lessonId); setQuiz(data); setLoading(false); };
  useEffect(() => { if (selectedLesson) loadQuiz(selectedLesson); else setQuiz(null); }, [selectedLesson]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { const data = await api.admin.generateQuiz(selectedLesson); setQuiz(data); } catch (err: any) { alert(err.message); } finally { setGenerating(false); }
  };
  const handleDeleteQuestion = async (id: string) => { if (!confirm("Delete question?")) return; await api.admin.deleteQuizQuestion(id); loadQuiz(selectedLesson); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">End of Lesson Quiz</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <div className="mb-4 flex gap-2">
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-50">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Auto-Generate Quiz
            </button>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : quiz ? (
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <div className="border-b border-border p-4">
                <h3 className="font-bold">{quiz.title}</h3>
                <p className="text-xs text-text-light">{quiz.questions?.length || 0} questions • Pass: {quiz.passingScore}%</p>
              </div>
              <div className="divide-y divide-border">
                {quiz.questions?.map((q: any, i: number) => (
                  <div key={q.id} className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-text-light">{i + 1}.</span>
                      <span className="ml-1 text-sm">{q.question}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-text-light">{q.sourceType}</span>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
              <p className="text-text-light">No quiz yet. Click Auto-Generate to create one from lesson content.</p>
            </div>
          )}
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage quizzes.</p></div>}
    </div>
  );
}

// ======================== AUDIO TAB ========================
function AudioTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAudio, setUploadingAudio] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"vocabulary" | "listening" | "speaking" | "dialogues">("vocabulary");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [l] = await Promise.all([api.admin.lessons()]);
      setLessons(l);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleFileUpload = async (
    type: "vocabulary" | "listening" | "speaking" | "dialogue",
    id: string,
    file: File,
  ) => {
    setUploadingAudio(id);
    try {
      switch (type) {
        case "vocabulary":
          await api.admin.uploadVocabularyAudio(id, file);
          break;
        case "listening":
          await api.admin.uploadListeningAudio(id, file);
          break;
        case "speaking":
          await api.admin.uploadSpeakingAudio(id, file);
          break;
        case "dialogue":
          await api.admin.uploadDialogueAudio(id, file);
          break;
      }
      loadData();
    } catch (err: any) { alert(err.message); } finally { setUploadingAudio(null); }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Delete this audio?")) return;
    try {
      switch (type) {
        case "vocabulary": await api.admin.deleteVocabularyAudio(id); break;
        case "listening": await api.admin.deleteListeningAudio(id); break;
        case "speaking": await api.admin.deleteSpeakingAudio(id); break;
        case "dialogue": await api.admin.deleteDialogueAudio(id); break;
      }
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Collect all items with audio across lessons
  const vocabItems = lessons.flatMap((l: any) =>
    (l._count?.vocabularies > 0 ? [{ lessonTitle: l.title, lessonId: l.id }] : [])
  );
  const listeningCount = lessons.reduce((sum: number, l: any) => sum + (l._count?.listeningQuestions || 0), 0);
  const speakingCount = lessons.reduce((sum: number, l: any) => sum + (l._count?.speakingQuestions || 0), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Audio Management</h2>
        <div className="flex gap-1.5">
          {(["vocabulary", "listening", "speaking", "dialogues"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                subTab === tab ? "bg-primary text-white" : "bg-gray-100 text-text-light",
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Volume2 className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold">Upload Audio Files</h3>
            <p className="text-xs text-text-light">
              Upload MP3 audio files for vocabulary, listening exercises, speaking prompts, and dialogue lines.
              Audio is stored on Cloudinary and served via CDN.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-bold">📚 Vocabulary Audio</h4>
            <p className="mb-3 text-xs text-text-light">Pronunciation audio for vocabulary words. Go to <strong>Vocabulary</strong> tab to upload.</p>
            <div className="text-xs text-text-light">{lessons.length} lessons with vocabulary items</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-bold">🎧 Listening Audio</h4>
            <p className="mb-3 text-xs text-text-light">Audio clips for listening comprehension exercises.</p>
            <div className="text-xs text-text-light">{listeningCount} listening questions across lessons</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-bold">🎤 Speaking Audio</h4>
            <p className="mb-3 text-xs text-text-light">Model pronunciation audio for speaking exercises.</p>
            <div className="text-xs text-text-light">{speakingCount} speaking questions across lessons</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-bold">💬 Dialogue Audio</h4>
            <p className="mb-3 text-xs text-text-light">Audio for dialogue lines in vocabulary section.</p>
            <div className="text-xs text-text-light">Add dialogues to lessons to upload line audio</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-bold">How Audio Works</h3>
        <ol className="ml-4 list-decimal space-y-2 text-sm text-text-light">
          <li><strong>Upload:</strong> Go to Vocabulary tab or Audio tab to upload MP3 files (max ~25MB per file)</li>
          <li><strong>Storage:</strong> Files are uploaded to <strong>Cloudinary</strong> CDN for fast delivery worldwide</li>
          <li><strong>Playback:</strong> Students hear audio directly in the lesson page via browser audio player</li>
          <li><strong>Replace:</strong> Upload a new file to automatically replace the existing audio</li>
          <li><strong>Delete:</strong> Remove audio files with a single click from the vocabulary table</li>
        </ol>
      </div>
    </div>
  );
}

// ======================== WRITING QUESTIONS TAB ========================
function WritingQuestionsTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ lessonId: "", type: "TYPE_ANSWER", question: "", correctAnswer: "", options: "", points: 10, order: 0 });

  useEffect(() => { loadLessons(); }, []);

  const loadLessons = async () => {
    setLoading(true);
    try { const l = await api.admin.lessons(); setLessons(l); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadQuestions = async (lessonId: string) => {
    if (!lessonId) return;
    setLoading(true);
    try { const data = await api.admin.getWritingQuestions(lessonId); setQuestions(data || []); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedLesson) loadQuestions(selectedLesson);
    else setQuestions([]);
  }, [selectedLesson]);

  const handleSubmit = async () => {
    try {
      const data = { ...form, options: form.options ? JSON.parse(form.options) : undefined };
      if (editing) { await api.admin.updateWritingQuestion(editing.id, data); }
      else { await api.admin.createWritingQuestion(data); }
      setShowForm(false); setEditing(null);
      setForm({ lessonId: selectedLesson, type: "TYPE_ANSWER", question: "", correctAnswer: "", options: "", points: 10, order: 0 });
      loadQuestions(selectedLesson);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this question?")) return; await api.admin.deleteWritingQuestion(id); loadQuestions(selectedLesson); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Writing Questions</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <button onClick={() => { setEditing(null); setForm({ lessonId: selectedLesson, type: "TYPE_ANSWER", question: "", correctAnswer: "", options: "", points: 10, order: 0 }); setShowForm(true); }} className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Question</button>
          {showForm && (
            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold">{editing ? "Edit Writing Question" : "New Writing Question"}</h3>
              <div className="grid gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary">
                  <option value="TYPE_ANSWER">Type Answer</option>
                  <option value="TRANSLATE_DARI_ENGLISH">Translate Dari to English</option>
                  <option value="SENTENCE_COMPLETION">Sentence Completion</option>
                </select>
                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="Correct Answer" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder='Options JSON (e.g. ["A", "B", "C"])' className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <div className="flex gap-3">
                  <input value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })} type="number" placeholder="Points" className="w-24 rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                  <input value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} type="number" placeholder="Order" className="w-24 rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white">{editing ? "Update" : "Create"}</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {questions.map((q: any) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="flex-1">
                  <div className="text-sm font-bold">{q.question}</div>
                  <div className="text-xs text-text-light">{q.type} • Answer: {q.correctAnswer} • {q.points} pts</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(q); setForm({ lessonId: selectedLesson, type: q.type, question: q.question, correctAnswer: q.correctAnswer, options: JSON.stringify(q.options), points: q.points, order: q.order }); setShowForm(true); }} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(q.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="py-8 text-center text-text-light">No writing questions for this lesson.</p>}
          </div>
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage writing questions.</p></div>}
    </div>
  );
}

// ======================== SPEAKING QUESTIONS TAB ========================
function SpeakingQuestionsTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ lessonId: "", type: "QUESTION_ANSWER", question: "", expectedAnswer: "", points: 10, order: 0 });

  useEffect(() => { loadLessons(); }, []);

  const loadLessons = async () => {
    setLoading(true);
    try { const l = await api.admin.lessons(); setLessons(l); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadQuestions = async (lessonId: string) => {
    if (!lessonId) return;
    setLoading(true);
    try { const data = await api.admin.getSpeakingQuestions(lessonId); setQuestions(data || []); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedLesson) loadQuestions(selectedLesson); else setQuestions([]); }, [selectedLesson]);

  const handleSubmit = async () => {
    try {
      if (editing) { await api.admin.updateSpeakingQuestion(editing.id, form); }
      else { await api.admin.createSpeakingQuestion(form); }
      setShowForm(false); setEditing(null);
      setForm({ lessonId: selectedLesson, type: "QUESTION_ANSWER", question: "", expectedAnswer: "", points: 10, order: 0 });
      loadQuestions(selectedLesson);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this question?")) return; await api.admin.deleteSpeakingQuestion(id); loadQuestions(selectedLesson); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Speaking Questions</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <button onClick={() => { setEditing(null); setForm({ lessonId: selectedLesson, type: "QUESTION_ANSWER", question: "", expectedAnswer: "", points: 10, order: 0 }); setShowForm(true); }} className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Question</button>
          {showForm && (
            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold">{editing ? "Edit Speaking Question" : "New Speaking Question"}</h3>
              <div className="grid gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary">
                  <option value="QUESTION_ANSWER">Question & Answer</option>
                  <option value="LISTEN_REPEAT">Listen & Repeat</option>
                </select>
                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.expectedAnswer} onChange={(e) => setForm({ ...form, expectedAnswer: e.target.value })} placeholder="Expected Answer" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <div className="flex gap-3">
                  <input value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })} type="number" placeholder="Points" className="w-24 rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                  <input value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} type="number" placeholder="Order" className="w-24 rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white">{editing ? "Update" : "Create"}</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {questions.map((q: any) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="flex-1">
                  <div className="text-sm font-bold">{q.question}</div>
                  <div className="text-xs text-text-light">{q.type} • Expected: {q.expectedAnswer || "N/A"} • {q.points} pts</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(q); setForm({ lessonId: selectedLesson, type: q.type, question: q.question, expectedAnswer: q.expectedAnswer || "", points: q.points, order: q.order }); setShowForm(true); }} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(q.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="py-8 text-center text-text-light">No speaking questions for this lesson.</p>}
          </div>
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage speaking questions.</p></div>}
    </div>
  );
}

// ======================== LISTENING QUESTIONS TAB ========================
function ListeningQuestionsTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({ lessonId: "", type: "MULTIPLE_CHOICE", question: "", audioUrl: "", correctAnswer: "", options: "", points: 10, order: 0 });

  useEffect(() => { loadLessons(); }, []);

  const loadLessons = async () => {
    setLoading(true);
    try { const l = await api.admin.lessons(); setLessons(l); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadQuestions = async (lessonId: string) => {
    if (!lessonId) return;
    setLoading(true);
    try { const data = await api.admin.getListeningQuestions(lessonId); setQuestions(data || []); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedLesson) loadQuestions(selectedLesson); else setQuestions([]); }, [selectedLesson]);

  const handleSubmit = async () => {
    try {
      const data = { ...form, options: form.options ? JSON.parse(form.options) : undefined };
      if (editing) { await api.admin.updateListeningQuestion(editing.id, data); }
      else { await api.admin.createListeningQuestion(data); }
      setShowForm(false); setEditing(null);
      setForm({ lessonId: selectedLesson, type: "MULTIPLE_CHOICE", question: "", audioUrl: "", correctAnswer: "", options: "", points: 10, order: 0 });
      loadQuestions(selectedLesson);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this question?")) return; await api.admin.deleteListeningQuestion(id); loadQuestions(selectedLesson); };

  const handleAudioUpload = async (id: string, file: File) => {
    setUploading(id);
    try { await api.admin.uploadListeningAudio(id, file); loadQuestions(selectedLesson); } catch (err: any) { alert(err.message); } finally { setUploading(null); }
  };

  const handleAudioDelete = async (id: string) => {
    if (!confirm("Delete this audio?")) return;
    try { await api.admin.deleteListeningAudio(id); loadQuestions(selectedLesson); } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Listening Questions</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <button onClick={() => { setEditing(null); setForm({ lessonId: selectedLesson, type: "MULTIPLE_CHOICE", question: "", audioUrl: "", correctAnswer: "", options: "", points: 10, order: 0 }); setShowForm(true); }} className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Question</button>
          {showForm && (
            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold">{editing ? "Edit Listening Question" : "New Listening Question"}</h3>
              <div className="grid gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary">
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="FILL_BLANK">Fill in the Blank</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                </select>
                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="Correct Answer" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder='Options JSON (e.g. ["A", "B", "C"])' className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <div className="flex gap-3">
                  <input value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })} type="number" placeholder="Points" className="w-24 rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                  <input value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} type="number" placeholder="Order" className="w-24 rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white">{editing ? "Update" : "Create"}</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {questions.map((q: any) => (
              <div key={q.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-bold">{q.question}</div>
                    <div className="text-xs text-text-light">{q.type} • Answer: {q.correctAnswer} • {q.points} pts</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(q); setForm({ lessonId: selectedLesson, type: q.type, question: q.question, audioUrl: q.audioUrl || "", correctAnswer: q.correctAnswer, options: JSON.stringify(q.options), points: q.points, order: q.order }); setShowForm(true); }} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(q.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {q.audioUrl ? (
                    <div className="flex items-center gap-2">
                      <audio controls src={q.audioUrl} className="h-8 w-48" />
                      <button onClick={() => handleAudioDelete(q.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" accept="audio/*,.mp3" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioUpload(q.id, f); e.target.value = ""; }} />
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                        {uploading === q.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Volume2 className="h-3 w-3" /> Upload Audio</>}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="py-8 text-center text-text-light">No listening questions for this lesson.</p>}
          </div>
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage listening questions.</p></div>}
    </div>
  );
}

// ======================== DIALOGUES TAB ========================
function DialoguesTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [dialogues, setDialogues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedDialogue, setExpandedDialogue] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", dariTitle: "" });
  const [lineForm, setLineForm] = useState({ speaker: "", english: "", dari: "", order: 0 });

  useEffect(() => { loadLessons(); }, []);

  const loadLessons = async () => {
    setLoading(true);
    try { const l = await api.admin.lessons(); setLessons(l); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadDialogues = async (lessonId: string) => {
    if (!lessonId) return;
    setLoading(true);
    try { const data = await api.admin.getDialogues(lessonId); setDialogues(data || []); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedLesson) loadDialogues(selectedLesson); else setDialogues([]); }, [selectedLesson]);

  const handleCreate = async () => {
    try {
      await api.admin.createDialogue({ ...form, lessonId: selectedLesson });
      setShowForm(false); setForm({ title: "", dariTitle: "" });
      loadDialogues(selectedLesson);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this dialogue?")) return; await api.admin.deleteDialogue(id); loadDialogues(selectedLesson); };

  const handleAddLine = async (dialogueId: string) => {
    try {
      await api.admin.addDialogueLine({ ...lineForm, dialogueId });
      setLineForm({ speaker: "", english: "", dari: "", order: (dialogues.find((d: any) => d.id === dialogueId)?.lines?.length || 0) + 1 });
      loadDialogues(selectedLesson);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteLine = async (id: string) => { if (!confirm("Delete this line?")) return; await api.admin.deleteDialogueLine(id); loadDialogues(selectedLesson); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Dialogue Management</h2>
        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLesson && (
        <>
          <button onClick={() => { setShowForm(true); }} className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> New Dialogue</button>
          {showForm && (
            <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold">New Dialogue</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
                <input value={form.dariTitle} onChange={(e) => setForm({ ...form, dariTitle: e.target.value })} placeholder="Dari Title" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary" />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleCreate} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white">Create</button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {dialogues.map((d: any) => (
              <div key={d.id} className="rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-bold">{d.title}</div>
                    {d.dariTitle && <div className="text-xs text-text-light">{d.dariTitle}</div>}
                    <div className="text-xs text-text-light">{d.lines?.length || 0} lines</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setExpandedDialogue(expandedDialogue === d.id ? null : d.id)} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100">
                      {expandedDialogue === d.id ? <ChevronDown className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {expandedDialogue === d.id && (
                  <div className="border-t border-border p-4">
                    <div className="space-y-2 mb-4">
                      {d.lines?.map((line: any) => (
                        <div key={line.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <div>
                            <span className="text-xs font-bold uppercase text-primary">{line.speaker}:</span>
                            <span className="ml-2 text-sm">{line.english}</span>
                            {line.dari && <span className="ml-2 text-xs text-text-light">({line.dari})</span>}
                          </div>
                          <button onClick={() => handleDeleteLine(line.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <input value={lineForm.speaker} onChange={(e) => setLineForm({ ...lineForm, speaker: e.target.value })} placeholder="Speaker" className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary" />
                      <input value={lineForm.english} onChange={(e) => setLineForm({ ...lineForm, english: e.target.value })} placeholder="English" className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary" />
                      <input value={lineForm.dari} onChange={(e) => setLineForm({ ...lineForm, dari: e.target.value })} placeholder="Dari" className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary" />
                      <button onClick={() => handleAddLine(d.id)} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-dark">Add Line</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {dialogues.length === 0 && <p className="py-8 text-center text-text-light">No dialogues for this lesson.</p>}
          </div>
        </>
      )}
      {!selectedLesson && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to manage dialogues.</p></div>}
    </div>
  );
}

// ======================== UNITS TAB ========================
function UnitsTab() {
  const [units, setUnits] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", dariTitle: "", description: "", dariDescription: "", courseId: "", order: 1 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const [u, c] = await Promise.all([api.admin.units(), api.admin.courses()]); setUnits(u); setCourses(c); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      if (editing) { await api.admin.updateUnit(editing.id, form); }
      else { await api.admin.createUnit(form); }
      setShowForm(false); setEditing(null); setForm({ title: "", dariTitle: "", description: "", dariDescription: "", courseId: "", order: 1 }); loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this unit?")) return; await api.admin.deleteUnit(id); loadData(); };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Unit Management</h2>
        <button onClick={() => { setEditing(null); setForm({ title: "", dariTitle: "", description: "", dariDescription: "", courseId: "", order: 1 }); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white sm:text-sm"><Plus className="h-4 w-4" /> Add Unit</button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold">{editing ? "Edit Unit" : "New Unit"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (English)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.dariTitle} onChange={(e) => setForm({ ...form, dariTitle: e.target.value })} placeholder="Title (Dari)" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <input value={form.dariDescription} onChange={(e) => setForm({ ...form, dariDescription: e.target.value })} placeholder="Dari Description" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
            <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm">
              <option value="">Select Course</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} type="number" placeholder="Order" className="rounded-lg border border-border p-2.5 text-xs outline-none focus:border-primary sm:text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white sm:text-sm">{editing ? "Update" : "Create"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-border px-5 py-2 text-xs font-medium text-text-light sm:text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {units.map((unit: any) => (
          <div key={unit.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary sm:h-12 sm:w-12">{unit.title.charAt(0)}</div>
              <div>
                <div className="text-sm font-bold sm:text-base">{unit.title}</div>
                <div className="text-xs text-text-light">{unit.course?.title || "No course"} • {unit._count?.lessons || 0} lessons</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditing(unit); setForm({ title: unit.title, dariTitle: unit.dariTitle || "", description: unit.description, dariDescription: unit.dariDescription || "", courseId: unit.courseId, order: unit.order }); setShowForm(true); }} className="rounded-lg p-1.5 text-text-light hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => handleDelete(unit.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {units.length === 0 && <p className="py-8 text-center text-text-light">No units yet.</p>}
      </div>
    </div>
  );
}

// ======================== LESSON BUILDER TAB ========================
function LessonBuilderTab() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.lessons().then(setLessons).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedLessonId) { setLessonData(null); return; }
    setLoading(true);
    api.admin.getLessonBuilder(selectedLessonId)
      .then(setLessonData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedLessonId]);

  const stats = [
    { icon: Bookmark, label: "Vocabulary", count: lessonData?._count?.vocabularies || 0, color: "bg-blue-50 text-blue-600" },
    { icon: Edit3, label: "Writing Questions", count: lessonData?._count?.writingQuestions || 0, color: "bg-emerald-50 text-emerald-600" },
    { icon: Mic, label: "Speaking Questions", count: lessonData?._count?.speakingQuestions || 0, color: "bg-amber-50 text-amber-600" },
    { icon: Headphones, label: "Listening Questions", count: lessonData?._count?.listeningQuestions || 0, color: "bg-purple-50 text-purple-600" },
    { icon: MessageCircle, label: "Dialogues", count: lessonData?._count?.dialogues || 0, color: "bg-pink-50 text-pink-600" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Lesson Builder</h2>
        <select value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)} className="rounded-lg border border-border p-2 text-xs outline-none focus:border-primary sm:text-sm">
          <option value="">Select Lesson</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      {selectedLessonId && lessonData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-bold">{lessonData.title}</h3>
            <p className="text-sm text-text-light">{lessonData.dariTitle} • {lessonData.course?.title}</p>
            <p className="mt-2 text-sm text-text-light">{lessonData.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-white p-4 text-center shadow-sm">
                <div className={cn("mx-auto mb-2 inline-flex rounded-lg p-2", s.color)}><s.icon className="h-4 w-4" /></div>
                <div className="text-lg font-bold">{s.count}</div>
                <div className="text-xs text-text-light">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h4 className="mb-3 font-bold flex items-center gap-2"><Bookmark className="h-4 w-4 text-blue-500" /> Vocabulary</h4>
              {lessonData.vocabularies?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lessonData.vocabularies.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 text-sm">
                      <span className="font-medium">{v.englishWord}</span>
                      <span className="text-text-light">{v.dariTranslation}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-text-light py-4 text-center">No vocabulary words yet.</p>}
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h4 className="mb-3 font-bold flex items-center gap-2"><Edit3 className="h-4 w-4 text-emerald-500" /> Writing</h4>
              {lessonData.writingQuestions?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lessonData.writingQuestions.map((q: any) => (
                    <div key={q.id} className="rounded-lg bg-gray-50 p-2.5 text-sm">
                      <div className="font-medium">{q.question}</div>
                      <div className="text-xs text-text-light">{q.type}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-text-light py-4 text-center">No writing questions yet.</p>}
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h4 className="mb-3 font-bold flex items-center gap-2"><Mic className="h-4 w-4 text-amber-500" /> Speaking</h4>
              {lessonData.speakingQuestions?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lessonData.speakingQuestions.map((q: any) => (
                    <div key={q.id} className="rounded-lg bg-gray-50 p-2.5 text-sm">
                      <div className="font-medium">{q.question}</div>
                      <div className="text-xs text-text-light">Expected: {q.expectedAnswer || "N/A"}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-text-light py-4 text-center">No speaking questions yet.</p>}
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h4 className="mb-3 font-bold flex items-center gap-2"><Headphones className="h-4 w-4 text-purple-500" /> Listening</h4>
              {lessonData.listeningQuestions?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lessonData.listeningQuestions.map((q: any) => (
                    <div key={q.id} className="rounded-lg bg-gray-50 p-2.5 text-sm">
                      <div className="font-medium">{q.question}</div>
                      <div className="text-xs text-text-light">{q.type} • {q.audioUrl ? "Has Audio" : "No Audio"}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-text-light py-4 text-center">No listening questions yet.</p>}
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h4 className="mb-3 font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-pink-500" /> Dialogues</h4>
              {lessonData.dialogues?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lessonData.dialogues.map((d: any) => (
                    <div key={d.id} className="rounded-lg bg-gray-50 p-2.5 text-sm">
                      <div className="font-medium">{d.title}</div>
                      <div className="text-xs text-text-light">{d.lines?.length || 0} lines</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-text-light py-4 text-center">No dialogues yet.</p>}
            </div>
          </div>
        </div>
      )}
      {!selectedLessonId && <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"><p className="text-text-light">Select a lesson to view its complete structure.</p></div>}
    </div>
  );
}

// ======================== MEDIA CENTER TAB ========================
function MediaCenterTab() {
  const [mediaData, setMediaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"vocabulary" | "listening" | "speaking" | "dialogue" | "pronunciation">("vocabulary");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const data = await api.admin.mediaCenter(); setMediaData(data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!mediaData) return <div className="py-8 text-center text-text-light">No media data available.</div>;

  const subtabs = ["vocabulary", "listening", "speaking", "dialogue", "pronunciation"] as const;
  const counts: Record<string, number> = {
    vocabulary: mediaData.vocabularyAudio?.length || 0,
    listening: mediaData.listeningAudio?.length || 0,
    speaking: mediaData.speakingAudio?.length || 0,
    dialogue: mediaData.dialogueAudio?.length || 0,
    pronunciation: mediaData.pronunciationAudio?.length || 0,
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Media Center</h2>
        <div className="flex gap-1.5">
          {subtabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", subTab === tab ? "bg-primary text-white" : "bg-gray-100 text-text-light")}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        {subTab === "vocabulary" && (
          <div className="divide-y divide-border">
            {mediaData.vocabularyAudio?.length > 0 ? mediaData.vocabularyAudio.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold">{item.vocabulary?.englishWord || "Unknown word"}</div>
                  <div className="text-xs text-text-light">Lesson: {item.vocabulary?.lessonId || "N/A"}</div>
                </div>
                <audio controls src={item.audioUrl} className="h-8 w-48" />
              </div>
            )) : <p className="p-8 text-center text-text-light">No vocabulary audio.</p>}
          </div>
        )}
        {subTab === "listening" && (
          <div className="divide-y divide-border">
            {mediaData.listeningAudio?.length > 0 ? mediaData.listeningAudio.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold">{item.question}</div>
                  <div className="text-xs text-text-light">Lesson: {item.lessonId}</div>
                </div>
                {item.audioUrl && <audio controls src={item.audioUrl} className="h-8 w-48" />}
              </div>
            )) : <p className="p-8 text-center text-text-light">No listening audio.</p>}
          </div>
        )}
        {subTab === "speaking" && (
          <div className="divide-y divide-border">
            {mediaData.speakingAudio?.length > 0 ? mediaData.speakingAudio.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold">{item.question}</div>
                  <div className="text-xs text-text-light">Lesson: {item.lessonId}</div>
                </div>
                {item.audioUrl && <audio controls src={item.audioUrl} className="h-8 w-48" />}
              </div>
            )) : <p className="p-8 text-center text-text-light">No speaking audio.</p>}
          </div>
        )}
        {subTab === "dialogue" && (
          <div className="divide-y divide-border">
            {mediaData.dialogueAudio?.length > 0 ? mediaData.dialogueAudio.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold">{item.dialogue?.title || "Unknown dialogue"}</div>
                  <div className="text-xs text-text-light">{item.english}</div>
                </div>
                {item.audioUrl && <audio controls src={item.audioUrl} className="h-8 w-48" />}
              </div>
            )) : <p className="p-8 text-center text-text-light">No dialogue audio.</p>}
          </div>
        )}
        {subTab === "pronunciation" && (
          <div className="divide-y divide-border">
            {mediaData.pronunciationAudio?.length > 0 ? mediaData.pronunciationAudio.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold">{item.word || "Unknown word"}</div>
                  <div className="text-xs text-text-light">Lesson: {item.lessonId}</div>
                </div>
                {item.audioUrl && <audio controls src={item.audioUrl} className="h-8 w-48" />}
              </div>
            )) : <p className="p-8 text-center text-text-light">No pronunciation audio.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== USERS TAB ========================
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try { const data = await api.admin.users(page); setUsers(data.users || []); setTotalPages(data.totalPages || 1); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const viewUser = async (id: string) => { try { const data = await api.admin.getUser(id); setUserDetail(data); setSelectedUser(id); } catch (err) { console.error(err); } };
  const toggleSuspend = async (id: string) => { await api.admin.toggleSuspendUser(id); loadUsers(); if (selectedUser === id) viewUser(id); };

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">User Management</h2>
      {selectedUser && userDetail && (
        <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold">User: {userDetail.fullName}</h3>
            <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} className="text-xs text-text-light hover:text-text">Close</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><span className="text-xs text-text-light">Email:</span> <span className="text-sm font-medium">{userDetail.email}</span></div>
            <div><span className="text-xs text-text-light">Role:</span> <span className="text-sm font-medium">{userDetail.role}</span></div>
            <div><span className="text-xs text-text-light">XP:</span> <span className="text-sm font-medium">{userDetail.xp}</span></div>
            <div><span className="text-xs text-text-light">Streak:</span> <span className="text-sm font-medium">{userDetail.dailyStreak} days</span></div>
            <div><span className="text-xs text-text-light">Status:</span>
              <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", userDetail.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{userDetail.isActive ? "Active" : "Suspended"}</span>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={() => toggleSuspend(userDetail.id)} className={cn("rounded-lg px-4 py-2 text-xs font-medium text-white", userDetail.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")}>
              {userDetail.isActive ? "Suspend User" : "Activate User"}
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Email</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Role</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">XP</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-light sm:px-4 sm:py-3">Status</th>
              <th className="px-3 py-2.5 text-right font-medium text-text-light sm:px-4 sm:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">{u.fullName}</td>
                <td className="px-3 py-2.5 text-text-light sm:px-4 sm:py-3">{u.email}</td>
                <td className="px-3 py-2.5 capitalize sm:px-4 sm:py-3">{u.role?.toLowerCase()}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">{u.xp}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{u.isActive ? "Active" : "Suspended"}</span>
                </td>
                <td className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                  <button onClick={() => viewUser(u.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5">View</button>
                  <button onClick={() => toggleSuspend(u.id)} className="ml-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50">{u.isActive ? "Suspend" : "Activate"}</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-light">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50">Previous</button>
          <span className="text-xs text-text-light">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
