"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Trophy, User, LogIn, Menu, X, Shield, CreditCard } from "lucide-react";
import { api } from "@/lib/api";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/community", label: "Community", icon: Users },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
    if (token) {
      api.auth.profile()
        .then((u) => setIsAdmin(u.role === "ADMIN"))
        .catch(() => { /* ignore */ });
    } else {
      setIsAdmin(false);
    }
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">ED</div>
          <span className="hidden text-lg font-bold text-primary sm:block">English Dari</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-text-light hover:bg-gray-100 hover:text-text"
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin") ? "bg-purple-100 text-purple-700" : "text-purple-600 hover:bg-purple-50"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <Link
                href="/billing"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === "/billing" ? "bg-primary/10 text-primary" : "text-text-light hover:bg-gray-100"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === "/profile" ? "bg-primary/10 text-primary" : "text-text-light hover:bg-gray-100"
                }`}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-100"
            >
              {item.icon && <item.icon className="h-5 w-5 text-primary" />}
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50"
            >
              <Shield className="h-5 w-5" /> Admin Panel
            </Link>
          )}
          {isLoggedIn ? (
            <>
              <Link href="/billing" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-100">
                <CreditCard className="h-5 w-5 text-primary" /> Billing
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-100">
                <User className="h-5 w-5 text-primary" /> Profile
              </Link>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center gap-3 rounded-lg bg-primary px-3 py-3 text-sm font-medium text-white">
              <LogIn className="h-5 w-5" /> Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
