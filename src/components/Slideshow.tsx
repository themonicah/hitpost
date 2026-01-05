"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";

interface SlideshowProps {
  memes: Meme[];
  initialIndex: number;
  reactions: Record<string, string>;
  onReact: (memeId: string, emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = ["😂", "❤️", "👍", "👎"];

export default function Slideshow({
  memes,
  initialIndex,
  reactions,
  onReact,
  onClose,
}: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showReactions, setShowReactions] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentMeme = memes[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < memes.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowReactions(false);
    }
  }, [currentIndex, memes.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowReactions(false);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }

  function handleTap() {
    if (currentMeme.file_type === "video" && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } else {
      setShowReactions((s) => !s);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl"
      >
        ×
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-50 text-white/70 text-sm">
        {currentIndex + 1} / {memes.length}
      </div>

      {/* Main content */}
      <div
        className="w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {currentMeme.file_type === "video" ? (
          <video
            ref={videoRef}
            src={currentMeme.file_path}
            className="max-w-full max-h-full object-contain"
            controls
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={currentMeme.file_path}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Current reaction indicator */}
      {reactions[currentMeme.id] && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-5xl animate-bounce">
          {reactions[currentMeme.id]}
        </div>
      )}

      {/* Reaction picker */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 transition-opacity ${
          showReactions || currentMeme.file_type !== "video"
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              onReact(currentMeme.id, emoji);
            }}
            className={`w-14 h-14 text-3xl bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-transform ${
              reactions[currentMeme.id] === emoji ? "scale-125 bg-white/40" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full items-center justify-center text-white text-2xl"
        >
          ←
        </button>
      )}
      {currentIndex < memes.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full items-center justify-center text-white text-2xl"
        >
          →
        </button>
      )}

      {/* Swipe hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 text-xs sm:hidden">
        Swipe to navigate
      </div>
    </div>
  );
}
