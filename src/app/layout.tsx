import type { Metadata, Viewport } from "next";
import "./globals.css";
import KonamiCode from "@/components/KonamiCode";
import FloatingEmojis from "@/components/FloatingEmojis";

export const metadata: Metadata = {
  title: "HitPost - Share Meme Dumps",
  description: "Save memes, create dumps, send to friends",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <FloatingEmojis />
        <KonamiCode />
        {children}
      </body>
    </html>
  );
}
