"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface DumpItem {
  id: string;
  note: string | null;
  meme_count: number;
  recipient_count: number;
  preview_url: string | null;
  preview_urls: string[];
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

  // Render a 3x3 mini grid for a dump
  function MiniGrid({ urls, memeCount }: { urls: string[]; memeCount: number }) {
    const slots = Array(9).fill(null).map((_, i) => urls[i] || null);
    return (
      <div className="grid grid-cols-3 gap-px w-full h-full bg-gray-700 rounded-lg overflow-hidden">
        {slots.map((url, i) => (
          <div key={i} className="aspect-square bg-gray-800">
            {url ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-[8px]">
                {i < memeCount ? "..." : ""}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe">
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Dumps</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* New Dump Button */}
          <button
            onClick={handleCreateClick}
            className="flex-shrink-0 w-24 h-28 rounded-xl bg-white/10 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/60 transition-all active:scale-95"
          >
            <span className="text-3xl mb-1">+</span>
            <span className="text-xs font-medium">New Dump</span>
          </button>

          {/* Loading state */}
          {loading && (
            <div className="flex-shrink-0 w-24 h-28 rounded-xl bg-white/5 animate-pulse" />
          )}

          {/* Draft dumps */}
          {drafts.map((dump) => (
            <button
              key={dump.id}
              onClick={() => handleDumpClick(dump.id)}
              className={`flex-shrink-0 w-24 rounded-xl overflow-hidden bg-white/5 transition-all ${
                selectedDumpId === dump.id
                  ? "ring-2 ring-amber-500 scale-105"
                  : "active:scale-95"
              }`}
            >
              {/* 3x3 Grid */}
              <div className="h-16 p-1">
                <MiniGrid urls={dump.preview_urls || []} memeCount={dump.meme_count} />
              </div>

              {/* Info */}
              <div className="px-2 py-1.5 text-left">
                <p className="text-white text-[11px] font-medium truncate">
                  {dump.note || "Untitled"}
                </p>
                <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                  <span>Draft</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/50">{dump.meme_count} memes</span>
                </div>
              </div>
            </button>
          ))}

          {/* Sent dumps */}
          {sent.map((dump) => (
            <button
              key={dump.id}
              onClick={() => handleDumpClick(dump.id)}
              className={`flex-shrink-0 w-24 rounded-xl overflow-hidden bg-white/5 transition-all ${
                selectedDumpId === dump.id
                  ? "ring-2 ring-green-500 scale-105"
                  : "active:scale-95 opacity-70"
              }`}
            >
              {/* 3x3 Grid */}
              <div className="h-16 p-1">
                <MiniGrid urls={dump.preview_urls || []} memeCount={dump.meme_count} />
              </div>

              {/* Info */}
              <div className="px-2 py-1.5 text-left">
                <p className="text-white text-[11px] font-medium truncate">
                  {dump.note || "Untitled"}
                </p>
                <div className="flex items-center gap-1 text-green-400 text-[10px]">
                  <span>Sent</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/50">{dump.recipient_count} people</span>
                </div>
              </div>
            </button>
          ))}

          {/* Empty state */}
          {!loading && dumps.length === 0 && (
            <div className="flex items-center text-sm text-white/40 px-2">
              Tap + to create a dump
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default DumpsBar;
