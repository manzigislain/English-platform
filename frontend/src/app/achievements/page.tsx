"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Award, Sparkles, Lock, Star, Flame, BookOpen, Users, Zap, TrendingUp, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"badges" | "achievements">("badges");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/login"); return; }

    api.gamification.progress()
      .then(setProgress)
      .catch(() => { /* not logged in */ })
      .finally(() => setLoading(false));
  }, [router]);

  const handleCheckBadges = async () => {
    setChecking(true);
    try {
      const newBadges = await api.gamification.checkBadges();
      if (newBadges.length > 0) {
        alert(`Congratulations! You earned ${newBadges.length} new badge(s)!`);
        const data = await api.gamification.progress();
        setProgress(data);
      } else {
        alert("No new badges to earn yet. Keep learning!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to check badges");
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const user = progress?.user || {};
  const badges = progress?.badges || [];
  const achievements = progress?.achievements || [];
  const userXp = user.xp || 0;
  const lessonsDone = progress?.lessonsCompleted || 0;

  const allBadges = [
    { name: "First Lesson", icon: BookOpen, desc: "Complete your first lesson", earned: badges.some((b: any) => b.badge?.name === "First Lesson" || b.badge?.id?.includes("first")), xp: 50 },
    { name: "7-Day Streak", icon: Flame, desc: "Study for 7 days in a row", earned: badges.some((b: any) => b.badge?.name?.includes("Streak")), xp: 100 },
    { name: "100 Words", icon: Book, desc: "Learn 100 words", earned: badges.some((b: any) => b.badge?.name?.includes("Vocabulary") || b.badge?.name?.includes("Words")), xp: 200 },
    { name: "Perfect Score", icon: Star, desc: "Get 100% on a lesson", earned: badges.some((b: any) => b.badge?.name?.includes("Perfect")), xp: 150 },
    { name: "Knowledge Seeker", icon: TrendingUp, desc: "Complete 10 lessons", earned: lessonsDone >= 10 || badges.some((b: any) => b.badge?.name?.includes("Knowledge")), xp: 300 },
    { name: "Community Member", icon: Users, desc: "Make your first post", earned: badges.some((b: any) => b.badge?.name?.includes("Community")), xp: 75 },
    { name: "English Champion", icon: Trophy, desc: "Earn 5000 XP", earned: userXp >= 5000, xp: 2000 },
    { name: "Dedicated Learner", icon: Zap, desc: "Study for 30 days total", earned: badges.some((b: any) => b.badge?.name?.includes("Dedicated")), xp: 500 },
  ];

  const earnedBadgeCount = allBadges.filter((b) => b.earned).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="mt-2 text-text-light">Track your progress and earn rewards</p>
        </div>
        <button
          onClick={handleCheckBadges}
          disabled={checking}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Check Badges
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { icon: Trophy, label: "Total XP", value: userXp.toString(), color: "text-amber-500 bg-amber-50" },
          { icon: Award, label: "Badges", value: `${earnedBadgeCount}/${allBadges.length}`, color: "text-blue-500 bg-blue-50" },
          { icon: Sparkles, label: "Lessons Done", value: lessonsDone.toString(), color: "text-purple-500 bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4 text-center shadow-sm">
            <div className={`mx-auto mb-2 inline-flex rounded-lg p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-text-light">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab("badges")}
          className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-colors", activeTab === "badges" ? "bg-primary text-white" : "bg-gray-100 text-text-light hover:bg-gray-200")}
        >
          🏅 Badges
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-colors", activeTab === "achievements" ? "bg-primary text-white" : "bg-gray-100 text-text-light hover:bg-gray-200")}
        >
          🏆 Achievements
        </button>
      </div>

      {activeTab === "badges" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allBadges.map((badge) => (
            <div
              key={badge.name}
              className={cn("rounded-2xl border p-6 text-center transition-all", badge.earned ? "border-primary/20 bg-white shadow-sm" : "border-border bg-gray-50 opacity-60")}
            >
              <div className={cn("mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl", badge.earned ? "bg-primary/10" : "bg-gray-200")}>
                <badge.icon className={cn("h-7 w-7", badge.earned ? "text-primary" : "text-text-light")} />
              </div>
              <h3 className={cn("font-bold", badge.earned ? "text-text" : "text-text-light")}>{badge.name}</h3>
              <p className="mt-1 text-xs text-text-light">{badge.desc}</p>
              <div className="mt-3 text-xs font-medium text-primary">+{badge.xp} XP</div>
              {!badge.earned && <Lock className="mx-auto mt-2 h-4 w-4 text-text-light" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.length > 0 ? (
            achievements.map((ua: any) => (
              <div key={ua.id} className="flex items-center justify-between rounded-xl border border-primary/20 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{ua.achievement?.name || "Achievement"}</h3>
                    <p className="text-sm text-text-light">{ua.achievement?.description || ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">+{ua.achievement?.xpReward || 0} XP</div>
                  <div className="text-xs text-green-500">✓ Earned</div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border bg-white p-12 text-center shadow-sm">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-text-light" />
              <h3 className="mb-2 text-lg font-bold">No achievements yet</h3>
              <p className="text-text-light">Complete lessons and earn achievements!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple Book icon that's not imported
function Book(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
