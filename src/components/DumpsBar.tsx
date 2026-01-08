"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface DumpItem {
  id: string;
  note: string | null;
  meme_count: number;
  preview_url: string | null;
  is_draft: boolean;
}

interface DumpsBarProps {
  onDumpSelect?: (dumpId: string) => void;
  onCreateNew?: () => void;
  selectedDumpId?: string | null;
}

export interface DumpsBarRef {
  refresh: () => void;
}

const DumpsBar = forwardRef<DumpsBarRef, DumpsBarProps>(function DumpsBar(
  { onDumpSelect, onCreateNew, selectedDumpId },
  ref
) {
  const [dumps, setDumps] = useState<DumpItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDumps() {
    try {
      const res = await fetch("/api/dumps");
      if (res.ok) {
        const data = await res.json();
        // Sort: drafts first, then sent (by date)
        const sorted = (data.dumps || []).sort((a: DumpItem, b: DumpItem) => {
          if (a.is_draft && !b.is_draft) return -1;
          if (!a.is_draft && b.is_draft) return 1;
          return 0;
        });
        setDumps(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch dumps:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDumps();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchDumps,
  }));

  function handleDumpClick(dumpId: string) {
    if (onDumpSelect) {
      onDumpSelect(dumpId);
    }
  }

  function handleCreateClick() {
    if (onCreateNew) {
      onCreateNew();
    }
  }

  const drafts = dumps.filter(d => d.is_draft);
  const sent = dumps.filter(d => !d.is_draft);

  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dumps</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* New Dump Button */}
          <button
            onClick={handleCreateClick}
            className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow"
          >
            <span className="text-2xl">+</span>
            <span className="text-[10px] font-medium">New</span>
          </button>

          {/* Loading state */}
          {loading && (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}

          {/* Draft dumps (bright) */}
          {drafts.map((dump) => (
            <button
              key={dump.id}
              onClick={() => handleDumpClick(dump.id)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative transition-all ${
                selectedDumpId === dump.id
                  ? "ring-2 ring-blue-500 scale-105"
                  : "hover:scale-105"
              }`}
            >
              {dump.preview_url ? (
                <img
                  src={dump.preview_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              )}

              {/* Draft badge */}
              <div className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[8px] font-bold px-1 rounded">
                DRAFT
              </div>

              {/* Meme count badge */}
              <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {dump.meme_count}
              </div>
            </button>
          ))}

          {/* Sent dumps (grayed out) */}
          {sent.map((dump) => (
            <button
              key={dump.id}
              onClick={() => handleDumpClick(dump.id)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative transition-all opacity-50 ${
                selectedDumpId === dump.id
                  ? "ring-2 ring-gray-400 scale-105 opacity-100"
                  : "hover:opacity-75"
              }`}
            >
              {dump.preview_url ? (
                <img
                  src={dump.preview_url}
                  alt=""
                  className="w-full h-full object-cover grayscale"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl grayscale">📦</span>
                </div>
              )}

              {/* Sent badge */}
              <div className="absolute top-0.5 left-0.5 bg-green-600 text-white text-[8px] font-bold px-1 rounded">
                SENT
              </div>

              {/* Meme count badge */}
              <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {dump.meme_count}
              </div>
            </button>
          ))}

          {/* Empty state */}
          {!loading && dumps.length === 0 && (
            <div className="flex items-center text-sm text-gray-400 px-2">
              Tap + to create a dump
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default DumpsBar;
