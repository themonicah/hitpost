import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import db, { Reaction } from "@/lib/db";
import Link from "next/link";
import CopyLinkButton from "./CopyLinkButton";

interface DumpDetailPageProps {
  params: Promise<{ dumpId: string }>;
}

export default async function DumpDetailPage({ params }: DumpDetailPageProps) {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  const { dumpId } = await params;

  // Get dump
  const dump = db.getDumpById(dumpId);

  if (!dump || dump.sender_id !== user.id) {
    notFound();
  }

  // Get memes
  const memes = db.getMemesByDump(dumpId);

  // Get recipients
  const recipients = db.getRecipientsByDump(dumpId);
  const recipientIds = recipients.map((r) => r.id);

  // Get reactions
  const reactions: Reaction[] = recipientIds.length > 0
    ? db.getReactionsByRecipients(recipientIds)
    : [];

  // Group reactions by recipient
  const recipientsWithReactions = recipients.map((r) => ({
    ...r,
    reactions: reactions.filter((rx) => rx.recipient_id === r.id),
  }));

  const viewedCount = recipients.filter((r) => r.viewed_at).length;
  const totalViews = recipients.reduce((sum, r) => sum + (r.view_count || 0), 0);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav email={user.email} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/history"
          className="text-blue-500 hover:text-blue-600 text-sm mb-4 inline-block"
        >
          ← Back to History
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dump Details</h1>
            <p className="text-gray-500">
              Sent {new Date(dump.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">
              {viewedCount} / {recipients.length} opened
            </p>
            <p className="text-sm text-gray-500">
              {totalViews} total view{totalViews !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Sender note */}
        {dump.note && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Your note:</p>
            <p className="text-gray-700 dark:text-gray-300">"{dump.note}"</p>
          </div>
        )}

        {/* Memes preview */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 shadow-sm">
          <h2 className="font-semibold mb-3">{memes.length} memes in this dump</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {memes.slice(0, 12).map((meme) => (
              <div
                key={meme.id}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
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
              <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                +{memes.length - 12} more
              </div>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-4">Recipients & Links</h2>
          <p className="text-sm text-gray-500 mb-4">
            Copy these links to manually share with recipients
          </p>
          <div className="space-y-4">
            {recipientsWithReactions.map((recipient) => {
              const link = `${baseUrl}/view/${recipient.token}`;
              return (
                <div
                  key={recipient.id}
                  className="border border-gray-100 dark:border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{recipient.email}</p>
                      <p className="text-sm text-gray-500">
                        {recipient.viewed_at
                          ? `Opened ${new Date(recipient.viewed_at).toLocaleString()} • ${recipient.view_count || 0} view${(recipient.view_count || 0) !== 1 ? "s" : ""}`
                          : "Not yet opened"}
                      </p>
                    </div>
                    {recipient.reactions.length > 0 && (
                      <div className="flex gap-1">
                        {recipient.reactions.map((r) => (
                          <span key={r.id} className="text-xl">
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Copyable link */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={link}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-gray-600 dark:text-gray-400"
                    />
                    <CopyLinkButton link={link} />
                  </div>

                  {recipient.recipient_note && (
                    <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-500 mb-1">Their note:</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        "{recipient.recipient_note}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
