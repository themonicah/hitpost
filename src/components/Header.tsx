"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  email: string | null;
  userId?: string;
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onShowQRCode?: () => void;
  onNewDump?: () => void;
}

export default function Header({
  email,
  userId,
  title,
  showBack,
  rightAction,
  onShowQRCode,
  onNewDump,
}: HeaderProps) {
  const displayTitle = title === "Groups" ? "Circles" : title;
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const isActivityPage = pathname === "/activity";
  const isHomePage = pathname === "/";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-[#faf8f5]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side - notification + profile (on home) or back button */}
          <div className="flex items-center gap-1">
            {showBack ? (
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="w-10 h-10 -ml-2 text-gray-600 hover:text-gray-800 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <>
                {/* Activity button */}
                <Link
                  href={isActivityPage ? "/" : "/activity"}
                  aria-label={isActivityPage ? "Go to home" : "View activity"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isActivityPage
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-5 h-5" fill={isActivityPage ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActivityPage ? 0 : 1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    aria-label="Account menu"
                    aria-expanded={showMenu}
                    aria-haspopup="menu"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                        aria-hidden="true"
                      />
                      <div
                        role="menu"
                        aria-label="Account options"
                        className="absolute left-0 top-11 z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-scaleIn"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium truncate">{email || "Guest"}</p>
                          {!email && (
                            <p className="text-xs text-gray-400 mt-0.5">Add email to backup</p>
                          )}
                        </div>
                        {onShowQRCode && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onShowQRCode();
                            }}
                            role="menuitem"
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 min-h-[44px] flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            My QR Code
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-gray-50 min-h-[44px]"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Center - title (only show on non-home pages) */}
          {!isHomePage && (
            <h1 className="font-semibold text-lg">
              {displayTitle || "HitPost"}
            </h1>
          )}
          {isHomePage && <div />}

          {/* Right side - + Dump button (on home) or custom action */}
          <div className="flex items-center">
            {rightAction}

            {isHomePage && onNewDump && (
              <button
                onClick={onNewDump}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Dump</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
