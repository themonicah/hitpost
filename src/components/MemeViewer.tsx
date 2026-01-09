"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";

interface MemeViewerProps {
  memes: Meme[];
  initialIndex: number;
  onClose: () => void;
  onAddToDump?: (meme: Meme) => void;
  onDelete?: (memeId: string) => void;
}

export default function MemeViewer({
  memes,
  initialIndex,
  onClose,
  onAddToDump,
  onDelete,
}: MemeViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Reset video state when meme changes
  useEffect(() => {
    setVideoLoading(true);
    setVideoError(false);
  }, [currentIndex]);

  const currentMeme = memes[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < memes.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, memes.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
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

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/memes/${currentMeme.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(currentMeme.id);
        // If this was the last meme, close the viewer
        if (memes.length === 1) {
          onClose();
        } else if (currentIndex >= memes.length - 1) {
          // If we deleted the last item, go to previous
          setCurrentIndex(currentIndex - 1);
        }
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(false);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    dragStartY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;

    // Only allow dragging down
    if (deltaY > 0) {
      setIsDragging(true);
      setDragY(deltaY);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Handle drag-to-dismiss
    if (isDragging && dragY > 150) {
      onClose();
      return;
    }

    // Reset drag state
    setIsDragging(false);
    setDragY(0);
    dragStartY.current = null;

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
    }
  }

  const opacity = isDragging ? Math.max(0.3, 1 - dragY / 300) : 1;

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{ backgroundColor: `rgba(0, 0, 0, ${0.9 * opacity})` }}
    >
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-14 pb-4">
        {/* Close button - left side */}
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition-all duration-200 active:scale-95"
        >
          ×
        </button>

        {/* Center - Add to Dump */}
        {onAddToDump && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToDump(currentMeme);
            }}
            className="px-5 py-2.5 rounded-full font-semibold transition-all duration-200 active:scale-95 bg-white/20 text-white hover:bg-white/30"
          >
            Add to Dump
          </button>
        )}

        {/* Right - Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {!onDelete && !onAddToDump && <div className="w-10" />}
      </div>

      {/* Main content */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: isDragging ? `translateY(${dragY}px) scale(${Math.max(0.9, 1 - dragY / 500)})` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {currentMeme.file_type === "video" ? (
          <div className="relative">
            {/* Video loading indicator */}
            {videoLoading && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {/* Video error state */}
            {videoError && (
              <div className="flex flex-col items-center justify-center text-white/60 p-8">
                <div className="text-4xl mb-3">📹</div>
                <p className="text-sm">Video failed to load</p>
                <button
                  onClick={() => {
                    setVideoError(false);
                    setVideoLoading(true);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-white/20 rounded-full text-sm hover:bg-white/30"
                >
                  Retry
                </button>
              </div>
            )}
            {!videoError && (
              <video
                ref={videoRef}
                src={currentMeme.file_url}
                className={`max-w-full max-h-full object-contain ${videoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                controls
                playsInline
                autoPlay
                onCanPlay={() => setVideoLoading(false)}
                onError={() => {
                  setVideoLoading(false);
                  setVideoError(true);
                }}
              />
            )}
          </div>
        ) : (
          <img
            src={currentMeme.file_url}
            alt={`Meme ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full items-center justify-center text-white text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
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
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full items-center justify-center text-white text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
        >
          →
        </button>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 rounded-2xl p-6 mx-8 max-w-sm w-full">
            <h3 className="text-white text-lg font-bold text-center mb-2">Delete Meme?</h3>
            <p className="text-white/60 text-center text-sm mb-6">
              This will permanently delete this meme from your library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
