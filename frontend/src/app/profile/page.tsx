"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Award, BookOpen, Shield, Mail, Calendar, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { User as UserType } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/login"); return; }
    api.auth.profile()
      .then(setProfile)
      .catch(() => { localStorage.removeItem("accessToken"); router.push("/auth/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.auth.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const user = profile || ({} as UserType);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
          {(user.fullName || "U").charAt(0)}
        </div>
        <h1 className="text-2xl font-bold">{user.fullName || "User"}</h1>
        <p className="text-text-light">{user.email}</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          <User className="h-4 w-4" />
          {user.role || "STUDENT"}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Account Info</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-text-light" />
              <div>
                <div className="text-sm text-text-light">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-text-light" />
              <div>
                <div className="text-sm text-text-light">Joined</div>
                <div className="font-medium">{user.createdAt ? formatDate(user.createdAt) : "Recently"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-text-light" />
              <div>
                <div className="text-sm text-text-light">XP</div>
                <div className="font-medium">{user.xp || 0} points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Quick Links</h2>
          <div className="space-y-3">
            <button onClick={() => router.push(isAdmin ? "/admin/dashboard" : "/student/dashboard")} className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">Dashboard</span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-light" />
            </button>
            <button onClick={() => router.push("/achievements")} className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Achievements</span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-light" />
            </button>
            {isAdmin && (
              <button onClick={() => router.push("/admin/dashboard")} className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Admin Panel</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light" />
              </button>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-between rounded-xl bg-red-50 p-4 transition-colors hover:bg-red-100"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-600">{loggingOut ? "Signing out..." : "Sign Out"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
