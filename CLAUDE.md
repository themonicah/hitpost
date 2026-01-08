# HitPost - Claude Code Context

## Project Overview
HitPost is an iOS meme-sharing app. Users upload memes, create "dumps" (curated collections), and send them to friends. Recipients view dumps in-app or via web link.

## Tech Stack
- **Frontend:** Next.js 16 + React + TypeScript + Tailwind CSS
- **Mobile:** Capacitor for iOS wrapper
- **Database:** Vercel Postgres
- **Storage:** Vercel Blob (images/videos)
- **Auth:** Email magic link (no passwords)
- **Hosting:** Vercel

## Key Directories
```
src/
├── app/           # Next.js App Router pages
│   ├── api/       # API routes
│   ├── activity/  # Inbox/Activity feed
│   ├── dumps/     # Dump management
│   ├── library/   # Meme library
│   └── view/      # Public dump viewer
├── components/    # React components
└── lib/
    ├── db.ts      # Database operations
    ├── auth.ts    # Authentication
    └── schema.sql # Database schema
```

## Important Concepts

### Claim Code Flow
Recipients don't need the app to view dumps (web viewer exists). When they install the app, they enter a short claim code (e.g., "VIBE42") to link their account to dumps sent to them. This solves the problem of deep links not surviving app installs.

### User Identity
- Users can have `email` (from login) or `device_id` (anonymous)
- Recipients are identified by `name` (not email) since senders share via messaging apps

### Key Database Tables
- `users` - accounts
- `memes` - uploaded media
- `dumps` - sent collections
- `dump_recipients` - links dumps to recipients with claim codes
- `reactions` - emoji reactions on memes

## Common Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npx vercel       # Deploy to Vercel
```

## Production URL
https://hitpost.vercel.app

## See Also
- `SPEC.md` - Full product specification
