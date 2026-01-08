import type { Metadata, Viewport } from "next";
import "./globals.css";
import KonamiCode from "@/components/KonamiCode";

export const metadata: Metadata = {
  title: "HitPost - Share Meme Dumps",
  description: "Save memes, create dumps, send to friends",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HitPost",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <KonamiCode />
        {children}
      </body>
    </html>
  );
}
