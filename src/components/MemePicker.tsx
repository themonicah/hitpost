"use client";

import { useState, useEffect } from "react";
import { Meme } from "@/lib/db";
import FunLoader from "./FunLoader";

interface MemePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemeIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onDone: (selectedMemes: Meme[]) => void;
}

export default function MemePicker({
  isOpen,
  onClose,
  selectedMemeIds,
  onSelectionChange,
  onDone,
}: MemePickerProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSelection, setLocalSelection] = useState<Set<string>>(new Set(selectedMemeIds));

  // Fetch all memes when picker opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setLocalSelection(new Set(selectedMemeIds));
      fetch("/api/memes")
        .then((r) => r.json())
        .then((data) => {
          setMemes(data.memes || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedMemeIds]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function toggleMeme(memeId: string) {
    setLocalSelection((prev) => {
      const next = new Set(prev);
      if (next.has(memeId)) {
        next.delete(memeId);
      } else {
        next.add(memeId);
      }
      return next;
    });
  }

  function handleDone() {
    onSelectionChange(localSelection);
    const selectedMemes = memes.filter((m) => localSelection.has(m.id));
    onDone(selectedMemes);
    onClose();
  }

  if (!isOpen) return null;

  const selectionCount = localSelection.size;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onClose} className="text-blue-500 font-medium min-w-[60px]">
            Cancel
          </button>
          <h2 className="font-semibold">Add Memes</h2>
          <button
            onClick={handleDone}
            disabled={selectionCount === 0}
            className="text-blue-500 font-semibold min-w-[60px] text-right disabled:text-gray-300"
          >
            Done {selectionCount > 0 && `(${selectionCount})`}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FunLoader />
            </div>
          ) : memes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No memes yet
              </h3>
              <p className="text-gray-500">
                Upload some memes first to add them to dumps
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {memes.map((meme) => {
                const isSelected = localSelection.has(meme.id);
                return (
                  <button
                    key={meme.id}
                    onClick={() => toggleMeme(meme.id)}
                    className={`relative aspect-square overflow-hidden rounded-lg transition-all ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
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

                    {/* Selection indicator */}
                    <div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-blue-500 scale-100"
                          : "bg-black/30 border-2 border-white scale-90"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Video indicator */}
                    {meme.file_type === "video" && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
