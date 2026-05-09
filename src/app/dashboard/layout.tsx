"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = window.location.pathname;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
