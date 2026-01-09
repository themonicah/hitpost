# HitPost - Compact Context

## What It Is
A meme sharing app where users save memes to their library, create "dumps" (collections), and send them to friends. Think iOS Shared Albums but for memes.

## Core Concepts

### Memes
- Users upload images/videos to their personal library
- Grid view with 3-4 columns, borders/shadows for visibility
- Tap to open full-screen viewer (90% dark background)

### Dumps
- Collections of memes to send to people
- Can be saved as drafts or sent immediately
- Each dump has: name, memes (up to 10), recipients, optional comment

### Recipients & Connections
- **Claim Code System**: First-time recipients get a code (e.g., "VIBE42") to claim their connection
- **QR Code Connections**: Users can share QR code for others to connect directly
- **"Claim Once, Push Forever"**: Once connected, future dumps send push notifications automatically

## UI Patterns

### Home Screen (Meme Library)
- Header: "HitPost" with 🔥 decoration, activity bell, profile menu
- Drafts section at top (if any) - iOS-style 3x3 grid preview cards
- Meme grid below
- Floating 💩 button at bottom center for uploads

### Add to Dump Modal
- Askew/tilted meme preview (no count text)
- Comment field (optional)
- Dump selector row (tap to pick existing draft or new)
- "Add" button (top right) - saves as draft
- "Add & Send Now" button - goes to recipients view

### Recipients View (in modal)
- Sections: Connected, Pending, Groups, Add Someone New
- Each person/group is tappable row with checkmark
- Bottom illustration: "Send dump to X people"
- "Save" button sends the dump

### Recipient View (when someone receives a dump)
- Single-screen grid of memes
- Tap any meme → lightbox with 90% dark background
- Film strip at bottom for navigation
- Emoji reactions (😂 ❤️ 🔥 💀)
- Note section to reply to sender
- Connect prompt if not yet connected

### Meme Viewer (sender's view)
- 90% dark background
- Header: X (left), "Add to Dump" (center), trash (right)
- Swipe left/right to navigate
- Drag down to dismiss

## Database Tables

### Core
- `users` - id, email, device_id
- `memes` - id, user_id, file_url, file_type
- `dumps` - id, sender_id, note, is_draft, share_token
- `dump_memes` - dump_id, meme_id, sort_order
- `dump_recipients` - id, dump_id, name, token, claim_code, user_id, claimed_at

### Connections
- `user_connections` - connector_id, name, connected_user_id, connected_at
- `recipient_groups` - user_id, name
- `group_members` - group_id, name, email

### Engagement
- `reactions` - recipient_id, meme_id, emoji
- `push_tokens` - user_id, token, platform

## Key Routes

### Pages
- `/` - Home (meme library)
- `/dumps` - List of dumps
- `/dumps/[dumpId]` - Dump detail
- `/view/[token]` - Recipient view (public)
- `/connect/[userId]` - QR code connection page
- `/d/[token]` - Public share link
- `/activity` - Activity feed

### API
- `POST /api/memes` - Upload memes
- `POST /api/dumps` - Create/update dump
- `POST /api/connections` - Create connection (QR flow)
- `POST /api/claim` - Claim code redemption
- `POST /api/reactions` - Save emoji reaction

## Tech Stack
- Next.js 16 (App Router)
- Vercel Postgres + Blob storage
- Capacitor for iOS app
- Firebase for push notifications
- Tailwind CSS

## Design Principles
- White mode only (no dark mode)
- iOS-inspired patterns (shared albums, nested pickers)
- Meme culture personality (poop emoji, fun copy)
- 90% dark overlays for modal feel
- Minimal, effortless flows

## Brand Colors
- Sunny (yellow): Primary accent
- Peachy: Secondary
- Electric/Lavender: Gradients for avatars
- Gray-50 background, white cards
