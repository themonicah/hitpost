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

  // Get drafts (collections)
  const drafts = await db.getCollectionsWithMemes(user.id);

  // Get sent dumps with stats and preview memes
  const rawDumps = await db.getDumpsByUser(user.id);
  const sentDumps = await Promise.all(
    rawDumps.map(async (dump) => {
      const stats = await db.getDumpStats(dump.id);
      const memes = await db.getMemesByDump(dump.id);
      const recipients = await db.getRecipientsByDump(dump.id);
      const reactions = recipients.length > 0
        ? await db.getReactionsByRecipients(recipients.map(r => r.id))
        : [];

      return {
        ...dump,
        memeCount: stats.memeCount,
        recipientCount: stats.recipientCount,
        viewedCount: stats.viewedCount,
        previewMemes: memes.slice(0, 6),
        reactions: reactions,
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
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Drafts Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Drafts</h2>
            {drafts.length > 0 && (
              <span className="text-xs text-gray-400">{drafts.length}</span>
            )}
          </div>

          {drafts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center">
              <p className="text-gray-500 text-sm mb-3">No drafts yet</p>
              <p className="text-gray-400 text-xs">
                Select memes from your library to start a draft
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {drafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={`/collections/${draft.id}`}
                  className="flex-shrink-0 w-32 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="aspect-square relative">
                    {draft.memes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-0.5 h-full">
                        {draft.memes.slice(0, 4).map((meme) => (
                          <div key={meme.id} className="bg-gray-100 dark:bg-gray-800">
                            {meme.file_type === "video" ? (
                              <video src={meme.file_url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs">
                        Empty
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{draft.name}</p>
                    <p className="text-xs text-gray-500">{draft.memeCount} memes</p>
                  </div>
                </Link>
              ))}

              {/* New draft button */}
              <Link
                href="/?select=true"
                className="flex-shrink-0 w-32 aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">New Draft</span>
              </Link>
            </div>
          )}
        </section>

        {/* Sent Feed Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sent</h2>

          {sentDumps.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No dumps sent yet
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Create a draft, add memes, then send it to friends
              </p>
              <Link
                href="/dumps/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium"
              >
                Send your first dump
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sentDumps.map((dump) => {
                const viewPercent = dump.recipientCount > 0
                  ? (dump.viewedCount / dump.recipientCount) * 100
                  : 0;
                const uniqueEmojis = [...new Set(dump.reactions.map(r => r.emoji))];

                return (
                  <Link
                    key={dump.id}
                    href={`/dumps/${dump.id}`}
                    className="block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Date header */}
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-xs text-gray-500">
                        {new Date(dump.created_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Meme preview strip */}
                    <div className="flex gap-0.5 px-4 overflow-hidden">
                      {dump.previewMemes.map((meme) => (
                        <div
                          key={meme.id}
                          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                        >
                          {meme.file_type === "video" ? (
                            <video src={meme.file_url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      {dump.memeCount > 6 && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                          +{dump.memeCount - 6}
                        </div>
                      )}
                    </div>

                    {/* Stats footer */}
                    <div className="px-4 py-3">
                      {/* View progress */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {dump.viewedCount} of {dump.recipientCount} opened
                        </span>
                        {uniqueEmojis.length > 0 && (
                          <div className="flex gap-0.5">
                            {uniqueEmojis.slice(0, 5).map((emoji, i) => (
                              <span key={i} className="text-lg">{emoji}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            viewPercent === 100
                              ? 'bg-green-500'
                              : viewPercent > 0
                              ? 'bg-blue-500'
                              : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                          style={{ width: `${viewPercent}%` }}
                        />
                      </div>

                      {/* Note preview if exists */}
                      {dump.note && (
                        <p className="text-sm text-gray-500 mt-2 truncate">
                          "{dump.note}"
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <TabBar />
    </div>
  );
}
