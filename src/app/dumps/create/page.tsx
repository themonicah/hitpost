import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import CreateDumpContent from "./CreateDumpContent";

export default async function CreateDumpPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header email={user.email} title="New Dump" showBack />
      <main className="max-w-4xl mx-auto px-4 py-4">
        <CreateDumpContent userId={user.id} />
      </main>
      <TabBar />
    </div>
  );
}
