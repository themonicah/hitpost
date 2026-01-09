# HitPost UI Work Guide

**For: Claude instance doing UI changes**
**Created:** 2026-01-09

---

## Project Overview

HitPost is a meme dump sharing app. Users upload memes to a library, create "dumps" (curated collections), and send them to friends via claim codes.

**Tech Stack:** Next.js 16 + Capacitor (iOS/Android) + Vercel Postgres + Vercel Blob

**Live URL:** https://hitpost.vercel.app

---

## Before Starting: Create a Branch

Another Claude instance is working on push notifications on `main`. To avoid conflicts:

```bash
cd /Users/monicaharvancik/Projects/HitPost
git checkout -b feature/ui-changes
```

When done, push your branch:
```bash
git push -u origin feature/ui-changes
```

Then create a PR to merge into main.

---

## Key Files for UI Work

### App Screens
- `src/app/page.tsx` - Home screen wrapper
- `src/app/HomeContent.tsx` - Main library content with meme grid
- `src/app/activity/page.tsx` - Activity/inbox screen
- `src/app/layout.tsx` - Root layout

### Components
- `src/components/MemeGrid.tsx` - Meme grid with multi-select
- `src/components/MemeViewer.tsx` - In-app fullscreen viewer
- `src/components/SendDumpModal.tsx` - Modal for sending dumps
- `src/components/DumpsBar.tsx` - Bottom bar showing draft dumps
- `src/components/ClaimCodeButton.tsx` - "Got a code?" button and modal
- `src/components/ActivityDetailDrawer.tsx` - Activity item detail view
- `src/components/AppShell.tsx` - App shell with navigation
- `src/components/SplashScreen.tsx` - Splash screen

### Web Viewer (for recipients)
- `src/app/view/[token]/ViewDumpContent.tsx` - Cover sheet, slideshow, grid views
- `src/app/d/[token]/DumpLandingClient.tsx` - Share link landing page

---

## Current UI State

### What's Working
- Meme upload and grid display
- Multi-select and create dumps
- Send flow with groups/circles
- Claim code entry
- Receiver view with cover > slideshow > grid
- Reactions and notes

### Known UI Needs
- General polish and consistency
- Better loading states
- Empty states for no memes/no activity
- Animations and transitions
- Dark mode refinements

---

## Design Guidelines

- **Colors:** Gradients use amber-400 to orange-500 for primary CTAs
- **Style:** Dark backgrounds (bg-black) for viewers, light/dark mode support elsewhere
- **Typography:** System fonts, bold headers, meme culture personality
- **Spacing:** Tailwind classes, mostly p-4, gap-2, rounded-xl/2xl

---

## Commands

```bash
# Development
npm run dev

# Build (verify before committing)
npm run build

# The project uses Next.js 16 with Turbopack
```

---

## Files to Avoid (Being Modified by Other Instance)

The push notifications work will touch:
- `src/lib/push/*` (new files)
- `src/app/api/push/*` (new files)
- Possibly `src/lib/db.ts` (push token functions)
- Possibly `src/app/api/dumps/[dumpId]/send/route.ts` (sending push)

**Safe for UI work:** All component files, page layouts, styles

---

## When Done

1. Commit your changes with descriptive message
2. Push to your branch: `git push -u origin feature/ui-changes`
3. Create PR to merge into main
4. Or let the user know it's ready to merge

---

## Specs and Context

- Full PRD: `tasks/0001-prd-hitpost-app.md`
- Task list: `tasks/tasks-0001-prd-hitpost-app.md`
- Project spec: `SPEC.md`
