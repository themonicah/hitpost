"use client";

import { Meme } from "@/lib/db";
import { useState } from "react";

interface MemeGridProps {
  memes: Meme[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onDelete?: (id: string) => void;
  maxSelections?: number;
}

export default function MemeGrid({
  memes,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onDelete,
  maxSelections = 50,
}: MemeGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function toggleSelection(id: string) {
    if (!onSelectionChange) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < maxSelections) {
      newSelected.add(id);
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

  if (memes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No memes yet. Upload some!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {memes.map((meme) => {
        const isSelected = selectedIds.has(meme.id);
        const isDeleting = deletingId === meme.id;

        return (
          <div
            key={meme.id}
            className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ${
              selectable ? "cursor-pointer" : ""
            } ${isSelected ? "ring-4 ring-blue-500" : ""} ${
              isDeleting ? "opacity-50" : ""
            }`}
            onClick={() => selectable && toggleSelection(meme.id)}
          >
            {meme.file_type === "video" ? (
              <video
                src={meme.file_path}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={meme.file_path}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {selectable && isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {Array.from(selectedIds).indexOf(meme.id) + 1}
              </div>
            )}

            {meme.file_type === "video" && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                Video
              </div>
            )}

            {onDelete && !selectable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(meme.id);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                disabled={isDeleting}
              >
                &times;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
