import { getSession } from "@/lib/auth";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import AutoLogin from "@/components/AutoLogin";
import LoggedInHome from "./LoggedInHome";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSession();

  // Auto-login with device ID if not authenticated
  if (!user) {
    return (
      <AppShell>
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sunny/10 via-white to-white">
          <div className="w-full max-w-sm space-y-6">
            {/* Welcome illustration */}
            <div className="flex justify-center animate-float">
              <Image
                src="/illustrations/onboarding-welcome.svg"
                alt="Welcome to HitPost"
                width={280}
                height={200}
                priority
              />
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-sunny-dark via-peachy to-coral bg-clip-text text-transparent">
                HitPost
              </h1>
              <p className="text-gray-600 text-lg">
                Save memes. Send dumps. Make friends laugh.
              </p>
            </div>

            <AutoLogin />

            {/* Fun footer */}
            <p className="text-center text-xs text-gray-400">
              no cap, it&apos;s that easy
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  // Show meme library when logged in
  return (
    <AppShell>
      <LoggedInHome userId={user.id} userEmail={user.email} />
    </AppShell>
  );
}
