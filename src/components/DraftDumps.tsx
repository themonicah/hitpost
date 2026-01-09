"use client";

import { Meme } from "@/lib/db";
import { useRouter } from "next/navigation";

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
  onNewDump?: () => void;
}

// 3x3 grid preview component
function GridPreview({ memes }: { memes: Meme[] }) {
  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
      <div className="grid grid-cols-3 grid-rows-3 gap-px h-full w-full">
        {[...Array(9)].map((_, i) => {
          const meme = memes[i];
          return (
            <div key={i} className="bg-gray-200 relative overflow-hidden">
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

export default function DraftDumps({ drafts, onNewDump }: DraftDumpsProps) {
  const router = useRouter();

  if (drafts.length === 0 && !onNewDump) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dumps</h2>
        {onNewDump && (
          <button
            onClick={onNewDump}
            className="text-blue-500 text-sm font-medium"
          >
            New
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            onClick={() => router.push(`/dumps/${draft.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            {/* Grid preview */}
            <div className="p-2">
              <GridPreview memes={draft.memes} />
            </div>

            {/* Info section */}
            <div className="px-3 pb-3 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {draft.name || "Untitled"}
                </p>
                <p className="text-sm text-gray-500">
                  {draft.memeCount}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <span className="text-sm">💩</span>
              </div>
            </div>
          </button>
        ))}

        {/* New dump card - only show if there's at least one draft or onNewDump provided */}
        {onNewDump && (
          <button
            onClick={onNewDump}
            className="bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors active:scale-[0.98]"
          >
            <div className="p-2">
              <div className="w-full aspect-square rounded-xl bg-gray-100 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">New Dump</p>
              </div>
            </div>
            <div className="px-3 pb-3">
              <p className="text-xs text-gray-400">
                Start fresh
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
