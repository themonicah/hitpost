"use client";

import { useEffect, useState, useCallback } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeUploader from "@/components/MemeUploader";
import Link from "next/link";

interface HomeContentProps {
  userId: string;
}

export default function HomeContent({ userId }: HomeContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchMemes = useCallback(async () => {
    try {
      const res = await fetch("/api/memes");
      if (res.ok) {
        const data = await res.json();
        setMemes(data.memes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  function handleDelete(id: string) {
    setMemes((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleSelectMode() {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <MemeUploader onUpload={fetchMemes} />

      {/* Meme count and actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {memes.length} meme{memes.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          {selectMode && selectedIds.size > 0 && (
            <Link
              href={`/dumps/create?memes=${Array.from(selectedIds).join(",")}`}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium"
            >
              Create Dump ({selectedIds.size})
            </Link>
          )}
          <button
            onClick={toggleSelectMode}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectMode
                ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {memes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No memes yet
          </h3>
          <p className="text-gray-500 text-sm">
            Upload some memes to get started
          </p>
        </div>
      ) : (
        <MemeGrid
          memes={memes}
          selectable={selectMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={selectMode ? undefined : handleDelete}
        />
      )}
    </div>
  );
}
