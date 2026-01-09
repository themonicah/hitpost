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

type ViewState = "cover" | "viewing" | "ending";

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
  const [viewState, setViewState] = useState<ViewState>("cover");
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [reactions, setReactions] = useState(existingReactions);
  const [note, setNote] = useState(recipientNote || "");
  const [noteSaved, setNoteSaved] = useState(!!recipientNote);
  const [saving, setSaving] = useState(false);
  const [viewedMemes, setViewedMemes] = useState<Set<string>>(new Set());

  const senderName = dump.sender_email.split("@")[0];
  const currentMeme = memes[lightboxIndex];
  const isLastMeme = lightboxIndex === memes.length - 1;
  const allViewed = viewedMemes.size === memes.length;

  // Mark current meme as viewed
  useEffect(() => {
    if (viewState === "viewing" && currentMeme) {
      setViewedMemes(prev => new Set([...prev, currentMeme.id]));
    }
  }, [viewState, currentMeme]);

  // Keyboard navigation
  useEffect(() => {
    if (viewState !== "viewing") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (allViewed) {
          setViewState("ending");
        }
      } else if (e.key === "ArrowRight") {
        if (lightboxIndex < memes.length - 1) {
          setLightboxIndex(lightboxIndex + 1);
        } else if (allViewed) {
          setViewState("ending");
        }
      } else if (e.key === "ArrowLeft" && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewState, lightboxIndex, memes.length, allViewed]);

  // Lock body scroll when in lightbox
  useEffect(() => {
    if (viewState === "viewing") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [viewState]);

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

  // Swipe handling
  let touchStartX = 0;
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        // Swipe left - next
        if (lightboxIndex < memes.length - 1) {
          setLightboxIndex(lightboxIndex + 1);
        } else if (allViewed) {
          setViewState("ending");
        }
      } else if (deltaX > 0 && lightboxIndex > 0) {
        // Swipe right - prev
        setLightboxIndex(lightboxIndex - 1);
      }
    }
  }

  // ==================== COVER SHEET ====================
  if (viewState === "cover") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-center p-6">
        {/* Meme stack preview */}
        <div className="relative w-48 h-48 mb-8">
          {memes.slice(0, 3).map((meme, i) => (
            <div
              key={meme.id}
              className="absolute w-36 h-36 bg-white p-1 rounded-2xl shadow-2xl"
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
            </div>
          ))}
        </div>

        {/* Sender info */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-white/60 text-sm mb-2">
            {senderName} sent you a meme dump
          </p>
          <h1 className="text-white text-2xl font-bold mb-1">
            {dump.note || "Meme Dump"}
          </h1>
          <p className="text-white/40 text-sm">
            {memes.length} meme{memes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Open button */}
        <button
          onClick={() => setViewState("viewing")}
          className="w-full max-w-xs py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
        >
          Open Dump 💩
        </button>

        {/* Subtle branding */}
        <p className="text-white/20 text-xs mt-8">
          via HitPost
        </p>
      </div>
    );
  }

  // ==================== ENDING PAGE ====================
  if (viewState === "ending") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-center p-6">
        {/* Celebration */}
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-white text-2xl font-bold mb-2">That&apos;s all!</h1>
        <p className="text-white/60 text-sm mb-8">
          You&apos;ve seen all {memes.length} meme{memes.length !== 1 ? "s" : ""}
        </p>

        {/* Reaction summary */}
        {Object.keys(reactions).length > 0 && (
          <div className="flex gap-2 mb-8">
            {Object.values(reactions).map((emoji, i) => (
              <span key={i} className="text-2xl">{emoji}</span>
            ))}
          </div>
        )}

        {/* Note section */}
        <div className="w-full max-w-sm bg-white/10 rounded-2xl p-4 mb-6">
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
          <div className="w-full max-w-sm bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6">
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

        {/* View again */}
        <button
          onClick={() => { setLightboxIndex(0); setViewState("viewing"); }}
          className="text-white/40 text-sm underline"
        >
          View again
        </button>
      </div>
    );
  }

  // ==================== LIGHTBOX (VIEWING) ====================
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button
          onClick={() => allViewed ? setViewState("ending") : setViewState("cover")}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
        >
          ×
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
              className="w-full max-h-[60vh] object-contain rounded-2xl"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              key={currentMeme.id}
              src={currentMeme.file_url}
              alt={`Meme ${lightboxIndex + 1}`}
              className="w-full max-h-[60vh] object-contain rounded-2xl"
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

      {/* Navigation / Film strip */}
      <div className="px-4 pb-8 pb-safe">
        {/* Next button when on last meme */}
        {isLastMeme && allViewed ? (
          <button
            onClick={() => setViewState("ending")}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-xl mb-4"
          >
            Done →
          </button>
        ) : (
          <button
            onClick={() => setLightboxIndex(Math.min(lightboxIndex + 1, memes.length - 1))}
            className="w-full py-3 bg-white/20 text-white font-semibold rounded-xl mb-4"
            disabled={isLastMeme}
          >
            {isLastMeme ? "Last one!" : "Next →"}
          </button>
        )}

        {/* Film strip */}
        <div className="flex gap-2 overflow-x-auto py-2 justify-center">
          {memes.map((meme, index) => (
            <button
              key={meme.id}
              onClick={() => setLightboxIndex(index)}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all ${
                index === lightboxIndex
                  ? "ring-2 ring-amber-500 scale-105"
                  : viewedMemes.has(meme.id)
                  ? "opacity-70"
                  : "opacity-40"
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
  );
}
