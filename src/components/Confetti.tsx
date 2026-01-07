"use client";

import { useEffect, useState } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];
const EMOJIS = ["🎉", "🎊", "✨", "🌟", "💫", "🔥", "💯", "🙌"];

interface Particle {
  id: number;
  x: number;
  color: string;
  emoji?: string;
  delay: number;
  size: number;
}

export default function Confetti({ active, duration = 2000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = [];

      // Create confetti particles
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          size: Math.random() * 8 + 4,
        });
      }

      // Add some emoji particles
      for (let i = 0; i < 8; i++) {
        newParticles.push({
          id: 100 + i,
          x: Math.random() * 100,
          color: "",
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          delay: Math.random() * 0.3,
          size: 24,
        });
      }

      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.x}%`,
            top: -20,
            animationDelay: `${particle.delay}s`,
            fontSize: particle.emoji ? particle.size : undefined,
          }}
        >
          {particle.emoji ? (
            particle.emoji
          ) : (
            <div
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
