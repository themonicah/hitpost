"use client";

import { Meme } from "@/lib/db";
import { useState, useRef } from "react";

function ImageWithSkeleton({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

interface MemeGridProps {
  memes: Meme[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onDelete?: (id: string) => void;
  onMemeClick?: (index: number) => void;
  maxSelections?: number;
  onAddClick?: () => void;
}

export default function MemeGrid({
  memes,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onDelete,
  onMemeClick,
  maxSelections = 50,
  onAddClick,
}: MemeGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [heartId, setHeartId] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  function handleDoubleTap(id: string) {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === id && now - lastTapRef.current.time < 300) {
      // Double tap detected - show heart animation
      setHeartId(id);
      setTimeout(() => setHeartId(null), 600);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id, time: now };
    }
  }

  function toggleSelection(id: string) {
    if (!onSelectionChange) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < maxSelections) {
      newSelected.add(id);
    } else {
      // At limit - shake animation
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
      return;
    }
    onSelectionChange(newSelected);
  }

  async function handleDelete(id: string) {
    if (!onDelete) return;
    if (!confirm("Delete this meme?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/memes/${id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(id);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {/* Add button as first item */}
      {onAddClick && (
        <button
          onClick={onAddClick}
          aria-label="Upload memes"
          className="aspect-square rounded-xl bg-white/10 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center transition-all active:scale-95 hover:border-gray-400 dark:hover:border-gray-600 min-h-[80px]"
        >
          <span className="text-3xl text-gray-400">+</span>
          <span className="text-xs text-gray-400 mt-1">Add</span>
        </button>
      )}
      {memes.map((meme, index) => {
        const isSelected = selectedIds.has(meme.id);
        const isDeleting = deletingId === meme.id;

        const isShaking = shakeId === meme.id;
        const showHeart = heartId === meme.id;

        return (
          <button
            key={meme.id}
            aria-label={`${meme.file_type === "video" ? "Video" : "Image"} meme ${index + 1}${isSelected ? ", selected" : ""}`}
            className={`relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 transition-all duration-150 min-h-[80px] ${
              selectable || onMemeClick ? "cursor-pointer" : ""
            } ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-black" : ""} ${
              isDeleting ? "opacity-50" : ""
            } ${isShaking ? "animate-shake" : ""}`}
            onClick={() => {
              handleDoubleTap(meme.id);
              if (selectable) {
                toggleSelection(meme.id);
              } else if (onMemeClick) {
                onMemeClick(index);
              }
            }}
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
              <ImageWithSkeleton
                src={meme.file_url}
                alt={`Meme ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}

            {/* Double-tap heart animation */}
            {showHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-6xl animate-heartBeat drop-shadow-lg">❤️</span>
              </div>
            )}

            {selectable && isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-popIn">
                {Array.from(selectedIds).indexOf(meme.id) + 1}
              </div>
            )}

            {meme.file_type === "video" && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                Video
              </div>
            )}

{/* Delete moved to detail view */}
          </button>
        );
      })}
    </div>
  );
}
