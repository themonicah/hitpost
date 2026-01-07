"use client";

import { useEffect, useState, useCallback } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeUploader from "@/components/MemeUploader";
import SendDumpModal from "@/components/SendDumpModal";
import MemeViewer from "@/components/MemeViewer";
import EmptyState from "@/components/EmptyState";
import FunLoader from "@/components/FunLoader";

interface HomeContentProps {
  userId: string;
}

export default function HomeContent({ userId }: HomeContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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
        <FunLoader />
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
            <button
              onClick={() => setShowSendModal(true)}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium"
            >
              Send ({selectedIds.size})
            </button>
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
        <EmptyState
          type="memes"
          title="No memes yet"
          description="Upload your favorite memes to build your collection and share them with friends"
        />
      ) : (
        <MemeGrid
          memes={memes}
          selectable={selectMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={selectMode ? undefined : handleDelete}
          onMemeClick={selectMode ? undefined : (index) => setViewerIndex(index)}
        />
      )}

      {/* Meme Viewer */}
      {viewerIndex !== null && (
        <MemeViewer
          memes={memes}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={(ids) => {
            setSelectedIds(ids);
            if (ids.size > 0) setSelectMode(true);
          }}
        />
      )}

      {/* Send Modal */}
      <SendDumpModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        selectedMemes={memes.filter((m) => selectedIds.has(m.id))}
        onSent={() => {
          setSelectMode(false);
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
