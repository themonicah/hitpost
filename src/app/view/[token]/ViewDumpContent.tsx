"use client";

import { useState, useEffect } from "react";
import { Dump, Meme } from "@/lib/db";
import Image from "next/image";

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
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);

  const senderName = dump.sender_email.split("@")[0];
  const currentMeme = memes[currentIndex];

  // Show connect modal after viewing all memes (first time only)
  useEffect(() => {
    if (view === "grid" && !hasSeenModal && !isClaimed && claimCode) {
      const timer = setTimeout(() => {
        setShowConnectModal(true);
        setHasSeenModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [view, hasSeenModal, isClaimed, claimCode]);

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

  // Connect Modal - focused on connecting with sender
  function ConnectModal() {
    if (!showConnectModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowConnectModal(false)}
        />
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn">
          {/* Illustration */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sunny to-peachy flex items-center justify-center">
              <span className="text-4xl">📬</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Stay connected with {senderName}
            </h2>
            <p className="text-gray-500 text-sm">
              Get the app so you never miss their meme drops. {senderName} can send you dumps directly.
            </p>
          </div>

          {/* Code display */}
          {claimCode && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 text-center mb-2">Your connection code</p>
              <p className="text-2xl font-mono font-bold text-center tracking-widest text-gray-900">
                {claimCode}
              </p>
            </div>
          )}

          {/* CTA */}
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

  // COVER SHEET VIEW - Clean white
  if (view === "cover") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ConnectModal />

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Sender avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric to-lavender flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Sender info */}
          <p className="text-gray-500 text-sm mb-1">
            {senderName} sent you
          </p>
          <h1 className="text-gray-900 text-2xl font-bold text-center mb-6">
            {dump.note || "a meme dump"}
          </h1>

          {/* Preview thumbnails */}
          <div className="flex gap-2 mb-12">
            {memes.slice(0, 3).map((meme, i) => (
              <div
                key={meme.id}
                className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-xl active:scale-105 active:-translate-y-1 cursor-pointer"
                style={{
                  transform: `rotate(${(i - 1) * 4}deg)`,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                {meme.file_type === "video" ? (
                  <video src={meme.file_url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setView("slideshow")}
            className="w-full max-w-xs py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            View Memes
          </button>
        </div>
      </div>
    );
  }

  // SLIDESHOW VIEW - Clean white
  if (view === "slideshow") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ConnectModal />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-14 pb-4">
          <button
            onClick={() => setView("grid")}
            className="text-gray-500 text-sm font-medium flex items-center gap-1 min-h-[44px] px-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            All
          </button>
          <span className="text-gray-400 text-sm font-medium">
            {currentIndex + 1} / {memes.length}
          </span>
          <div className="w-12" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4">
          {currentMeme && (
            <div className="w-full max-w-lg">
              {currentMeme.file_type === "video" ? (
                <video
                  src={currentMeme.file_url}
                  className="w-full rounded-2xl shadow-lg"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={currentMeme.file_url}
                  alt={`Meme ${currentIndex + 1}`}
                  className="w-full rounded-2xl shadow-lg object-contain"
                />
              )}
            </div>
          )}
        </div>

        {/* Reaction bar */}
        <div className="px-4 py-4">
          <div className="flex justify-center gap-3 mb-4">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(currentMeme.id, emoji)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                  reactions[currentMeme.id] === emoji
                    ? "bg-sunny scale-110 shadow-md"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-8 pb-safe flex gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl disabled:opacity-30 min-h-[48px]"
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
            className="flex-1 py-3.5 bg-gray-900 text-white font-semibold rounded-xl min-h-[48px]"
          >
            {currentIndex < memes.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    );
  }

  // GRID VIEW - Clean white
  return (
    <div className="min-h-screen bg-white">
      <ConnectModal />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm px-4 pt-14 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric to-lavender flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{dump.note || "Meme Dump"}</h1>
            <p className="text-gray-400 text-sm">from {senderName}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {memes.map((meme, index) => (
          <button
            key={meme.id}
            onClick={() => {
              setCurrentIndex(index);
              setView("slideshow");
            }}
            className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden"
          >
            {meme.file_type === "video" ? (
              <video src={meme.file_url} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img src={meme.file_url} alt="" className="w-full h-full object-cover" />
            )}
            {reactions[meme.id] && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow text-sm">
                {reactions[meme.id]}
              </div>
            )}
            {meme.file_type === "video" && (
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
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

      {/* Subtle connect prompt at bottom */}
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
