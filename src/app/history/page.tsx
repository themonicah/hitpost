import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import db from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  const rawDumps = await db.getDumpsByUser(user.id);
  const dumps = await Promise.all(
    rawDumps.map(async (dump) => {
      const stats = await db.getDumpStats(dump.id);
      return {
        ...dump,
        meme_count: stats.memeCount,
        recipient_count: stats.recipientCount,
        viewed_count: stats.viewedCount,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav email={user.email} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Sent Dumps</h1>

        {dumps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              You haven't sent any dumps yet.
            </p>
            <Link
              href="/create-dump"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Create your first dump →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dumps.map((dump) => (
              <Link
                key={dump.id}
                href={`/history/${dump.id}`}
                className="block bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {dump.meme_count} meme{dump.meme_count !== 1 ? "s" : ""}
                    </p>
                    {dump.note && (
                      <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                        "{dump.note}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {dump.viewed_count} / {dump.recipient_count} viewed
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(dump.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Dev link to see emails */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/dev/emails"
            className="text-sm text-gray-400 hover:text-gray-500"
          >
            View sent emails (dev) →
          </Link>
        </div>
      </main>
    </div>
  );
}
