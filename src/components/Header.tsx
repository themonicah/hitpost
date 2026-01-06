"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  email: string;
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({
  email,
  title,
  showBack,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
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
            <h1 className="font-bold text-xl">{title || "HitPost"}</h1>
          </div>

          <div className="flex items-center gap-3">
            {rightAction}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:block">{email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
