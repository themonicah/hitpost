import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import db from "@/lib/db";
import ActivityContent from "@/components/ActivityContent";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  const [activity, dumps] = await Promise.all([
    db.getActivityFeed(user.id, 50),
    db.getDumpsByUser(user.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header email={user.email} title="Activity" />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Quick access to sent dumps */}
        {dumps.length > 0 && (
          <Link
            href="/dumps"
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Your Dumps</p>
                <p className="text-sm text-gray-500">{dumps.length} sent</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        <ActivityContent items={activity} />
      </main>

      <TabBar />
    </div>
  );
}
