import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";
import HomeContent from "./HomeContent";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSession();

  // Show login page if not authenticated
  if (!user) {
    return (
      <AppShell>
        <main className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">HitPost</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Save memes. Send dumps. Make friends laugh.
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-sm text-gray-400">
              No password needed - just your email
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  // Show meme library when logged in
  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header email={user.email} title="Memes" />
        <main className="max-w-4xl mx-auto px-4 py-4">
          <HomeContent userId={user.id} />
        </main>
      </div>
    </AppShell>
  );
}
