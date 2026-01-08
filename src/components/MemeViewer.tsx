"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";

interface MemeViewerProps {
  memes: Meme[];
  initialIndex: number;
  onClose: () => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export default function MemeViewer({
  memes,
  initialIndex,
  onClose,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
}: MemeViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);

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

  function toggleSelection() {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(currentMeme.id)) {
      newSelected.delete(currentMeme.id);
    } else {
      newSelected.add(currentMeme.id);
    }
    onSelectionChange(newSelected);
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

  const isSelected = selectedIds.has(currentMeme.id);
  const opacity = isDragging ? Math.max(0.3, 1 - dragY / 300) : 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{ backgroundColor: `rgba(0, 0, 0, ${opacity})` }}
    >
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-14 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        {/* Counter */}
        <div className="text-white/70 text-sm font-medium">
          {currentIndex + 1} / {memes.length}
        </div>

        {/* Select button (center) */}
        {selectable ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection();
            }}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 active:scale-95 ${
              isSelected
                ? "bg-blue-500 text-white"
                : "bg-white/20 text-white"
            }`}
          >
            {isSelected ? "✓ Selected" : "Select"}
          </button>
        ) : (
          <div />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition-all duration-200 active:scale-95"
        >
          ×
        </button>
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
          <video
            ref={videoRef}
            src={currentMeme.file_url}
            className="max-w-full max-h-full object-contain"
            controls
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={currentMeme.file_url}
            alt=""
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

      {/* Keyboard hint */}
      <div className="absolute bottom-8 pb-safe left-1/2 -translate-x-1/2 text-white/40 text-xs hidden sm:block">
        Use arrow keys to navigate, Esc to close
      </div>

      {/* Swipe hint (mobile) */}
      <div className="absolute bottom-8 pb-safe left-1/2 -translate-x-1/2 text-white/40 text-xs sm:hidden">
        Swipe to navigate • Drag down to close
      </div>
    </div>
  );
}
