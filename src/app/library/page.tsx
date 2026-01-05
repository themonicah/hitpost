import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import LibraryContent from "./LibraryContent";

export default async function LibraryPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav email={user.email} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Your Meme Library</h1>
        <LibraryContent userId={user.id} />
      </main>
    </div>
  );
}
