import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function Home() {
  const user = await getSession();

  if (user) {
    redirect("/library");
  }

  return (
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
  );
}
