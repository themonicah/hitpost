import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import db, { Reaction } from "@/lib/db";
import CopyLinkButton from "./CopyLinkButton";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface DumpDetailPageProps {
  params: Promise<{ dumpId: string }>;
}

export default async function DumpDetailPage({ params }: DumpDetailPageProps) {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  const { dumpId } = await params;
  const dump = await db.getDumpById(dumpId);

  if (!dump || dump.sender_id !== user.id) {
    notFound();
  }

  const memes = await db.getMemesByDump(dumpId);
  const recipients = await db.getRecipientsByDump(dumpId);
  const recipientIds = recipients.map((r) => r.id);

  const reactions: Reaction[] = recipientIds.length > 0
    ? await db.getReactionsByRecipients(recipientIds)
    : [];

  const recipientsWithReactions = recipients.map((r) => ({
    ...r,
    reactions: reactions.filter((rx) => rx.recipient_id === r.id),
  }));

  const viewedCount = recipients.filter((r) => r.viewed_at).length;
  const totalViews = recipients.reduce((sum, r) => sum + (r.view_count || 0), 0);

  // Get base URL from request headers
  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header email={user.email} title="Dump Details" showBack />

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Stats bar */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-4">
          <div>
            <p className="text-2xl font-bold">{viewedCount}/{recipients.length}</p>
            <p className="text-sm text-gray-500">opened</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalViews}</p>
            <p className="text-sm text-gray-500">total views</p>
          </div>
        </div>

        {/* Note */}
        {dump.note && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-4">
            <p className="text-sm text-gray-500 mb-1">Your note</p>
            <p className="text-gray-700 dark:text-gray-300">"{dump.note}"</p>
          </div>
        )}

        {/* Memes grid */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold mb-3">{memes.length} memes</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 rounded-xl overflow-hidden">
            {memes.slice(0, 12).map((meme) => (
              <div
                key={meme.id}
                className="aspect-square bg-gray-100 dark:bg-gray-800"
              >
                {meme.file_type === "video" ? (
                  <video
                    src={meme.file_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
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
            {memes.length > 12 && (
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-sm font-medium">
                +{memes.length - 12}
              </div>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold">Recipients</h2>
            <p className="text-sm text-gray-500">Share links with recipients</p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recipientsWithReactions.map((recipient) => {
              const link = `${baseUrl}/view/${recipient.token}`;
              const hasViewed = !!recipient.viewed_at;

              return (
                <div key={recipient.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${hasViewed ? "bg-green-500" : "bg-gray-300"}`} />
                      <div>
                        <p className="font-medium">{recipient.email}</p>
                        <p className="text-sm text-gray-500">
                          {hasViewed
                            ? `Viewed ${new Date(recipient.viewed_at!).toLocaleDateString()} · ${recipient.view_count} view${recipient.view_count !== 1 ? "s" : ""}`
                            : "Not opened yet"}
                        </p>
                      </div>
                    </div>
                    {recipient.reactions.length > 0 && (
                      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                        {recipient.reactions.map((r) => (
                          <span key={r.id} className="text-lg">{r.emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Link row */}
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      value={link}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-gray-500 truncate"
                    />
                    <CopyLinkButton link={link} />
                  </div>

                  {/* Recipient note */}
                  {recipient.recipient_note && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        "{recipient.recipient_note}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timestamp */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Sent {new Date(dump.created_at).toLocaleString()}
        </p>
      </main>

      <TabBar />
    </div>
  );
}
