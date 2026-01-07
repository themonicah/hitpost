"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  email: string;
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

// Fun header decorations based on page
function HeaderDecoration({ title }: { title?: string }) {
  if (title === "Activity") {
    return (
      <span className="ml-1.5 inline-flex items-center">
        <span className="animate-bounce text-sm" style={{ animationDelay: "0s" }}>👀</span>
      </span>
    );
  }
  if (title === "Dump Details") {
    return (
      <span className="ml-1.5 inline-flex items-center gap-0.5">
        <span className="text-sm">📦</span>
        <span className="text-sm">✨</span>
      </span>
    );
  }
  if (!title || title === "HitPost") {
    return (
      <span className="ml-1 inline-flex items-center">
        <span className="text-sm animate-pulse">🔥</span>
      </span>
    );
  }
  return null;
}

export default function Header({
  email,
  title,
  showBack,
  rightAction,
}: HeaderProps) {
  const displayTitle = title === "Groups" ? "Circles" : title;
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side - back button or spacer */}
          <div className="w-20 flex items-center">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-blue-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Center - title */}
          <h1 className="font-semibold text-lg flex items-center">
            {displayTitle || "HitPost"}
            <HeaderDecoration title={displayTitle || title} />
          </h1>

          {/* Right side - actions + account */}
          <div className="w-20 flex items-center justify-end gap-2">
            {rightAction}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium truncate">{email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
