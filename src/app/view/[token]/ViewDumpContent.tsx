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
  recipientNote,
  existingReactions,
  claimCode,
  isClaimed,
}: ViewDumpContentProps) {
  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Reactions and note state
  const [reactions, setReactions] = useState(existingReactions);
  const [note, setNote] = useState(recipientNote || "");
  const [noteSaved, setNoteSaved] = useState(!!recipientNote);
  const [saving, setSaving] = useState(false);

  const senderName = dump.sender_email.split("@")[0];
  const currentMeme = memes[lightboxIndex];

  // Record view on first render
  useEffect(() => {
    fetch("/api/recipient-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, recordView: true }),
    }).catch(() => {});
  }, [recipientId]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!showLightbox) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowLightbox(false);
      } else if (e.key === "ArrowRight" && lightboxIndex < memes.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      } else if (e.key === "ArrowLeft" && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, lightboxIndex, memes.length]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showLightbox]);

  async function handleReaction(memeId: string, emoji: string) {
    const currentEmoji = reactions[memeId];
    const newEmoji = currentEmoji === emoji ? null : emoji;

    setReactions(prev => {
      const updated = { ...prev };
      if (newEmoji) updated[memeId] = newEmoji;
      else delete updated[memeId];
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
      setReactions(prev => {
        const updated = { ...prev };
        if (currentEmoji) updated[memeId] = currentEmoji;
        else delete updated[memeId];
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
      if (res.ok) setNoteSaved(true);
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
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0 && lightboxIndex < memes.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      } else if (deltaX > 0 && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
  }

  function openMeme(index: number) {
    setLightboxIndex(index);
    setShowLightbox(true);
  }

  // ==================== BASE PAGE ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black">
      {/* Scrollable content */}
      <div className="max-w-lg mx-auto px-4 py-8 pb-safe">

        {/* Header - Splayed meme preview */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="relative w-48 h-48 mb-6">
            {memes.slice(0, 3).map((meme, i) => (
              <button
                key={meme.id}
                onClick={() => openMeme(i)}
                className="absolute w-36 h-36 bg-white p-1 rounded-2xl shadow-2xl hover:scale-105 transition-transform"
                style={{
                  transform: `rotate(${(i - 1) * 8}deg) translateY(${i * 4}px)`,
                  left: `${24 + i * 8}px`,
                  top: `${i * 8}px`,
                  zIndex: 3 - i,
                }}
              >
                {meme.file_type === "video" ? (
                  <video src={meme.file_url} className="w-full h-full object-cover rounded-xl" muted playsInline />
                ) : (
                  <img src={meme.file_url} alt="" className="w-full h-full object-cover rounded-xl" />
                )}
              </button>
            ))}
          </div>

          {/* Sender info */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3">
            <span className="text-xl font-bold text-white">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-white/60 text-sm mb-1">
            {senderName} sent you a meme dump
          </p>
          <h1 className="text-white text-2xl font-bold mb-1">
            {dump.note || "Meme Dump"}
          </h1>
          <p className="text-white/40 text-sm">
            {memes.length} meme{memes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Film strip - tap any to view */}
        <div className="mb-8">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3 text-center">
            Tap to view
          </p>
          <div className="flex gap-2 overflow-x-auto py-2 px-2 justify-center flex-wrap">
            {memes.map((meme, index) => (
              <button
                key={meme.id}
                onClick={() => openMeme(index)}
                className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white/10 hover:ring-2 hover:ring-amber-500 transition-all"
              >
                {meme.file_type === "video" ? (
                  <video src={meme.file_url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                )}
                {/* Reaction badge */}
                {reactions[meme.id] && (
                  <div className="absolute bottom-0.5 right-0.5 text-sm">
                    {reactions[meme.id]}
                  </div>
                )}
                {/* Video indicator */}
                {meme.file_type === "video" && (
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note section */}
        <div className="bg-white/10 rounded-2xl p-4 mb-4">
          <label className="text-white/80 text-sm font-medium mb-2 block">
            Send {senderName} a note
          </label>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }}
            placeholder="These were amazing! Send more..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-3"
          />
          <button
            onClick={saveNote}
            disabled={saving || noteSaved || !note.trim()}
            className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl disabled:bg-white/20 disabled:text-white/40 transition-colors"
          >
            {saving ? "Sending..." : noteSaved ? "Sent! ✓" : "Send Note"}
          </button>
        </div>

        {/* App upsell */}
        {!isClaimed && claimCode && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📬</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">
                  Get HitPost
                </p>
                <p className="text-white/60 text-sm mb-3">
                  {senderName} has to send you links manually right now. Get the app so they can send dumps directly!
                </p>
                <div className="bg-black/30 rounded-lg px-3 py-2 mb-3">
                  <p className="text-white/40 text-xs mb-1">Your connect code</p>
                  <p className="text-white font-mono text-lg tracking-wider">{claimCode}</p>
                </div>
                <a
                  href="https://apps.apple.com/app/hitpost"
                  className="block w-full py-3 bg-white text-gray-900 font-semibold text-center rounded-xl"
                >
                  Get HitPost
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Branding */}
        <p className="text-white/20 text-xs text-center">
          via HitPost
        </p>
      </div>

      {/* ==================== LIGHTBOX TRAY ==================== */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowLightbox(false)}
          />

          {/* Tray */}
          <div
            className="absolute inset-x-0 bottom-0 top-0 flex flex-col animate-tray-up"
            style={{ animationDuration: "0.3s" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-14 pb-4">
              <button
                onClick={() => setShowLightbox(false)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-white/60 text-sm">
                {lightboxIndex + 1} / {memes.length}
              </div>
              <div className="w-10" />
            </div>

            {/* Main meme */}
            <div
              className="flex-1 flex items-center justify-center px-4 min-h-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-full max-w-lg">
                {currentMeme.file_type === "video" ? (
                  <video
                    key={currentMeme.id}
                    src={currentMeme.file_url}
                    className="w-full max-h-[55vh] object-contain rounded-2xl"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    key={currentMeme.id}
                    src={currentMeme.file_url}
                    alt={`Meme ${lightboxIndex + 1}`}
                    className="w-full max-h-[55vh] object-contain rounded-2xl"
                  />
                )}
              </div>
            </div>

            {/* Reactions */}
            <div className="px-4 py-3">
              <div className="flex justify-center gap-3">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(currentMeme.id, emoji)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                      reactions[currentMeme.id] === emoji
                        ? "bg-amber-500 scale-110 shadow-lg"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Film strip navigation */}
            <div className="px-4 pb-8 pb-safe">
              <div className="flex gap-2 overflow-x-auto py-2 justify-center">
                {memes.map((meme, index) => (
                  <button
                    key={meme.id}
                    onClick={() => setLightboxIndex(index)}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                      index === lightboxIndex
                        ? "ring-2 ring-amber-500 scale-105"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {meme.file_type === "video" ? (
                      <video src={meme.file_url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {reactions[meme.id] && (
                      <div className="absolute bottom-0 right-0 text-xs bg-black/60 rounded-tl px-1">
                        {reactions[meme.id]}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
