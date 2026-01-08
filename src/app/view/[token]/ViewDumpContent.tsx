"use client";

import { useState } from "react";
import { Dump, Meme } from "@/lib/db";
import Slideshow from "@/components/Slideshow";

interface ViewDumpContentProps {
  dump: Dump & { sender_email: string };
  memes: Meme[];
  recipientId: string;
  recipientName: string;
  recipientNote: string | null;
  existingReactions: Record<string, string>;
}

const EMOJIS = ["😂", "❤️", "👍", "👎"];

export default function ViewDumpContent({
  dump,
  memes,
  recipientId,
  recipientName,
  recipientNote,
  existingReactions,
}: ViewDumpContentProps) {
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const [reactions, setReactions] = useState(existingReactions);
  const [note, setNote] = useState(recipientNote || "");
  const [noteSaved, setNoteSaved] = useState(!!recipientNote);
  const [saving, setSaving] = useState(false);

  async function handleReaction(memeId: string, emoji: string) {
    const currentEmoji = reactions[memeId];
    const newEmoji = currentEmoji === emoji ? null : emoji;

    // Optimistic update
    setReactions((prev) => {
      const updated = { ...prev };
      if (newEmoji) {
        updated[memeId] = newEmoji;
      } else {
        delete updated[memeId];
      }
      return updated;
    });

    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, memeId, emoji: newEmoji }),
      });
    } catch {
      // Revert on error
      setReactions((prev) => {
        const updated = { ...prev };
        if (currentEmoji) {
          updated[memeId] = currentEmoji;
        } else {
          delete updated[memeId];
        }
        return updated;
      });
    }
  }

  async function saveNote() {
    setSaving(true);
    try {
      const res = await fetch("/api/recipient-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, note: note.trim() }),
      });
      if (res.ok) {
        setNoteSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold">HitPost</h1>
          <p className="text-sm text-gray-500">
            From {dump.sender_email}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Sender note */}
        {dump.note && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-300 italic">
              "{dump.note}"
            </p>
          </div>
        )}

        {/* Meme grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
          {memes.map((meme, index) => (
            <div
              key={meme.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer active:opacity-90"
              onClick={() => setSlideshowIndex(index)}
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

              {meme.file_type === "video" && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                  Video
                </div>
              )}

              {reactions[meme.id] && (
                <div className="absolute top-2 right-2 text-2xl">
                  {reactions[meme.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Leave a note section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Leave a note</h2>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteSaved(false);
            }}
            placeholder="This was a great batch!"
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          />
          <button
            onClick={saveNote}
            disabled={saving || noteSaved || !note.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving..." : noteSaved ? "Saved!" : "Save Note"}
          </button>
        </div>
      </main>

      {/* Slideshow overlay */}
      {slideshowIndex !== null && (
        <Slideshow
          memes={memes}
          initialIndex={slideshowIndex}
          reactions={reactions}
          onReact={handleReaction}
          onClose={() => setSlideshowIndex(null)}
        />
      )}
    </div>
  );
}
