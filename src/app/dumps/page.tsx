import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import db from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DumpsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  // Get all dumps with stats and preview memes
  const rawDumps = await db.getDumpsByUser(user.id);
  const dumps = await Promise.all(
    rawDumps.map(async (dump) => {
      const stats = await db.getDumpStats(dump.id);
      const memes = await db.getMemesByDump(dump.id);
      const recipients = await db.getRecipientsByDump(dump.id);
      return {
        ...dump,
        memeCount: stats.memeCount,
        recipientCount: stats.recipientCount,
        viewedCount: stats.viewedCount,
        previewMemes: memes.slice(0, 4),
        recipientEmails: recipients.map((r) => r.email),
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header
        email={user.email}
        title="Dumps"
        rightAction={
          <Link
            href="/dumps/create"
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-4 py-4">
        {dumps.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No dumps yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">
              Send your first meme dump to share with friends
            </p>
            <Link
              href="/dumps/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Dump
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Create new dump card */}
            <Link
              href="/dumps/create"
              className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                New Dump
              </span>
            </Link>

            {/* Dump cards */}
            {dumps.map((dump) => (
              <Link
                key={dump.id}
                href={`/dumps/${dump.id}`}
                className="aspect-square bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Preview grid */}
                <div className="h-3/4 relative">
                  {dump.previewMemes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-0.5 h-full">
                      {dump.previewMemes.map((meme, i) => (
                        <div
                          key={meme.id}
                          className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${
                            dump.previewMemes.length === 1 ? "col-span-2 row-span-2" :
                            dump.previewMemes.length === 2 ? "row-span-2" :
                            dump.previewMemes.length === 3 && i === 0 ? "row-span-2" : ""
                          }`}
                        >
                          {meme.file_type === "video" ? (
                            <video
                              src={meme.file_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={meme.file_url}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                      <span className="text-gray-400">No memes</span>
                    </div>
                  )}

                  {/* View count badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 rounded-full text-white text-xs font-medium">
                    {dump.viewedCount}/{dump.recipientCount}
                  </div>
                </div>

                {/* Info */}
                <div className="h-1/4 p-2 flex flex-col justify-center">
                  <p className="text-sm font-medium truncate">
                    {dump.memeCount} meme{dump.memeCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {dump.recipientEmails.length > 0
                      ? dump.recipientEmails.slice(0, 2).join(", ") +
                        (dump.recipientEmails.length > 2
                          ? ` +${dump.recipientEmails.length - 2}`
                          : "")
                      : "No recipients"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </div>
  );
}
