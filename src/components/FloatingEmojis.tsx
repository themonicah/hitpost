"use client";

import { useEffect, useState } from "react";

const EMOJIS = ["😂", "💀", "🔥", "😭", "💯", "✨", "🤣", "😩", "🙏", "👀", "🤡", "💅", "🥺", "😤", "🫠"];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function FloatingEmojis() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    const items: FloatingEmoji[] = [];
    for (let i = 0; i < 12; i++) {
      items.push({
        id: i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 16 + 12,
        duration: Math.random() * 10 + 15,
        delay: Math.random() * 5,
      });
    }
    setEmojis(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.07] dark:opacity-[0.05]">
      {emojis.map((item) => (
        <div
          key={item.id}
          className="absolute animate-float"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: item.size,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
