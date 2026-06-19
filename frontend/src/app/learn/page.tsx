"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Lock,
  Star,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const worldColors: Record<string, string> = {
  "Everyday English": "from-emerald-400 to-emerald-600",
  "Education English": "from-blue-400 to-blue-600",
  "Career English": "from-amber-400 to-amber-600",
  "Professional English": "from-purple-400 to-purple-600",
};

export default function LearnPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.courses.list(),
      api.gamification.progress().catch(() => null),
    ])
      .then(([coursesData, progress]) => {
        setCourses(coursesData);
        setUserProgress(progress);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const worlds = [...new Set(courses.map((c) => c.world))];

  // Build completed lesson set from user progress
  const completedLessons = new Set(
    userProgress?.user?.progress
      ?.filter((p: any) => p.completed)
      .map((p: any) => p.lessonId) || [],
  );

  // Flatten lessons from selected course's units
  const getLessonsFromCourse = (course: any) => {
    if (!course) return [];
    if (course.units) return course.units.flatMap((u: any) => u.lessons || []);
    return [];
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Learn English</h1>
        <p className="mt-2 text-text-light">
          Choose a course and start learning
        </p>
      </div>

      {worlds.map((world) => (
        <section key={world} className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`h-1 w-12 rounded-full bg-gradient-to-r ${worldColors[world] || "from-primary to-primary"}`}
            />
            <h2 className="text-xl font-bold">{world}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((c) => c.world === world)
              .map((course) => (
                <button
                  key={course.id}
                  onClick={async () => {
                    if (selectedCourse?.id === course.id) { setSelectedCourse(null); return; }
                    setCourseLoading(true);
                    try {
                      const full = await api.courses.get(course.id);
                      setSelectedCourse(full);
                    } catch (err) { console.error(err); }
                    finally { setCourseLoading(false); }
                  } }
                  className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 text-left shadow-sm transition-all hover:shadow-xl"
                >
                  <div
                    className={`absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br ${worldColors[world] || "from-primary to-primary"} opacity-10`}
                  />
                  <div className="relative">
                    <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-3">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold">{course.title}</h3>
                    <p className="mb-4 text-sm text-text-light line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-light">
                        {course._count?.units || 0} units
                      </span>
                      <ChevronRight className="h-4 w-4 text-text-light transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {/* Course Detail with Units & Lessons */}
          {selectedCourse &&
            selectedCourse.units &&
            selectedCourse.units.length > 0 && (
              <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold">{selectedCourse.title}</h3>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="text-sm text-text-light hover:text-text"
                  >
                    Close
                  </button>
                </div>
                <p className="mb-6 text-text-light">
                  {selectedCourse.description}
                </p>

                {/* If course has units, show units with nested lessons */}
                {selectedCourse.units ? (
                  selectedCourse.units.map((unit: any, ui: number) => (
                    <div key={unit.id} className="mb-6">
                      <h4 className="mb-3 flex items-center gap-2 text-base font-bold">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {ui + 1}
                        </span>
                        {unit.title}
                        {unit.dariTitle && (
                          <span className="text-sm text-text-light">
                            ({unit.dariTitle})
                          </span>
                        )}
                      </h4>
                      <div className="space-y-2">
                        {(unit.lessons || []).map(
                          (lesson: any, index: number) => {
                            const isCompleted = completedLessons.has(lesson.id);
                            const prevLessonId =
                              unit.lessons?.[index - 1]?.id ||
                              selectedCourse.units?.[ui - 1]?.lessons?.slice(
                                -1,
                              )[0]?.id;
                            const isLocked =
                              index > 0 &&
                              prevLessonId &&
                              !completedLessons.has(prevLessonId);
                            return (
                              <Link
                                key={lesson.id}
                                href={isLocked ? "#" : `/learn/${lesson.id}`}
                                className={cn(
                                  "flex items-center justify-between rounded-xl border p-4 transition-colors",
                                  isCompleted
                                    ? "border-green-200 bg-green-50"
                                    : isLocked
                                      ? "border-border bg-gray-50 opacity-60 cursor-not-allowed"
                                      : "border-border hover:bg-gray-50",
                                )}
                                onClick={(e) => {
                                  if (isLocked) e.preventDefault();
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                                      isCompleted
                                        ? "bg-green-500 text-white"
                                        : "bg-primary/10 text-primary",
                                    )}
                                  >
                                    {isCompleted ? "✓" : index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {lesson.title}
                                    </div>
                                    <div className="text-xs text-text-light">
                                      {lesson.dariTitle}
                                    </div>
                                  </div>
                                </div>
                                {isLocked ? (
                                  <Lock className="h-4 w-4 text-text-light" />
                                ) : isCompleted ? (
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-text-light" />
                                )}
                              </Link>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  /* Fallback to flat lessons list if no units */
                  <div className="space-y-3">
                    {getLessonsFromCourse(selectedCourse).map(
                      (lesson: any, index: number) => {
                        const isCompleted = completedLessons.has(lesson.id);
                        const isLocked =
                          index > 0 &&
                          !completedLessons.has(
                            getLessonsFromCourse(selectedCourse)[index - 1]?.id,
                          );
                        return (
                          <Link
                            key={lesson.id}
                            href={isLocked ? "#" : `/learn/${lesson.id}`}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-4 transition-colors",
                              isCompleted
                                ? "border-green-200 bg-green-50"
                                : isLocked
                                  ? "border-border bg-gray-50 opacity-60 cursor-not-allowed"
                                  : "border-border hover:bg-gray-50",
                            )}
                            onClick={(e) => {
                              if (isLocked) e.preventDefault();
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                                  isCompleted
                                    ? "bg-green-500 text-white"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {isCompleted ? "✓" : index + 1}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {lesson.title}
                                </div>
                                <div className="text-xs text-text-light">
                                  {lesson.dariTitle}
                                </div>
                              </div>
                            </div>
                            {isLocked ? (
                              <Lock className="h-4 w-4 text-text-light" />
                            ) : isCompleted ? (
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-text-light" />
                            )}
                          </Link>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            )}

          {selectedCourse &&
            !getLessonsFromCourse(selectedCourse).length &&
            !selectedCourse.units && (
              <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{selectedCourse.title}</h3>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="text-sm text-text-light hover:text-text"
                  >
                    Close
                  </button>
                </div>
                <p className="my-6 text-text-light">
                  {selectedCourse.description}
                </p>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-text-light">
                    Loading lessons...
                  </span>
                </div>
              </div>
            )}
        </section>
      ))}

      {courses.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-text-light" />
          <h3 className="mb-2 text-lg font-bold">No courses available</h3>
          <p className="text-text-light">Check back soon for new content!</p>
        </div>
      )}
    </div>
  );
}
