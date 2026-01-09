"use client";

import { useState } from "react";
import { Dump, Meme } from "@/lib/db";

interface ViewDumpContentProps {
  dump: Dump & { sender_email: string };
  memes: Meme[];
  recipientId: string;
  recipientName: string;
  recipientNote: string | null;
  existingReactions: Record<string, string>;
  claimCode?: string | null;
  isClaimed?: boolean;
}

type ViewState = "cover" | "slideshow" | "grid";

const EMOJIS = ["😂", "❤️", "🔥", "💀"];

export default function ViewDumpContent({
  dump,
  memes,
  recipientId,
  recipientName,
  recipientNote,
  existingReactions,
  claimCode,
  isClaimed,
}: ViewDumpContentProps) {
  const [view, setView] = useState<ViewState>("cover");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reactions, setReactions] = useState(existingReactions);
  const [note, setNote] = useState(recipientNote || "");
  const [noteSaved, setNoteSaved] = useState(!!recipientNote);
  const [saving, setSaving] = useState(false);

  const senderName = dump.sender_email.split("@")[0];
  const currentMeme = memes[currentIndex];

  async function handleReaction(memeId: string, emoji: string) {
    const currentEmoji = reactions[memeId];
    const newEmoji = currentEmoji === emoji ? null : emoji;

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

  // COVER SHEET VIEW
  if (view === "cover") {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Background blur effect */}
        <div className="absolute inset-0 overflow-hidden">
          {memes[0] && (
            <img
              src={memes[0].file_url}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
            />
          )}
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6">
          {/* Preview thumbnails */}
          <div className="flex gap-2 mb-8">
            {memes.slice(0, 3).map((meme, i) => (
              <div
                key={meme.id}
                className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 shadow-lg"
                style={{ transform: `rotate(${(i - 1) * 5}deg)` }}
              >
                {meme.file_type === "video" ? (
                  <video src={meme.file_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>

          {/* Info */}
          <p className="text-white/60 text-sm mb-2">
            {senderName} sent you
          </p>
          <h1 className="text-white text-3xl font-bold text-center mb-2">
            {dump.note || "a meme dump"}
          </h1>
          <p className="text-white/40 text-lg mb-8">
            {memes.length} meme{memes.length !== 1 ? "s" : ""}
          </p>

          {/* CTA */}
          <button
            onClick={() => setView("slideshow")}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            See Memes
          </button>
        </div>

        {/* App upsell */}
        {!isClaimed && claimCode && (
          <div className="relative px-6 pb-8 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-white/60 text-sm mb-2">
                Get HitPost to save memes & send your own dumps
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-white/40 text-sm">Your code:</span>
                <span className="text-white font-mono text-xl font-bold tracking-wider">
                  {claimCode}
                </span>
              </div>
              <a
                href="https://apps.apple.com/app/hitpost"
                className="inline-block mt-3 text-blue-400 text-sm font-medium"
              >
                Download on App Store
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SLIDESHOW VIEW
  if (view === "slideshow") {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-14 pb-4">
          <button
            onClick={() => setView("grid")}
            className="text-white/70 text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </button>
          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {memes.length}
          </span>
          <div className="w-12" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center">
          {currentMeme && (
            <div className="w-full h-full flex items-center justify-center p-4">
              {currentMeme.file_type === "video" ? (
                <video
                  src={currentMeme.file_url}
                  className="max-w-full max-h-[70vh] rounded-xl"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={currentMeme.file_url}
                  alt=""
                  className="max-w-full max-h-[70vh] rounded-xl object-contain"
                />
              )}
            </div>
          )}
        </div>

        {/* Reaction bar */}
        <div className="px-4 pb-4">
          <div className="flex justify-center gap-4 mb-4">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(currentMeme.id, emoji)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                  reactions[currentMeme.id] === emoji
                    ? "bg-white/30 scale-110"
                    : "bg-white/10"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-8 flex gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-3 bg-white/10 text-white font-medium rounded-xl disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (currentIndex < memes.length - 1) {
                setCurrentIndex((i) => i + 1);
              } else {
                setView("grid");
              }
            }}
            className="flex-1 py-3 bg-white/20 text-white font-medium rounded-xl"
          >
            {currentIndex < memes.length - 1 ? "Next" : "See All"}
          </button>
        </div>

        {/* App upsell banner */}
        {!isClaimed && claimCode && (
          <div className="px-4 pb-6">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Save to HitPost</p>
                <p className="text-white/50 text-xs">Code: <span className="font-mono font-bold">{claimCode}</span></p>
              </div>
              <a
                href="https://apps.apple.com/app/hitpost"
                className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg"
              >
                Get App
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // GRID VIEW
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-sm px-4 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">{dump.note || "Meme Dump"}</h1>
            <p className="text-white/50 text-sm">from {senderName}</p>
          </div>
          <span className="text-white/40 text-sm">{memes.length} memes</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {memes.map((meme, index) => (
          <button
            key={meme.id}
            onClick={() => {
              setCurrentIndex(index);
              setView("slideshow");
            }}
            className="aspect-square relative bg-white/5"
          >
            {meme.file_type === "video" ? (
              <video src={meme.file_url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
            )}
            {reactions[meme.id] && (
              <div className="absolute bottom-1 right-1 text-lg">
                {reactions[meme.id]}
              </div>
            )}
            {meme.file_type === "video" && (
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Leave a note section */}
      <div className="p-4 mt-4">
        <div className="bg-white/5 rounded-2xl p-4">
          <h2 className="text-white font-semibold mb-3">Leave a note for {senderName}</h2>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteSaved(false);
            }}
            placeholder="These are fire! Send more..."
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 resize-none mb-3"
          />
          <button
            onClick={saveNote}
            disabled={saving || noteSaved || !note.trim()}
            className="w-full py-3 bg-white text-black font-bold rounded-xl disabled:opacity-30"
          >
            {saving ? "Saving..." : noteSaved ? "Saved!" : "Send Note"}
          </button>
        </div>
      </div>

      {/* App upsell - sticky at bottom */}
      {!isClaimed && claimCode && (
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-black via-black to-transparent pt-8">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-black font-bold">Get HitPost</p>
                <p className="text-black/70 text-sm">Send your own meme dumps</p>
              </div>
              <a
                href="https://apps.apple.com/app/hitpost"
                className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg"
              >
                Download
              </a>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-black/10">
              <span className="text-black/60 text-sm">Enter this code after download:</span>
              <span className="text-black font-mono text-lg font-bold">{claimCode}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
