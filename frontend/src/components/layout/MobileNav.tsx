"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Users, Trophy, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/community", label: "Community", icon: Users },
  { href: "/achievements", label: "Awards", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-text-light"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
