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

// Small 3x3 grid preview - very compact
function MiniGrid({ memes }: { memes: Meme[] }) {
  return (
    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
      <div className="grid grid-cols-3 grid-rows-3 gap-px h-full w-full">
        {[...Array(9)].map((_, i) => {
          const meme = memes[i];
          return (
            <div key={i} className="bg-gray-200 overflow-hidden">
              {meme ? (
                meme.file_type === "video" ? (
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
                )
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DraftDumps({ drafts, onDumpClick, onNewDump }: DraftDumpsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dumps</h2>
        <button
          onClick={onNewDump}
          className="text-blue-500 text-sm font-medium"
        >
          New
        </button>
      </div>

      <div className="space-y-2">
        {/* Existing dumps - horizontal cards like iOS */}
        {drafts.map((draft) => (
          <button
            key={draft.id}
            onClick={() => onDumpClick(draft.id)}
            className="w-full flex items-center gap-4 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-left"
          >
            {/* Mini grid preview */}
            <MiniGrid memes={draft.memes} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate text-lg">
                {draft.name || "Untitled"}
              </p>
              <p className="text-gray-500">
                {draft.memeCount}
              </p>
            </div>

            {/* Poop avatar */}
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💩</span>
            </div>
          </button>
        ))}

        {/* New dump card - if no drafts exist */}
        {drafts.length === 0 && (
          <button
            onClick={onNewDump}
            className="w-full flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors"
          >
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-600">Create a Dump</p>
              <p className="text-sm text-gray-400">Start collecting memes</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
