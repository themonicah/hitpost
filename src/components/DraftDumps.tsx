"use client";

import { Meme } from "@/lib/db";

interface DraftDump {
  id: string;
  name: string;
  memes: Meme[];
  memeCount: number;
  recipientCount: number;
  createdAt: string;
}

interface DraftDumpsProps {
  drafts: DraftDump[];
  onDumpClick: (dumpId: string) => void;
  onNewDump: () => void;
}

// Tiny askew stack preview
function TinyStack({ memes }: { memes: Meme[] }) {
  if (memes.length === 0) {
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
        <span className="text-lg">💩</span>
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12">
      {memes.slice(0, 2).map((meme, i) => (
        <div
          key={meme.id}
          className="absolute w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shadow-sm"
          style={{
            transform: `rotate(${i === 0 ? -6 : 6}deg)`,
            top: `${i * 2}px`,
            left: `${i * 2}px`,
            zIndex: 2 - i,
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
  );
}

export default function DraftDumps({ drafts, onDumpClick, onNewDump }: DraftDumpsProps) {
  if (drafts.length === 0) {
    return null; // Don't show section if no drafts
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Drafts</h2>
        <button
          onClick={onNewDump}
          className="text-blue-500 text-sm font-medium"
        >
          + New
        </button>
      </div>

      {/* Horizontal scrolling compact cards */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {drafts.map((draft) => (
          <button
            key={draft.id}
            onClick={() => onDumpClick(draft.id)}
            className="flex-shrink-0 flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <TinyStack memes={draft.memes} />
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm max-w-[100px] truncate">
                {draft.name || "Untitled"}
              </p>
              <p className="text-xs text-gray-400">
                {draft.memeCount} meme{draft.memeCount !== 1 ? "s" : ""}
              </p>
            </div>
          </button>
        ))}

        {/* New dump button at end */}
        <button
          onClick={onNewDump}
          className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-dashed border-gray-200 hover:border-blue-400 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-500">New</span>
        </button>
      </div>
    </div>
  );
}
