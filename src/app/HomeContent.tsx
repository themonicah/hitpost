"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Meme } from "@/lib/db";
import MemeGrid from "@/components/MemeGrid";
import MemeUploader from "@/components/MemeUploader";
import MemeViewer from "@/components/MemeViewer";
import EmptyState from "@/components/EmptyState";
import FunLoader from "@/components/FunLoader";
import DumpsBar, { DumpsBarRef } from "@/components/DumpsBar";
import DumpDrawer from "@/components/DumpDrawer";
import DumpCreator from "@/components/DumpCreator";

interface HomeContentProps {
  userId: string;
}

export default function HomeContent({ userId }: HomeContentProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);
  const [showDumpCreator, setShowDumpCreator] = useState(false);
  const dumpsBarRef = useRef<DumpsBarRef>(null);

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

  function handleAddToDump() {
    // Open creator with selected memes
    setShowDumpCreator(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FunLoader />
      </div>
    );
  }

  const selectedMemes = memes.filter((m) => selectedIds.has(m.id));

  return (
    <div className="space-y-4">
      {/* Upload area - compact when library has memes */}
      <MemeUploader onUpload={fetchMemes} compact={memes.length > 0} />

      {/* Meme count and actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {memes.length} meme{memes.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          {selectMode && selectedIds.size > 0 && (
            <button
              onClick={handleAddToDump}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium"
            >
              Add to Dump ({selectedIds.size})
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

      {/* Dump Creator - full screen flow */}
      <DumpCreator
        isOpen={showDumpCreator}
        onClose={() => {
          setShowDumpCreator(false);
          setSelectMode(false);
          setSelectedIds(new Set());
        }}
        onCreated={(dumpId) => {
          dumpsBarRef.current?.refresh();
          setSelectMode(false);
          setSelectedIds(new Set());
        }}
        initialMemes={selectedMemes}
      />

      {/* Dumps Bar - floating at bottom */}
      <DumpsBar
        ref={dumpsBarRef}
        onDumpSelect={setSelectedDumpId}
        onCreateNew={() => setShowDumpCreator(true)}
        selectedDumpId={selectedDumpId}
      />

      {/* Dump Detail Drawer */}
      <DumpDrawer
        dumpId={selectedDumpId}
        onClose={() => setSelectedDumpId(null)}
        onUpdate={() => dumpsBarRef.current?.refresh()}
      />

      {/* Spacer for dumps bar */}
      <div className="h-28" />
    </div>
  );
}
