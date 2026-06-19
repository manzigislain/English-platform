"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, BookOpen, FileText, Bookmark, MessageSquare, Award,
  DollarSign, CreditCard, Users, Volume2, Shield, LogOut, ChevronLeft,
  Menu, X, Home, Loader2, Edit3, Mic, Headphones, MessageCircle, Layers, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const sidebarItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/dashboard?tab=courses", label: "Courses", icon: BookOpen },
  { href: "/admin/dashboard?tab=lessons", label: "Lessons", icon: FileText },
  { href: "/admin/dashboard?tab=lesson-builder", label: "Lesson Builder", icon: Layers },
  { href: "/admin/dashboard?tab=vocabulary", label: "Vocabulary", icon: Bookmark },
  { href: "/admin/dashboard?tab=writing", label: "Writing", icon: Edit3 },
  { href: "/admin/dashboard?tab=speaking", label: "Speaking", icon: Mic },
  { href: "/admin/dashboard?tab=listening", label: "Listening", icon: Headphones },
  { href: "/admin/dashboard?tab=reading", label: "Reading", icon: BookOpen },
  { href: "/admin/dashboard?tab=pronunciation", label: "Pronunciation", icon: Volume2 },
  { href: "/admin/dashboard?tab=quiz", label: "Quiz", icon: HelpCircle },
  { href: "/admin/dashboard?tab=dialogues", label: "Dialogues", icon: MessageCircle },
  { href: "/admin/dashboard?tab=media", label: "Media Center", icon: Volume2 },
  { href: "/admin/dashboard?tab=community", label: "Community", icon: MessageSquare },
  { href: "/admin/dashboard?tab=certificates", label: "Certificates", icon: Award },
  { href: "/admin/dashboard?tab=payments", label: "Payments", icon: DollarSign },
  { href: "/admin/dashboard?tab=plans", label: "Plans", icon: CreditCard },
  { href: "/admin/dashboard?tab=users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/login"); return; }
    api.auth.profile()
      .then((u) => {
        if (u.role !== "ADMIN") {
          router.push("/student/dashboard");
          return;
        }
        setUser(u);
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        router.push("/auth/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-text-light">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Compute current tab from URL search params (safe: renders only after auth check on client)
  const currentTab = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tab") || "dashboard"
    : "dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">AD</div>
            <span className="text-sm font-bold">Admin Panel</span>
          </Link>
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebarOpen(false); }}
            className="rounded-lg p-1.5 text-text-light hover:bg-gray-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarItems.map((item) => {
            const itemTab = item.href.split("tab=")[1] || "dashboard";
            const isActiveItem = currentTab === itemTab;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActiveItem && pathname.startsWith("/admin")
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-light hover:bg-gray-100 hover:text-text",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(user?.fullName || "A").charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.fullName || "Admin"}</p>
              <p className="truncate text-xs text-text-light">Administrator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-light hover:bg-gray-50 flex-1"
            >
              <Home className="h-3.5 w-3.5" /> Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex-1"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-text-light hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/student/dashboard"
              className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-light hover:bg-gray-50 sm:flex"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Switch to Student View
            </Link>
            <span className="text-sm text-text-light">
              {user?.email || ""}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
