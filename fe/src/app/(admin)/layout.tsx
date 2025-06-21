"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function ActivityDiaryLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showBlur, setShowBlur] = useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.replace("/signin");
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/profiles`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        if (!res.ok) throw new Error();
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) {
          router.replace("/profile/edit");
          return;
        }
      } catch {
        Cookies.remove("token");
        router.replace("/signin");
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);
  

  useEffect(() => {
    const handleToggleBlur = (e: CustomEvent) => {
      setShowBlur(e.detail);
      if (e.detail) {
        document.body.classList.add("overflow-hidden", "backdrop-blur-sm");
      } else {
        document.body.classList.remove("overflow-hidden", "backdrop-blur-sm");
      }
    };
    window.addEventListener("toggle-blur", handleToggleBlur as EventListener);
    return () => window.removeEventListener("toggle-blur", handleToggleBlur as EventListener);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen xl:flex relative">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className="relative z-10 p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
      {showBlur && (
        <div className="fixed inset-0 z-[999] backdrop-blur-sm bg-black/30 transition-all duration-300 pointer-events-none"></div>
      )}
    </div>
  );
}
