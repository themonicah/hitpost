"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FunLoader from "@/components/FunLoader";
import EmptyState from "@/components/EmptyState";
import AddToDumpModal from "@/components/AddToDumpModal";

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

// Envelope/package style dump card
function DumpCard({
  dump,
  onClick
}: {
  dump: DumpSummary;
  onClick: () => void;
}) {
  const isDraft = dump.is_draft;
  const allViewed = !isDraft && dump.viewed_count === dump.recipient_count && dump.recipient_count > 0;

  // Show up to 8 memes in the preview
  const previewCount = Math.min(dump.preview_urls.length, 8);
  const rotations = [-15, 10, -8, 12, -5, 18, -12, 8];
  const positions = [
    { top: "5%", left: "2%" },
    { top: "8%", left: "18%" },
    { top: "2%", left: "38%" },
    { top: "10%", right: "25%" },
    { top: "5%", right: "5%" },
    { bottom: "25%", left: "8%" },
    { bottom: "20%", left: "30%" },
    { bottom: "22%", right: "12%" },
  ];

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      <div className={`
        relative rounded-3xl overflow-hidden transition-all duration-300
        ${isDraft
          ? "bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-dashed border-amber-300"
          : "bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-slate-900/20"
        }
        group-hover:scale-[1.02] group-active:scale-[0.98]
      `}>
        {/* Meme collage - scattered polaroid style */}
        <div className="relative h-40 p-2 overflow-hidden">
          {dump.preview_urls.slice(0, previewCount).map((url, i) => (
            <div
              key={i}
              className="absolute w-14 h-14 bg-white p-0.5 rounded-lg shadow-md"
              style={{
                transform: `rotate(${rotations[i]}deg)`,
                ...positions[i],
                zIndex: i,
              }}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            </div>
          ))}

          {/* Count badge - only show if more than 8 */}
          {dump.meme_count > 8 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
              +{dump.meme_count - 8}
            </div>
          )}

          {/* Draft indicator */}
          {isDraft && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
              DRAFT
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className={`px-4 pb-4 ${isDraft ? "text-amber-900" : "text-white"}`}>
          <h3 className="font-bold text-lg truncate">
            {dump.note || "Untitled dump"}
          </h3>

          {isDraft ? (
            <p className="text-amber-700 text-sm">
              {dump.meme_count} meme{dump.meme_count !== 1 ? "s" : ""} ready to send
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              {/* Recipient dots */}
              <div className="flex -space-x-1">
                {Array.from({ length: Math.min(dump.recipient_count, 4) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 ${isDraft ? "border-amber-50" : "border-slate-800"} ${
                      i < dump.viewed_count
                        ? "bg-gradient-to-br from-green-400 to-emerald-500"
                        : "bg-slate-600"
                    }`}
                  />
                ))}
                {dump.recipient_count > 4 && (
                  <div className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                    <span className="text-[8px] text-slate-300">+{dump.recipient_count - 4}</span>
                  </div>
                )}
              </div>
              <span className="text-slate-400 text-sm">
                {allViewed ? "All seen!" : `${dump.viewed_count}/${dump.recipient_count} opened`}
              </span>
            </div>
          )}
        </div>

        {/* Wax seal for sent dumps */}
        {!isDraft && (
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center transform rotate-12">
            <span className="text-xl">💩</span>
          </div>
        )}
      </div>
    </button>
  );
}


export default function HomeContent({ userId }: HomeContentProps) {
  const router = useRouter();
  const [dumps, setDumps] = useState<DumpSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);
  const [showDumpDrawer, setShowDumpDrawer] = useState(false);

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
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const draftDumps = dumps.filter(d => d.is_draft);
  const sentDumps = dumps.filter(d => !d.is_draft);

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
        {/* FAB - always visible */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => router.push("/new-dump")}
            className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/40 hover:scale-110 active:scale-95 transition-transform"
          >
            <span className="text-2xl">💩</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="pb-24">
      {/* Drafts section */}
      {draftDumps.length > 0 && (
        <section className="px-4 py-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Drafts</h2>
          <div className="grid grid-cols-1 gap-4">
            {draftDumps.map((dump) => (
              <DumpCard
                key={dump.id}
                dump={dump}
                onClick={() => {
                  setSelectedDumpId(dump.id);
                  setShowDumpDrawer(true);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sent dumps section */}
      {sentDumps.length > 0 && (
        <section className="px-4 py-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Sent</h2>
          <div className="grid grid-cols-1 gap-4">
            {sentDumps.map((dump) => (
              <DumpCard
                key={dump.id}
                dump={dump}
                onClick={() => {
                  // Sent dumps go to detail page showing recipient status
                  router.push(`/dumps/${dump.id}`);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* FAB - always visible, the ONE place to create a dump */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => router.push("/new-dump")}
          className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/40 hover:scale-110 active:scale-95 transition-transform"
        >
          <span className="text-2xl">💩</span>
        </button>
      </div>

      {/* Dump Drawer */}
      <AddToDumpModal
        isOpen={showDumpDrawer}
        onClose={() => {
          setShowDumpDrawer(false);
          setSelectedDumpId(null);
          fetchDumps(); // Refresh list
        }}
        selectedMemes={[]}
        preselectedDumpId={selectedDumpId}
        onComplete={() => {
          fetchDumps(); // Refresh list
        }}
      />
    </div>
  );
}
