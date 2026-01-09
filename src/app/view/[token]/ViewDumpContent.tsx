"use client";

import { useState, useEffect } from "react";
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
  const [showIntro, setShowIntro] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reactions, setReactions] = useState(existingReactions);
  const [note, setNote] = useState(recipientNote || "");
  const [noteSaved, setNoteSaved] = useState(!!recipientNote);
  const [saving, setSaving] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const senderName = dump.sender_email.split("@")[0];
  const currentMeme = lightboxIndex !== null ? memes[lightboxIndex] : null;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const currentIdx = lightboxIndex;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight" && currentIdx < memes.length - 1) {
        setLightboxIndex(currentIdx + 1);
      } else if (e.key === "ArrowLeft" && currentIdx > 0) {
        setLightboxIndex(currentIdx - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, memes.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

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

  // Swipe handling for lightbox
  let touchStartX = 0;
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (lightboxIndex === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0 && lightboxIndex < memes.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      } else if (deltaX > 0 && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
  }

  // Connect Modal
  function ConnectModal() {
    if (!showConnectModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowConnectModal(false)}
        />
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sunny to-peachy flex items-center justify-center">
              <span className="text-4xl">📬</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Stay connected with {senderName}
            </h2>
            <p className="text-gray-500 text-sm">
              Get the app so you never miss their meme drops.
            </p>
          </div>

          {claimCode && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 text-center mb-2">Your connection code</p>
              <p className="text-2xl font-mono font-bold text-center tracking-widest text-gray-900">
                {claimCode}
              </p>
            </div>
          )}

          <a
            href="https://apps.apple.com/app/hitpost"
            className="block w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-center rounded-2xl transition-colors mb-3"
          >
            Get HitPost
          </a>

          <button
            onClick={() => setShowConnectModal(false)}
            className="w-full py-3 text-gray-400 font-medium text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // Lightbox component
  function Lightbox() {
    if (lightboxIndex === null || !currentMeme) return null;

    return (
      <div
        className="fixed inset-0 z-40 flex flex-col"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-14 pb-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition-all active:scale-95"
          >
            ×
          </button>
          <div className="w-10" />
        </div>

        {/* Main image */}
        <div
          className="flex-1 flex items-center justify-center px-4 min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full max-w-lg max-h-full">
            {currentMeme.file_type === "video" ? (
              <video
                src={currentMeme.file_url}
                className="w-full max-h-[50vh] object-contain rounded-2xl"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={currentMeme.file_url}
                alt={`Meme ${lightboxIndex + 1}`}
                className="w-full max-h-[50vh] object-contain rounded-2xl"
              />
            )}
          </div>
        </div>

        {/* Reaction bar */}
        <div className="px-4 py-3">
          <div className="flex justify-center gap-3">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(currentMeme.id, emoji)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                  reactions[currentMeme.id] === emoji
                    ? "bg-sunny scale-110 shadow-md"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Film strip */}
        <div className="px-4 pb-8 pb-safe">
          <div className="flex gap-2 overflow-x-auto py-2 justify-center">
            {memes.map((meme, index) => (
              <button
                key={meme.id}
                onClick={() => setLightboxIndex(index)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                  index === lightboxIndex
                    ? "ring-2 ring-white scale-105"
                    : "opacity-50 hover:opacity-75"
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
                  />
                )}
                {reactions[meme.id] && (
                  <div className="absolute bottom-0 right-0 text-xs">
                    {reactions[meme.id]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MAIN VIEW - Grid with everything accessible
  return (
    <div className="min-h-screen bg-white">
      <ConnectModal />
      <Lightbox />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-4 pt-14 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric to-lavender flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">{dump.note || "Meme Dump"}</h1>
            <p className="text-gray-500 text-sm">from {senderName}</p>
          </div>
        </div>
      </div>

      {/* Meme Grid */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {memes.map((meme, index) => (
          <button
            key={meme.id}
            onClick={() => setLightboxIndex(index)}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200 transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
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
              />
            )}
            {reactions[meme.id] && (
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-lg">
                {reactions[meme.id]}
              </div>
            )}
            {meme.file_type === "video" && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Note section */}
      <div className="p-4">
        <div className="bg-gray-50 rounded-2xl p-4">
          <label htmlFor="recipient-note" className="font-semibold text-gray-900 mb-3 block">
            Send {senderName} a note
          </label>
          <textarea
            id="recipient-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteSaved(false);
            }}
            placeholder="These are amazing! Send more..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none mb-3"
          />
          <button
            onClick={saveNote}
            disabled={saving || noteSaved || !note.trim()}
            className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl disabled:bg-gray-200 disabled:text-gray-400 min-h-[48px] transition-colors"
          >
            {saving ? "Sending..." : noteSaved ? "Sent!" : "Send Note"}
          </button>
        </div>
      </div>

      {/* Connect prompt */}
      {!isClaimed && claimCode && (
        <div className="p-4 pb-safe">
          <button
            onClick={() => setShowConnectModal(true)}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sunny to-peachy flex items-center justify-center">
                <span className="text-lg">📬</span>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Never miss {senderName}&apos;s drops</p>
                <p className="text-gray-400 text-sm">Get the app to stay connected</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
