"use client";

import { useState } from "react";
import { ActivityItem } from "@/lib/db";
import ActivityDetailDrawer from "./ActivityDetailDrawer";
import EmptyState from "./EmptyState";

interface ActivityContentProps {
  items: ActivityItem[];
}

function getDateGroup(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    }
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return "This Week";
  }

  if (diffDays < 30) {
    return "This Month";
  }

  return "Earlier";
}

function getRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getEmailName(email: string): string {
  return email.split("@")[0];
}

function ActivityCard({ item, onTap }: { item: ActivityItem; onTap: () => void }) {
  const name = item.recipientEmail ? getEmailName(item.recipientEmail) : "You";
  const time = getRelativeTime(item.timestamp);

  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="flex gap-3">
        {/* Icon/indicator */}
        <div className="flex-shrink-0">
          {item.type === "view" && (
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          )}
          {item.type === "reaction" && (
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
              {item.emoji}
            </div>
          )}
          {item.type === "note" && (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          )}
          {item.type === "sent" && (
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                {item.type === "view" && (
                  <span className="text-gray-600 dark:text-gray-400"> viewed your dump</span>
                )}
                {item.type === "reaction" && (
                  <span className="text-gray-600 dark:text-gray-400"> reacted {item.emoji}</span>
                )}
                {item.type === "note" && (
                  <span className="text-gray-600 dark:text-gray-400"> left a note</span>
                )}
                {item.type === "sent" && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}sent {item.memeCount} meme{item.memeCount !== 1 ? "s" : ""} to {item.recipientCount} {item.recipientCount === 1 ? "person" : "people"}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{time}</p>
            </div>

            {/* Thumbnail */}
            {(item.type === "reaction" && item.memeUrl) ? (
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {item.memeUrl.includes(".mp4") || item.memeUrl.includes(".mov") ? (
                  <video src={item.memeUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.memeUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ) : item.firstMemeUrl ? (
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {item.firstMemeUrl.includes(".mp4") || item.firstMemeUrl.includes(".mov") ? (
                  <video src={item.firstMemeUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.firstMemeUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ) : null}
          </div>

          {/* Note text preview */}
          {item.type === "note" && item.noteText && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                "{item.noteText}"
              </p>
            </div>
          )}

          {/* Dump note reference */}
          {item.dumpNote && item.type !== "sent" && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              on "{item.dumpNote}"
            </p>
          )}
          {item.dumpNote && item.type === "sent" && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              "{item.dumpNote}"
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ActivityContent({ items }: ActivityContentProps) {
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl">
        <EmptyState
          type="activity"
          title="No activity yet"
          description="When people view, react to, or comment on your dumps, you'll see it here"
        />
      </div>
    );
  }

  // Group items by date
  const groups: { [key: string]: ActivityItem[] } = {};
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Earlier"];

  items.forEach((item) => {
    const group = getDateGroup(item.timestamp);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
  });

  return (
    <>
      <div className="space-y-6">
        {groupOrder.map((groupName) => {
          const groupItems = groups[groupName];
          if (!groupItems || groupItems.length === 0) return null;

          return (
            <section key={groupName} className="animate-fadeInUp">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {groupName}
              </h2>
              <div className="space-y-3">
                {groupItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <ActivityCard
                      item={item}
                      onTap={() => setSelectedDumpId(item.dumpId)}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ActivityDetailDrawer
        dumpId={selectedDumpId}
        onClose={() => setSelectedDumpId(null)}
      />
    </>
  );
}
