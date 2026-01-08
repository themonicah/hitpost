"use client";

import { Meme } from "@/lib/db";

interface DraftDump {
  id: string;
  name: string;
  memes: Meme[];
  recipientCount: number;
  createdAt: string;
}

interface DraftDumpsProps {
  drafts: DraftDump[];
  onDraftClick: (id: string) => void;
  onNewDump: () => void;
}

export default function DraftDumps({ drafts, onDraftClick, onNewDump }: DraftDumpsProps) {
  if (drafts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Drafts</h2>
        <button
          onClick={onNewDump}
          className="text-blue-500 text-sm font-medium"
        >
          New Dump
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            onClick={() => onDraftClick(draft.id)}
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
          >
            {/* 10-photo grid preview */}
            <div className="aspect-square relative">
              <div className="grid grid-cols-3 grid-rows-3 gap-px h-full">
                {[...Array(9)].map((_, i) => {
                  const meme = draft.memes[i];
                  return (
                    <div
                      key={i}
                      className={`bg-gray-100 dark:bg-gray-800 ${
                        i === 0 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      {meme ? (
                        meme.file_type === "video" ? (
                          <video
                            src={meme.file_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={meme.file_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Meme count badge */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                {draft.memes.length}/10
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate flex-1">
                  {draft.name || "Untitled Dump"}
                </p>
                <span className="text-xl ml-2">💩</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {draft.recipientCount} {draft.recipientCount === 1 ? "recipient" : "recipients"}
              </p>
            </div>
          </button>
        ))}

        {/* New dump card */}
        <button
          onClick={onNewDump}
          className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors"
        >
          <div className="aspect-square flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">➕</span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              New Dump
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-400 text-center">
              Start building a dump
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
