"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import FunLoader from "@/components/FunLoader";
import EmptyState from "@/components/EmptyState";
import AddToDumpModal from "@/components/AddToDumpModal";
import SentDumpDrawer from "@/components/SentDumpDrawer";

interface DumpSummary {
  id: string;
  note: string | null;
  is_draft: boolean;
  meme_count: number;
  recipient_count: number;
  viewed_count: number;
  created_at: string;
  preview_urls: string[];
}

interface HomeContentProps {
  userId: string;
}

// Generate consistent random values based on dump id
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

// Polaroid-style dump card with 3x3 meme grid
function PolaroidCard({
  dump,
  onClick,
  rotation,
  style,
  isSent,
}: {
  dump: DumpSummary;
  onClick: () => void;
  rotation: number;
  style?: React.CSSProperties;
  isSent?: boolean;
}) {
  // Get up to 9 memes for 3x3 grid
  const gridMemes = dump.preview_urls.slice(0, 9);
  const extraCount = dump.meme_count - 9;

  return (
    <button
      onClick={onClick}
      className={`
        group transition-all duration-300
        ${isSent ? "opacity-60" : "hover:scale-105 active:scale-95"}
      `}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
    >
      {/* Polaroid frame */}
      <div className="bg-white rounded-sm shadow-xl p-2 pb-8 relative"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)",
      }}
      >
        {/* 3x3 meme grid */}
        <div className="grid grid-cols-3 gap-0.5 w-28 h-28 bg-gray-200 overflow-hidden">
          {gridMemes.map((url, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-gray-300">
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Fill empty slots with gray */}
          {Array.from({ length: Math.max(0, 9 - gridMemes.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-gray-200" />
          ))}
        </div>

        {/* Extra count badge */}
        {extraCount > 0 && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            +{extraCount}
          </div>
        )}

        {/* Bottom label area - just name, no DRAFT label */}
        <div className="absolute bottom-1.5 left-2 right-2">
          <p className="text-xs font-medium text-gray-800 truncate">
            {dump.note || "Untitled"}
          </p>
          {isSent && (
            <p className="text-[10px] text-gray-400">
              {dump.viewed_count}/{dump.recipient_count} seen
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// Collapsed sent stack at bottom
function SentStack({
  sentDumps,
  onExpand,
}: {
  sentDumps: DumpSummary[];
  onExpand: () => void;
}) {
  if (sentDumps.length === 0) return null;

  // Show preview of first 3 sent dumps in a stack
  const previewDumps = sentDumps.slice(0, 3);

  return (
    <button
      onClick={onExpand}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 group"
    >
      <div className="relative" style={{ width: "100px", height: "70px" }}>
        {previewDumps.map((dump, i) => (
          <div
            key={dump.id}
            className="absolute bg-white rounded-sm shadow-lg overflow-hidden transition-transform group-hover:scale-105"
            style={{
              width: "60px",
              height: "60px",
              transform: `rotate(${(i - 1) * 8}deg) translateY(${i * 2}px)`,
              left: `${15 + i * 8}px`,
              zIndex: 3 - i,
            }}
          >
            {dump.preview_urls[0] && (
              <img
                src={dump.preview_urls[0]}
                alt=""
                className="w-full h-full object-cover opacity-70"
              />
            )}
          </div>
        ))}
        {/* Count badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {sentDumps.length} sent
        </div>
      </div>
    </button>
  );
}

// Expanded sent dumps flyout
function SentFlyout({
  isOpen,
  onClose,
  sentDumps,
  onSelectDump,
}: {
  isOpen: boolean;
  onClose: () => void;
  sentDumps: DumpSummary[];
  onSelectDump: (dumpId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 animate-tray-up">
        <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[70vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="font-semibold text-lg">Sent Dumps</h2>
            <div className="w-10" />
          </div>

          {/* Sent dumps grid */}
          <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)]">
            <div className="grid grid-cols-3 gap-3">
              {sentDumps.map((dump) => {
                const rand = seededRandom(dump.id);
                const rotation = (rand() - 0.5) * 10;

                return (
                  <button
                    key={dump.id}
                    onClick={() => onSelectDump(dump.id)}
                    className="group"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="bg-white rounded-sm shadow-md p-1.5 pb-6 relative group-hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-gray-200 overflow-hidden rounded-sm">
                        {dump.preview_urls[0] ? (
                          <img
                            src={dump.preview_urls[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300" />
                        )}
                      </div>
                      <div className="absolute bottom-1 left-1.5 right-1.5">
                        <p className="text-[10px] font-medium text-gray-800 truncate">
                          {dump.note || "Untitled"}
                        </p>
                        <p className="text-[8px] text-gray-400">
                          {dump.viewed_count}/{dump.recipient_count}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function HomeContent({ userId }: HomeContentProps) {
  const router = useRouter();
  const [dumps, setDumps] = useState<DumpSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);
  const [showDumpDrawer, setShowDumpDrawer] = useState(false);
  const [showSentDrawer, setShowSentDrawer] = useState(false);
  const [selectedSentDumpId, setSelectedSentDumpId] = useState<string | null>(null);
  const [showSentFlyout, setShowSentFlyout] = useState(false);

  const fetchDumps = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/dumps?all=true");
      if (res.ok) {
        const data = await res.json();
        setDumps(data.dumps || []);
      } else {
        setError("Failed to load dumps");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDumps();
  }, [fetchDumps]);

  // Separate drafts and sent dumps
  const draftDumps = useMemo(() =>
    dumps.filter(d => d.is_draft).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ), [dumps]);

  const sentDumps = useMemo(() =>
    dumps.filter(d => !d.is_draft).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ), [dumps]);

  // Generate scattered positions for drafts
  const scatteredDrafts = useMemo(() => {
    return draftDumps.map((dump, index) => {
      const rand = seededRandom(dump.id);
      // Random rotation between -15 and 15 degrees
      const rotation = (rand() - 0.5) * 30;
      // Random position offsets
      const offsetX = (rand() - 0.5) * 40;
      const offsetY = (rand() - 0.5) * 20;

      return {
        dump,
        rotation,
        offsetX,
        offsetY,
        zIndex: 20 + index,
      };
    });
  }, [draftDumps]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FunLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">😵</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Oops, something went wrong
        </h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchDumps();
          }}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state - no dumps at all (FAB is still visible)
  if (dumps.length === 0) {
    return (
      <>
        <div className="px-4 py-8">
          <EmptyState
            type="memes"
            title="No dumps yet"
            description="Tap the + button to create your first meme dump!"
          />
        </div>
        {/* FAB - opens new dump tray */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => {
              setSelectedDumpId(null);
              setShowDumpDrawer(true);
            }}
            className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="text-2xl">💩</span>
          </button>
        </div>

        {/* Dump Drawer for empty state */}
        <AddToDumpModal
          isOpen={showDumpDrawer}
          onClose={() => {
            setShowDumpDrawer(false);
            setSelectedDumpId(null);
            fetchDumps();
          }}
          selectedMemes={[]}
          preselectedDumpId={null}
          onComplete={() => {
            fetchDumps();
          }}
        />
      </>
    );
  }

  return (
    <div className="pb-32 min-h-screen relative">
      {/* Desk surface background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, #faf8f5 0%, #f0ebe3 100%)",
        }}
      />

      {/* Scattered draft polaroids */}
      <div className="relative px-4 pt-4">
        <div className="flex flex-wrap justify-center gap-4 py-4">
          {scatteredDrafts.map(({ dump, rotation, offsetX, offsetY, zIndex }) => (
            <div
              key={dump.id}
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px)`,
                zIndex,
              }}
            >
              <PolaroidCard
                dump={dump}
                rotation={rotation}
                isSent={false}
                onClick={() => {
                  setSelectedDumpId(dump.id);
                  setShowDumpDrawer(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sent stack at bottom */}
      <SentStack
        sentDumps={sentDumps}
        onExpand={() => setShowSentFlyout(true)}
      />

      {/* FAB - always visible, opens new dump tray */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            setSelectedDumpId(null);
            setShowDumpDrawer(true);
          }}
          className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="text-2xl">💩</span>
        </button>
      </div>

      {/* Sent Flyout */}
      <SentFlyout
        isOpen={showSentFlyout}
        onClose={() => setShowSentFlyout(false)}
        sentDumps={sentDumps}
        onSelectDump={(dumpId) => {
          setShowSentFlyout(false);
          setSelectedSentDumpId(dumpId);
          setShowSentDrawer(true);
        }}
      />

      {/* Dump Drawer - for drafts */}
      <AddToDumpModal
        isOpen={showDumpDrawer}
        onClose={() => {
          setShowDumpDrawer(false);
          setSelectedDumpId(null);
          fetchDumps();
        }}
        selectedMemes={[]}
        preselectedDumpId={selectedDumpId}
        onComplete={() => {
          fetchDumps();
        }}
      />

      {/* Sent Dump Drawer - read-only view */}
      <SentDumpDrawer
        isOpen={showSentDrawer}
        onClose={() => {
          setShowSentDrawer(false);
          setSelectedSentDumpId(null);
        }}
        dumpId={selectedSentDumpId}
      />
    </div>
  );
}
