import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import CreateDumpContent from "./CreateDumpContent";

export default async function CreateDumpPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav email={user.email} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Create a Meme Dump</h1>
        <CreateDumpContent userId={user.id} />
      </main>
    </div>
  );
}
