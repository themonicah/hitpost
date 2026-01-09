"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";

interface Dump {
  id: string;
  note: string | null;
  meme_count: number;
  is_draft: boolean;
}

interface MemeViewerProps {
  memes: Meme[];
  initialIndex: number;
  onClose: () => void;
  onAddToDump?: (meme: Meme) => void;
  onNewDump?: (meme: Meme) => void;
  onDelete?: (memeId: string) => void;
}

export default function MemeViewer({
  memes,
  initialIndex,
  onClose,
  onAddToDump,
  onNewDump,
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

  // Quick-add state
  const [dumps, setDumps] = useState<Dump[]>([]);
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);
  const [showDumpPicker, setShowDumpPicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [dumpMemeIds, setDumpMemeIds] = useState<Set<string>>(new Set());

  // Fetch dumps for quick-add
  useEffect(() => {
    fetch("/api/dumps?drafts=true")
      .then((r) => r.json())
      .then((data) => {
        const draftDumps = (data.dumps || []).filter((d: Dump) => d.is_draft);
        setDumps(draftDumps);
      })
      .catch(console.error);
  }, []);

  // Fetch memes in selected dump to know if current meme is already added
  useEffect(() => {
    if (!selectedDumpId) {
      setDumpMemeIds(new Set());
      return;
    }
    fetch(`/api/dumps/${selectedDumpId}`)
      .then((r) => r.json())
      .then((data) => {
        const memeIds = new Set<string>((data.memes || []).map((m: { id: string }) => m.id));
        setDumpMemeIds(memeIds);
      })
      .catch(console.error);
  }, [selectedDumpId]);

  // Reset video state when meme changes
  useEffect(() => {
    setVideoLoading(true);
    setVideoError(false);
  }, [currentIndex]);

  const currentMeme = memes[currentIndex];

  // Check if current meme is already in the selected dump
  const isInSelectedDump = selectedDumpId ? dumpMemeIds.has(currentMeme?.id) : false;
  const selectedDump = dumps.find((d) => d.id === selectedDumpId);

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

  // Quick-add to existing dump
  async function handleQuickAdd() {
    if (!selectedDumpId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/dumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeIds: [currentMeme.id],
          existingDumpId: selectedDumpId,
          isDraft: true,
          recipients: [],
        }),
      });
      if (res.ok) {
        // Update local state
        setDumpMemeIds((prev) => new Set([...prev, currentMeme.id]));
        setDumps((prev) =>
          prev.map((d) =>
            d.id === selectedDumpId ? { ...d, meme_count: d.meme_count + 1 } : d
          )
        );
        setToastMessage(`Added to "${selectedDump?.note || "Untitled"}"`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (err) {
      console.error("Failed to add:", err);
    } finally {
      setAdding(false);
    }
  }

  // Remove from existing dump
  async function handleRemove() {
    if (!selectedDumpId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/dumps/${selectedDumpId}/memes/${currentMeme.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Update local state
        setDumpMemeIds((prev) => {
          const next = new Set(prev);
          next.delete(currentMeme.id);
          return next;
        });
        setDumps((prev) =>
          prev.map((d) =>
            d.id === selectedDumpId ? { ...d, meme_count: Math.max(0, d.meme_count - 1) } : d
          )
        );
        setToastMessage(`Removed from "${selectedDump?.note || "Untitled"}"`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (err) {
      console.error("Failed to remove:", err);
    } finally {
      setAdding(false);
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

  // Calculate film strip scroll position
  const filmStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (filmStripRef.current) {
      const thumbnail = filmStripRef.current.children[currentIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  // Handle background click to dismiss
  function handleBackgroundClick(e: React.MouseEvent) {
    // Only close if clicking the background, not the content
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: `rgba(0, 0, 0, ${0.95 * opacity})` }}
    >
      {/* Header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-14 pb-4">
        {/* Close button - left side */}
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition-all duration-200 active:scale-95"
        >
          ×
        </button>

        {/* Counter in center */}
        <span className="text-white/60 text-sm font-medium">
          {currentIndex + 1} / {memes.length}
        </span>

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
        {!onDelete && <div className="w-10" />}
      </div>

      {/* Main content area - click outside to dismiss */}
      <div
        className="flex-1 flex items-center justify-center px-4 min-h-0"
        onClick={handleBackgroundClick}
        style={{
          transform: isDragging ? `translateY(${dragY}px) scale(${Math.max(0.9, 1 - dragY / 500)})` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            e.stopPropagation();
            handleTap();
          }}
          className="max-w-full max-h-full"
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
                  className={`max-w-full max-h-[60vh] object-contain rounded-lg ${videoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
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
              className="max-w-full max-h-[60vh] object-contain rounded-lg"
            />
          )}
        </div>
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

      {/* Add to Dump Bar */}
      {(onAddToDump || onNewDump) && (
        <div className="flex-shrink-0 px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-1.5 max-w-md mx-auto">
            {/* Dump selector dropdown */}
            <div className="relative flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDumpPicker(!showDumpPicker);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-white font-medium justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">
                    {selectedDump
                      ? selectedDump.note || "Untitled"
                      : "Select Dump"}
                  </span>
                  {selectedDump && (
                    <span className="flex-shrink-0 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {selectedDump.meme_count}
                    </span>
                  )}
                </div>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showDumpPicker && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                  {/* New Dump option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDumpPicker(false);
                      if (onNewDump) {
                        onNewDump(currentMeme);
                      } else if (onAddToDump) {
                        onAddToDump(currentMeme);
                      }
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 border-b border-white/10"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="font-medium">New Dump</span>
                  </button>

                  {/* Existing dumps */}
                  <div className="max-h-48 overflow-y-auto">
                    {dumps.map((dump) => (
                      <button
                        key={dump.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDumpId(dump.id);
                          setShowDumpPicker(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 ${
                          selectedDumpId === dump.id ? "bg-white/10" : ""
                        }`}
                      >
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                          <span className="text-sm">💩</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{dump.note || "Untitled"}</p>
                          <p className="text-xs text-white/60">{dump.meme_count} memes</p>
                        </div>
                        {selectedDumpId === dump.id && (
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                    {dumps.length === 0 && (
                      <div className="px-4 py-6 text-center text-white/40 text-sm">
                        No draft dumps yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Add/Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isInSelectedDump) {
                  handleRemove();
                } else {
                  handleQuickAdd();
                }
              }}
              disabled={!selectedDumpId || adding}
              className={`px-5 py-2.5 font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${
                isInSelectedDump
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-900"
              }`}
            >
              {adding ? "..." : isInSelectedDump ? "Remove" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Film Strip */}
      <div className="flex-shrink-0 pb-8 pt-2">
        <div
          ref={filmStripRef}
          className="flex gap-1 px-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {memes.map((meme, index) => (
            <button
              key={meme.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-2 ring-white scale-110"
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
            </button>
          ))}
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-fadeIn">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-lg">
            {toastMessage}
          </div>
        </div>
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
