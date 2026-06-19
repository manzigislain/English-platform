"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Trophy, Zap, Flame, ChevronRight, ArrowRight, Star, Clock, Users, Sparkles, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import { formatXp } from "@/lib/utils";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/login"); return; }

    Promise.all([
      api.auth.profile(),
      api.gamification.progress(),
      api.gamification.leaderboard(),
      api.subscriptions.getActive().catch(() => null),
    ])
      .then(([p, prog, lb, sub]) => {
        setProfile(p);
        setProgress(prog);
        setLeaderboard(lb);
        setSubscription(sub);
      })
      .catch(() => { localStorage.removeItem("accessToken"); router.push("/auth/login"); })
      .finally(() => setLoading(false));

    const interval = window.setInterval(() => {
      api.subscriptions.getActive().then(setSubscription).catch(() => null);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [router]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const user = profile || progress?.user || {};
  const xp = user.xp || 0;
  const streak = user.dailyStreak || 0;
  const lessonsDone = progress?.lessonsCompleted || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome */}
      <div className="mb-8 rounded-2xl gradient-hero p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4" />
              {subscription?.plan?.name ? `${subscription.plan.name} Plan` : "Seed Plan"}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {user.fullName || "Learner"}! 👋</h1>
            <p className="mt-2 text-white/80">Continue your English journey</p>
          </div>
          <Link
            href="/learn"
            className="hidden items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary transition-all hover:shadow-lg sm:flex"
          >
            Continue Learning <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Zap, label: "Total XP", value: formatXp(xp), color: "text-yellow-500 bg-yellow-50" },
          { icon: Flame, label: "Day Streak", value: `${streak} days`, color: "text-orange-500 bg-orange-50" },
          { icon: BookOpen, label: "Lessons Done", value: lessonsDone.toString(), color: "text-blue-500 bg-blue-50" },
          { icon: Trophy, label: "Rank", value: "#1", color: "text-purple-500 bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-text-light">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Progress Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Your Journey</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2">
                <span className="text-xl">🌱</span>
                <div>
                  <div className="text-sm font-semibold text-green-700">Seed</div>
                  <div className="text-xs text-green-500">Free Level</div>
                </div>
              </div>
              <div className="h-px flex-1 border-t-2 border-dashed border-gray-300" />
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2 opacity-50">
                <span className="text-xl">🌿</span>
                <div>
                  <div className="text-sm font-semibold">Growth</div>
                  <div className="text-xs text-text-light">Paid Level</div>
                </div>
              </div>
              <div className="h-px flex-1 border-t-2 border-dashed border-gray-300" />
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2 opacity-30">
                <span className="text-xl">🌳</span>
                <div>
                  <div className="text-sm font-semibold">Success</div>
                  <div className="text-xs text-text-light">Premium</div>
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-gray-100">
              <div className="h-2 w-1/4 rounded-full bg-primary transition-all" />
            </div>
            <p className="mt-2 text-xs text-text-light">500 XP needed for Growth level</p>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
            {progress?.streakHistory?.length > 0 ? (
              <div className="space-y-3">
                {progress.streakHistory.slice(0, 5).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">+{entry.xpEarned} XP</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-text-light" />
                <p className="text-sm text-text-light">Start learning to see your activity!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/learn" className="flex items-center justify-between rounded-xl bg-primary/5 p-4 transition-colors hover:bg-primary/10">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-medium">Continue Lesson</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light" />
              </Link>
              <Link href="/community" className="flex items-center justify-between rounded-xl bg-blue-50 p-4 transition-colors hover:bg-blue-100">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Join Discussion</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light" />
              </Link>
              <Link href="/achievements" className="flex items-center justify-between rounded-xl bg-amber-50 p-4 transition-colors hover:bg-amber-100">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">View Badges</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light" />
              </Link>
            </div>
          </div>

          {/* Badges Preview */}
          {progress?.badges?.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">🏅 Recent Badges</h2>
              <div className="space-y-2">
                {progress.badges.slice(0, 3).map((ub: any) => (
                  <div key={ub.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="text-sm font-medium">{ub.badge.name}</div>
                      <div className="text-xs text-text-light">{ub.badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile CTA */}
      <Link
        href="/learn"
        className="fixed bottom-20 left-4 right-4 z-40 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-white shadow-lg sm:hidden"
      >
        Continue Learning <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
