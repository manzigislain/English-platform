"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, Volume2, Bookmark, BookmarkCheck,
  ChevronRight, Sparkles, Mic, MicOff, Play, Pause, SkipForward,
  Loader2, Headphones, MessageSquare, Edit3, Trophy, Star, BookOpen,
  FileText, HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

type SectionType = "reading" | "speaking" | "listening" | "writing" | "pronunciation" | "quiz";

interface SectionScore {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}

const sectionOrder: SectionType[] = ["reading", "speaking", "listening", "writing", "pronunciation", "quiz"];

const sectionMeta: Record<SectionType, { label: string; icon: any; desc: string }> = {
  reading: { label: "Reading", icon: BookOpen, desc: "Read passages & answer questions" },
  speaking: { label: "Speaking", icon: Mic, desc: "Practice speaking with AI scoring" },
  listening: { label: "Listening", icon: Headphones, desc: "Listen & answer questions" },
  writing: { label: "Writing", icon: Edit3, desc: "Practice writing exercises" },
  pronunciation: { label: "Pronunciation", icon: Volume2, desc: "Pronounce words with AI feedback" },
  quiz: { label: "Quiz", icon: HelpCircle, desc: "End of lesson quiz" },
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentSection, setCurrentSection] = useState<SectionType>("reading");
  const [sectionScores, setSectionScores] = useState<Record<SectionType, SectionScore>>({
    reading: { score: 0, total: 0, percentage: 0, passed: false },
    speaking: { score: 0, total: 0, percentage: 0, passed: false },
    listening: { score: 0, total: 0, percentage: 0, passed: false },
    writing: { score: 0, total: 0, percentage: 0, passed: false },
    pronunciation: { score: 0, total: 0, percentage: 0, passed: false },
    quiz: { score: 0, total: 0, percentage: 0, passed: false },
  });
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [lessonComplete, setLessonComplete] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  useEffect(() => { loadLesson(); }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const data = await api.lessons.get(lessonId);
      setLesson(data);
    } catch (err: any) {
      setError(err.message || "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionComplete = (section: SectionType, score: number, total: number) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 100;
    const passed = percentage >= 70;

    setSectionScores((prev) => ({ ...prev, [section]: { score, total, percentage, passed } }));

    // Only mark as completed and advance if passed (score >= 70%)
    if (passed) {
      setCompletedSections((prev) => new Set(prev).add(section));

      const currentIdx = sectionOrder.indexOf(section);
      const nextSection = currentIdx < sectionOrder.length - 1 ? sectionOrder[currentIdx + 1] : null;

      if (nextSection) {
        setCurrentSection(nextSection);
      } else {
        handleFinishLesson();
      }
    }
    // If not passed, stay on the same section to allow retry
  };

  const handleFinishLesson = async () => {
    try {
      const result = await api.lessons.checkCompletion(lessonId);
      setCompletionResult(result);
      setLessonComplete(true);
    } catch (err: any) {
      setError(err.message || "Failed to check completion");
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (error) return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
      <h2 className="mb-2 text-xl font-bold">Failed to load lesson</h2>
      <p className="mb-4 text-text-light">{error}</p>
      <button onClick={loadLesson} className="rounded-xl bg-primary px-6 py-3 text-white">Try Again</button>
    </div>
  );
  if (!lesson) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <button onClick={() => router.push("/learn")} className="mb-4 flex items-center gap-2 text-sm text-text-light hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </button>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-text-light">{lesson.dariTitle}</p>
      </div>

      {/* Section Navigation */}
      <div className="mb-8 grid grid-cols-6 gap-1.5">
        {sectionOrder.map((sec, idx) => {
          const score = sectionScores[sec];
          const isActive = currentSection === sec;
          const isPassed = completedSections.has(sec) && score.passed;
          const isFailed = completedSections.has(sec) && !score.passed;
          const isLocked = idx > 0 && !completedSections.has(sectionOrder[idx - 1]) && sectionOrder[idx - 1] !== currentSection;

          const SectionIcon = sectionMeta[sec].icon;
          return (
            <button
              key={sec}
              onClick={() => { if (!isLocked) setCurrentSection(sec); }}
              disabled={isLocked}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl p-2 text-center text-xs transition-all sm:text-sm",
                isActive ? "bg-primary text-white shadow-lg" : isPassed ? "bg-green-50 text-green-700" : isFailed ? "bg-red-50 text-red-600" : isLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50 text-text-light hover:bg-gray-100",
              )}
            >
              <SectionIcon className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">{sectionMeta[sec].label}</span>
              {isPassed && <CheckCircle2 className="absolute -right-1 -top-1 h-3.5 w-3.5 text-green-500" />}
              {isFailed && <XCircle className="absolute -right-1 -top-1 h-3.5 w-3.5 text-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      {currentSection === "reading" && (
        <ReadingSection
          activities={lesson.readingActivities || []}
          onComplete={(s, t) => handleSectionComplete("reading", s, t)}
        />
      )}
      {currentSection === "speaking" && (
        <SpeakingSection
          questions={lesson.speakingQuestions || []}
          onComplete={(s, t) => handleSectionComplete("speaking", s, t)}
        />
      )}
      {currentSection === "listening" && (
        <ListeningSection
          questions={lesson.listeningQuestions || []}
          onComplete={(s, t) => handleSectionComplete("listening", s, t)}
        />
      )}
      {currentSection === "writing" && (
        <WritingSection
          questions={lesson.writingQuestions || []}
          onComplete={(s, t) => handleSectionComplete("writing", s, t)}
        />
      )}
      {currentSection === "pronunciation" && (
        <PronunciationSection
          activities={lesson.pronunciationActivities || []}
          onComplete={(s, t) => handleSectionComplete("pronunciation", s, t)}
        />
      )}
      {currentSection === "quiz" && (
        <QuizSection
          lessonId={lessonId}
          quiz={lesson.quizzes?.[0] || null}
          onComplete={(s, t) => handleSectionComplete("quiz", s, t)}
        />
      )}

      {/* Lesson Complete Modal */}
      {lessonComplete && (
        <LessonCompleteModal result={completionResult} lesson={lesson} onBack={() => router.push("/learn")} />
      )}
    </div>
  );
}

// ======================== READING SECTION ========================
function ReadingSection({ activities, onComplete }: { activities: any[]; onComplete: (score: number, total: number) => void }) {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  if (activities.length === 0) return <EmptySection message="No reading exercises for this lesson." onContinue={() => onComplete(0, 0)} />;

  const activity = activities[currentActivity];
  const allQuestions = activities.flatMap((a) => a.questions);
  const totalPoints = allQuestions.reduce((s: number, q: any) => s + q.points, 0);

  const handleSubmit = async (questionId: string, answer: string) => {
    if (!answer) return;
    setSubmitting(true);
    try {
      const res = await api.reading.submitAttempt(questionId, answer);
      setResults({ ...results, [questionId]: { isCorrect: res.isCorrect } });
      if (res.isCorrect) setScore((s) => s + res.score);
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const allAnswered = allQuestions.every((q: any) => results[q.id]);
  if (allAnswered && !completed) {
    setCompleted(true);
    onComplete(score, totalPoints);
  }

  return (
    <div className="space-y-6">
      {activities.map((act: any) => (
        <div key={act.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-bold">{act.title}</h3>
          {act.dariTitle && <p className="mb-4 text-sm text-text-light">{act.dariTitle}</p>}
          {act.imageUrl && <img src={act.imageUrl} alt="" className="mb-4 w-full rounded-xl object-cover max-h-64" />}
          <div className="mb-6 rounded-xl bg-gray-50 p-5 text-sm leading-relaxed whitespace-pre-line">{act.passage}</div>
          {act.questions?.map((q: any) => (
            <div key={q.id} className="mb-4">
              <p className="mb-3 font-medium">{q.question}</p>
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt: string) => {
                    const isSelected = answers[q.id] === opt;
                    const showResult = results[q.id];
                    const isCorrect = showResult && opt === q.correctAnswer;
                    const isWrong = showResult && isSelected && !isCorrect;
                    return (
                      <button key={opt} onClick={() => { if (!results[q.id]) { setAnswers({ ...answers, [q.id]: opt }); handleSubmit(q.id, opt); } }}
                        disabled={!!results[q.id]}
                        className={cn("flex w-full items-center rounded-xl border p-3 text-left text-sm transition-all",
                          isSelected && !showResult && "border-primary bg-primary/5",
                          isCorrect && "border-green-500 bg-green-50",
                          isWrong && "border-red-500 bg-red-50",
                          !isSelected && !showResult && "border-border hover:border-primary/50",
                          showResult && !isSelected && "opacity-50")}
                      >
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {isWrong && <XCircle className="h-4 w-4 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <input type="text" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Type your answer..." disabled={!!results[q.id]}
                    className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary disabled:bg-gray-50"
                  />
                  {!results[q.id] && (
                    <button onClick={() => handleSubmit(q.id, answers[q.id])} disabled={!answers[q.id] || submitting}
                      className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-50">
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                    </button>
                  )}
                  {results[q.id] && (
                    <div className={cn("mt-2 rounded-lg p-2 text-xs", results[q.id].isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                      {results[q.id].isCorrect ? "✓ Correct!" : `✗ Answer: ${q.correctAnswer}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ======================== SPEAKING SECTION ========================
function SpeakingSection({ questions, onComplete }: { questions: any[]; onComplete: (score: number, total: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  if (questions.length === 0) return <EmptySection message="No speaking exercises for this lesson." onContinue={() => onComplete(0, 0)} />;

  const question = questions[currentQ];
  const totalPoints = questions.reduce((s: number, q: any) => s + q.points, 0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorder.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setRecordedAudio(URL.createObjectURL(blob));
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) { const r = new SpeechRecognition(); r.lang = "en-US"; r.interimResults = false; r.onresult = (e: any) => setTranscript(e.results[0][0].transcript); r.start(); }
        } catch {}
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error("Microphone access denied:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!recordedAudio) return;
    setSubmitting(true);
    try {
      const audioBlob = new Blob(chunks.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `speaking-${Date.now()}.webm`, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("questionId", question.id);
      fd.append("transcript", transcript || "");
      fd.append("audio", audioFile);
      const res = await api.speaking.submitAttempt(question.id, fd);
      setResult(res);
      setEarnedScore((s) => s + (res.score || 0));
      if (currentQ < questions.length - 1) {
        setTimeout(() => { setCurrentQ(currentQ + 1); setRecordedAudio(null); setTranscript(""); setResult(null); }, 1500);
      } else {
        setTimeout(() => { setCompleted(true); onComplete(earnedScore + (res.score || 0), totalPoints); }, 1500);
      }
    } catch (err: any) { console.error(err); } finally { setSubmitting(false); }
  };

  if (completed) return <CompleteSection title="Speaking Complete!" score={earnedScore} total={totalPoints} onContinue={() => onComplete(earnedScore, totalPoints)} />;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-primary">Speaking {currentQ + 1}/{questions.length}</span>
        <span className="text-text-light">{question.points} points</span>
      </div>
      <h3 className="mb-6 text-lg font-bold">{question.question}</h3>
      {question.audioUrl && <div className="mb-6"><audio controls src={question.audioUrl} className="w-full" /></div>}
      <div className="rounded-xl border-2 border-dashed p-8 text-center">
        {!recordedAudio ? (
          <div>
            <button onClick={isRecording ? stopRecording : startRecording}
              className={cn("mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all", isRecording ? "bg-red-500 animate-pulse" : "bg-primary hover:bg-primary-dark")}>
              {isRecording ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white" />}
            </button>
            <p className="font-medium">{isRecording ? "Recording... Click to stop" : "Click to start recording"}</p>
            {isRecording && <div className="mt-4 flex items-center justify-center gap-2"><div className="h-3 w-3 animate-pulse rounded-full bg-red-500" /><span className="text-sm text-red-500">Recording</span></div>}
          </div>
        ) : (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="font-medium text-green-600">Recording captured!</p>
            <audio controls src={recordedAudio} className="mx-auto max-w-sm" />
            {transcript && <div className="rounded-xl bg-gray-50 p-4"><p className="text-sm font-medium text-text-light">Transcript:</p><p className="italic">"{transcript}"</p></div>}
            {result && (
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-green-50 p-4">
                <div className="text-center"><div className="text-2xl font-bold text-primary">{result.accuracy}%</div><div className="text-xs text-text-light">Accuracy</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-primary">{result.pronunciationScore}%</div><div className="text-xs text-text-light">Pronunciation</div></div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        {recordedAudio && !result && (
          <>
            <button onClick={() => { setRecordedAudio(null); setTranscript(""); }} className="flex-1 rounded-xl border border-border py-3 font-medium text-text-light hover:bg-gray-50">Re-record</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary-dark disabled:opacity-50">
              {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit"}
            </button>
          </>
        )}
        {result && currentQ < questions.length - 1 && (
          <button onClick={() => { setRecordedAudio(null); setTranscript(""); setResult(null); }} className="w-full rounded-xl bg-primary py-3 font-medium text-white">Next Question</button>
        )}
      </div>
    </div>
  );
}

// ======================== LISTENING SECTION ========================
function ListeningSection({ questions, onComplete }: { questions: any[]; onComplete: (score: number, total: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; score: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);

  if (questions.length === 0) return <EmptySection message="No listening exercises for this lesson." onContinue={() => onComplete(0, 0)} />;

  const question = questions[currentQ];
  const totalPoints = questions.reduce((s: number, q: any) => s + q.points, 0);

  const handleSubmit = async () => {
    if (!answers[question.id]) return;
    setSubmitting(true);
    try {
      const result = await api.listening.submitAttempt(question.id, answers[question.id]);
      setResults({ ...results, [question.id]: { isCorrect: result.isCorrect, score: result.score } });
      const newScore = earnedScore + (result.isCorrect ? result.score : 0);
      setEarnedScore(newScore);
      if (currentQ < questions.length - 1) {
        setTimeout(() => setCurrentQ(currentQ + 1), 1000);
      } else {
        setTimeout(() => { setCompleted(true); onComplete(newScore, totalPoints); }, 1000);
      }
    } catch (err: any) { console.error(err); } finally { setSubmitting(false); }
  };

  if (completed) return <CompleteSection title="Listening Complete!" score={earnedScore} total={totalPoints} onContinue={() => onComplete(earnedScore, totalPoints)} />;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-primary">Listening {currentQ + 1}/{questions.length}</span>
        <span className="text-text-light">{question.points} points</span>
      </div>
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Headphones className="h-8 w-8 text-primary" /></div>
        <audio controls src={question.audioUrl} className="mx-auto w-full max-w-sm" />
        <p className="mt-2 text-xs text-text-light">Listen carefully and answer the question</p>
      </div>
      <h3 className="mb-6 text-lg font-bold">{question.question}</h3>
      {question.options ? (
        <div className="space-y-2">
          {question.options.map((opt: string) => {
            const isSelected = answers[question.id] === opt;
            const showResult = results[question.id];
            const isCorrect = showResult && opt === question.correctAnswer;
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button key={opt} onClick={() => !results[question.id] && setAnswers({ ...answers, [question.id]: opt })} disabled={!!results[question.id]}
                className={cn("flex w-full items-center rounded-xl border p-3 text-left text-sm transition-all",
                  isSelected && !showResult && "border-primary bg-primary/5", isCorrect && "border-green-500 bg-green-50",
                  isWrong && "border-red-500 bg-red-50", !isSelected && !showResult && "border-border hover:border-primary/50",
                  showResult && !isSelected && "opacity-50")}>
                <span className="flex-1">{opt}</span>
                {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {isWrong && <XCircle className="h-4 w-4 text-red-500" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <input type="text" value={answers[question.id] || ""} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Type your answer..." className="w-full rounded-xl border border-border p-4 text-sm outline-none focus:border-primary" />
        </div>
      )}
      <div className="mt-6">
        {!results[question.id] ? (
          <button onClick={handleSubmit} disabled={!answers[question.id] || submitting}
            className="w-full rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-50">
            {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit Answer"}
          </button>
        ) : (
          <p className={cn("text-center font-medium", results[question.id].isCorrect ? "text-green-600" : "text-red-600")}>
            {results[question.id].isCorrect ? "✓ Correct!" : `✗ Answer: ${question.correctAnswer}`}
          </p>
        )}
      </div>
    </div>
  );
}

// ======================== WRITING SECTION ========================
function WritingSection({ questions, onComplete }: { questions: any[]; onComplete: (score: number, total: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; score: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  if (questions.length === 0) return <EmptySection message="No writing exercises for this lesson." onContinue={() => onComplete(0, 0)} />;

  const question = questions[currentQ];
  const totalPoints = questions.reduce((s: number, q: any) => s + q.points, 0);

  const handleSubmit = async () => {
    if (!answers[question.id]) return;
    setSubmitting(true);
    try {
      const result = await api.writing.submitAttempt(question.id, answers[question.id]);
      setResults({ ...results, [question.id]: { isCorrect: result.isCorrect, score: result.score } });
      const newScore = score + (result.isCorrect ? result.score : 0);
      setScore(newScore);
      if (currentQ < questions.length - 1) {
        setTimeout(() => setCurrentQ(currentQ + 1), 1000);
      } else {
        setTimeout(() => { setCompleted(true); onComplete(newScore, totalPoints); }, 1000);
      }
    } catch (err: any) { console.error(err); } finally { setSubmitting(false); }
  };

  if (completed) return <CompleteSection title="Writing Complete!" score={score} total={totalPoints} onContinue={() => onComplete(score, totalPoints)} />;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-primary">Writing {currentQ + 1}/{questions.length}</span>
          <span className="text-text-light">{question.points} points</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(currentQ / questions.length) * 100}%` }} /></div>
      </div>
      <h3 className="mb-6 text-lg font-bold">{question.question}</h3>
      {question.options ? (
        <div className="space-y-3">
          {question.options.map((opt: string) => (
            <button key={opt} onClick={() => setAnswers({ ...answers, [question.id]: opt })}
              className={cn("flex w-full items-center rounded-xl border p-4 text-left transition-all", answers[question.id] === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
              <span className="flex-1">{opt}</span>
              {answers[question.id] === opt && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </button>
          ))}
        </div>
      ) : (
        <textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          placeholder="Type your answer here..." rows={3} className="w-full resize-none rounded-xl border border-border p-4 text-sm outline-none focus:border-primary" />
      )}
      {!results[question.id] ? (
        <button onClick={handleSubmit} disabled={!answers[question.id] || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-50">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {currentQ < questions.length - 1 ? "Submit & Next" : "Submit & Finish"}
        </button>
      ) : (
        <div className={cn("mt-4 rounded-xl p-4 text-center font-medium", results[question.id].isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
          {results[question.id].isCorrect ? "✓ Correct!" : `✗ The correct answer was: ${question.correctAnswer}`}
        </div>
      )}
    </div>
  );
}

// ======================== PRONUNCIATION SECTION ========================
function PronunciationSection({ activities, onComplete }: { activities: any[]; onComplete: (score: number, total: number) => void }) {
  const [currentA, setCurrentA] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  if (activities.length === 0) return <EmptySection message="No pronunciation exercises for this lesson." onContinue={() => onComplete(0, 0)} />;

  const activity = activities[currentA];
  const totalPoints = activities.reduce((s: number, a: any) => s + a.points, 0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorder.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setRecordedAudio(URL.createObjectURL(blob));
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!recordedAudio) return;
    setSubmitting(true);
    try {
      const audioBlob = new Blob(chunks.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `pronunciation-${Date.now()}.webm`, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("activityId", activity.id);
      fd.append("audio", audioFile);
      const res = await api.pronunciation.submitAttempt(activity.id, fd);
      setResult(res);
      setEarnedScore((s) => s + (res.score || 0));
      if (currentA < activities.length - 1) {
        setTimeout(() => { setCurrentA(currentA + 1); setRecordedAudio(null); setResult(null); }, 1500);
      } else {
        setTimeout(() => { setCompleted(true); onComplete(earnedScore + (res.score || 0), totalPoints); }, 1500);
      }
    } catch (err: any) { console.error(err); } finally { setSubmitting(false); }
  };

  if (completed) return <CompleteSection title="Pronunciation Complete!" score={earnedScore} total={totalPoints} onContinue={() => onComplete(earnedScore, totalPoints)} />;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-medium text-primary">Pronunciation {currentA + 1}/{activities.length}</span>
        <span className="text-text-light">{activity.points} points</span>
      </div>
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-3xl font-bold text-primary">{activity.word}</h3>
        {activity.dariWord && <p className="text-text-light">{activity.dariWord}</p>}
        {activity.audioUrl && (
          <button onClick={() => new Audio(activity.audioUrl).play().catch(() => {})}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">
            <Volume2 className="h-4 w-4" /> Listen to pronunciation
          </button>
        )}
      </div>
      <div className="rounded-xl border-2 border-dashed p-8 text-center">
        {!recordedAudio ? (
          <div>
            <button onClick={isRecording ? stopRecording : startRecording}
              className={cn("mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all", isRecording ? "bg-red-500 animate-pulse" : "bg-primary hover:bg-primary-dark")}>
              {isRecording ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white" />}
            </button>
            <p className="font-medium">{isRecording ? "Recording... Click to stop" : "Tap & say the word"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <audio controls src={recordedAudio} className="mx-auto max-w-sm" />
            {result && (
              <div className="rounded-xl bg-green-50 p-4">
                <div className="text-2xl font-bold text-primary">{result.accuracy}%</div>
                <div className="text-xs text-text-light">Pronunciation Accuracy</div>
                {result.transcript && <p className="mt-2 text-sm italic">"{result.transcript}"</p>}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        {recordedAudio && !result && (
          <>
            <button onClick={() => { setRecordedAudio(null); }} className="flex-1 rounded-xl border border-border py-3 font-medium text-text-light hover:bg-gray-50">Re-record</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-50">
              {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ======================== QUIZ SECTION ========================
function QuizSection({ lessonId, quiz, onComplete }: { lessonId: string; quiz: any; onComplete: (score: number, total: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; score: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const [loading, setLoading] = useState(!quiz);
  const [quizError, setQuizError] = useState("");
  const [quizData, setQuizData] = useState<any>(quiz);

  useEffect(() => {
    if (!quiz) {
      setLoading(true);
      setQuizError("");
      api.quiz.generate(lessonId)
        .then(setQuizData)
        .catch((err) => {
          console.error(err);
          setQuizError(err.message || "Failed to load quiz");
        })
        .finally(() => setLoading(false));
    }
  }, [lessonId]);

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (quizError) return <EmptySection message={quizError} onContinue={() => onComplete(0, 0)} />;
  if (!quizData?.questions || quizData.questions.length === 0) return <EmptySection message="No quiz questions available. Complete other sections first." onContinue={() => onComplete(0, 0)} />;

  const question = quizData.questions[currentQ];
  const totalPoints = quizData.questions.reduce((s: number, q: any) => s + q.points, 0);

  const handleSubmit = async () => {
    if (!answers[question.id]) return;
    setSubmitting(true);
    try {
      const result = await api.quiz.submitAttempt(quizData.id, question.id, answers[question.id]);
      setResults({ ...results, [question.id]: { isCorrect: result.isCorrect, score: result.score } });
      const newScore = earnedScore + (result.isCorrect ? result.score : 0);
      setEarnedScore(newScore);
      if (currentQ < quizData.questions.length - 1) {
        setTimeout(() => setCurrentQ(currentQ + 1), 1000);
      } else {
        setTimeout(() => { setCompleted(true); onComplete(newScore, totalPoints); }, 1000);
      }
    } catch (err: any) { console.error(err); } finally { setSubmitting(false); }
  };

  if (completed) return <CompleteSection title="Quiz Complete!" score={earnedScore} total={totalPoints} onContinue={() => onComplete(earnedScore, totalPoints)} />;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-primary">Quiz {currentQ + 1}/{quizData.questions.length}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">{question.sourceType}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(currentQ / quizData.questions.length) * 100}%` }} /></div>
      </div>
      <h3 className="mb-6 text-lg font-bold">{question.question}</h3>
      {question.options ? (
        <div className="space-y-2">
          {question.options.map((opt: string) => {
            const isSelected = answers[question.id] === opt;
            const showResult = results[question.id];
            const isCorrect = showResult && opt === question.correctAnswer;
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button key={opt} onClick={() => !results[question.id] && setAnswers({ ...answers, [question.id]: opt })} disabled={!!results[question.id]}
                className={cn("flex w-full items-center rounded-xl border p-3 text-left transition-all",
                  isSelected && !showResult && "border-primary bg-primary/5", isCorrect && "border-green-500 bg-green-50",
                  isWrong && "border-red-500 bg-red-50", !isSelected && !showResult && "border-border hover:border-primary/50",
                  showResult && !isSelected && "opacity-50")}>
                <span className="flex-1">{opt}</span>
                {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {isWrong && <XCircle className="h-4 w-4 text-red-500" />}
              </button>
            );
          })}
        </div>
      ) : (
        <input type="text" value={answers[question.id] || ""} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          placeholder="Type your answer..." className="w-full rounded-xl border border-border p-4 text-sm outline-none focus:border-primary" />
      )}
      <div className="mt-6">
        {!results[question.id] ? (
          <button onClick={handleSubmit} disabled={!answers[question.id] || submitting}
            className="w-full rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-50">
            {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit Answer"}
          </button>
        ) : (
          <p className={cn("text-center font-medium", results[question.id].isCorrect ? "text-green-600" : "text-red-600")}>
            {results[question.id].isCorrect ? "✓ Correct!" : `✗ Answer: ${question.correctAnswer}`}
          </p>
        )}
      </div>
    </div>
  );
}

// ======================== COMMON COMPONENTS ========================
function EmptySection({ message, onContinue }: { message: string; onContinue: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
      <p className="text-text-light">{message}</p>
      <button onClick={onContinue} className="mt-4 rounded-xl bg-primary px-6 py-3 text-white">Continue</button>
    </div>
  );
}

function CompleteSection({ title, score, total, onContinue }: { title: string; score: number; total: number; onContinue: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="mb-2 text-3xl font-bold text-primary">{score}/{total}</p>
      <p className="text-text-light">{total > 0 ? Math.round((score / total) * 100) : 0}% accuracy</p>
      <button onClick={onContinue} className="mt-4 rounded-xl bg-primary px-6 py-3 text-white">Continue</button>
    </div>
  );
}

function LessonCompleteModal({ result, lesson, onBack }: { result: any; lesson: Lesson; onBack: () => void }) {
  const sections = result?.sections;
  const allPassed = result?.completed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl text-center">
        <div className="mb-4 text-6xl">{allPassed ? "🎉" : "💪"}</div>
        <h2 className="mb-2 text-2xl font-bold">{allPassed ? "Lesson Complete!" : "Almost There!"}</h2>
        <p className="mb-6 text-text-light">{allPassed ? `You earned ${result.xpEarned} XP!` : "You need 70% or higher in each section."}</p>
        {sections && (
          <div className="mb-6 space-y-3">
            {Object.entries(sections).map(([key, val]: [string, any]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  {val.passed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  <span className="font-medium capitalize">{key}</span>
                </div>
                <span className={cn("font-bold", val.passed ? "text-green-600" : "text-red-600")}>{val.percentage}%</span>
              </div>
            ))}
          </div>
        )}
        {allPassed && result.xpEarned > 0 && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-amber-500" />
            <p className="text-lg font-bold text-amber-700">+{result.xpEarned} XP Earned!</p>
          </div>
        )}
        <button onClick={onBack} className="w-full rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary-dark">Continue Learning</button>
      </div>
    </div>
  );
}
