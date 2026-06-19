"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    api.auth.profile()
      .then((user) => {
        if (user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        router.push("/auth/login");
      });
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
