"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavProps {
  email: string | null;
}

export default function Nav({ email }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/library", label: "Library" },
    { href: "/groups", label: "Groups" },
    { href: "/create-dump", label: "Create" },
    { href: "/history", label: "History" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/library" className="font-bold text-xl">
            HitPost
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-2 text-sm text-gray-500 border-t border-gray-100 dark:border-gray-800">
          <span>{email || "Guest"}</span>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
