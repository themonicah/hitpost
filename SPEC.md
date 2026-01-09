# HitPost Product Specification

## Overview

HitPost is an iOS app that stores memes in a personal library and lets users send curated "meme dumps" to friends. A meme dump is a small private meme album delivered directly inside the app.

**Problem Solved:** Replaces the workflow of collecting memes in Photos and individually re-sending them across multiple chat apps. Centralizes meme storage and batch sharing.

---

## User Roles

| Role | Description |
|------|-------------|
| Sender | Uploads memes, creates dumps, selects recipients, sends dumps |
| Receiver | Gets dumps, views memes, reacts, leaves notes, can later send dumps |

**Important:** Every receiver is a full user. The app must support onboarding someone who only downloads because they received a meme dump.

---

## Tech Stack (Current Implementation)

| Layer | Choice |
|-------|--------|
| Framework | Next.js + Capacitor (iOS + Android) |
| Auth | Device-based (email optional for backup) |
| Database | Vercel Postgres |
| Media Storage | Vercel Blob |
| Hosting | Vercel |

### Platforms
- **iOS:** Distributed via TestFlight / App Store
- **Android:** Distributed via APK / Play Store
- **Web:** View-only for dump links (hitpost.vercel.app/view/*)

### Authentication Strategy
Users start with **device-based identity** - no email required to use the app. This removes friction from onboarding.

**Later upsell:** "Don't want to lose your collection? Add your email to back up your account."

Benefits:
- Zero-friction onboarding (just open app and start)
- Claim codes work seamlessly (device ID links to recipient)
- Email becomes optional upgrade, not barrier

---

## Core Data Objects

- **User** - Account with email or device_id
- **Meme** - Single media asset (image/video) in user's library
- **Dump** - Collection of memes sent to recipients
- **DumpRecipient** - Junction linking dump to recipient (with viewing/claim status)
- **Reaction** - Emoji reaction on a specific meme from a recipient
- **Collection** - Draft dump (memes grouped before sending)
- **RecipientGroup** - Saved group of recipients ("Circles")

---

## Primary Screens

### Library (Home)
- Grid of all uploaded memes
- Multi-select to create dumps
- Upload via camera roll

### Dumps
- **Drafts section:** Collections in progress
- **Sent section:** Feed of sent dumps with view stats and reactions

### Create Dump Flow
1. Select memes from library (or use existing collection)
2. Add optional note
3. Add recipients (names, not emails)
4. Review and send
5. Get shareable links + claim codes

### Activity (Inbox)
- Incoming dumps for receivers
- Each shows: sender, meme count, viewed/new status
- "Enter claim code" button for new users

### Dump Viewer
- Grid view → fullscreen slideshow
- Emoji reactions per meme (thumbs up/down, heart, laugh)
- Leave note at end
- Sets `viewed_at` on open

### History
- Sent dumps with stats: X/Y viewed, reactions received, notes

### Circles (Groups)
- Create/edit recipient groups
- Quick selection when sending

---

## Receiver Onboarding & Claim Flow

### The Problem
When sharing via WhatsApp/Signal/iMessage, the link context is lost when the recipient installs the app from the App Store. Deep links don't survive the install process.

### Solution: Claim Codes

Instead of relying on deep links, use memorable short codes displayed prominently in the web view.

### Flow

```
1. Sender creates dump
   └─> Assigns recipient NAMES (not emails - sender doesn't have friends' emails)
   └─> System generates: unique link + claim code per recipient

2. Sender shares link
   └─> Via WhatsApp, Signal, iMessage, etc.
   └─> Link format: hitpost.vercel.app/view/{token}

3. Recipient opens link in browser
   └─> Views memes in web viewer
   └─> Sees prominent banner with claim code (e.g., "VIBE42")
   └─> Banner says: "Get HitPost to receive more! Enter code: VIBE42"

4. Recipient installs app
   └─> From App Store / TestFlight
   └─> Opens app, creates account (email or device-based)

5. Recipient enters claim code
   └─> Goes to Activity tab → "Got a code?" button
   └─> Enters code like "VIBE42"
   └─> System links their account to the DumpRecipient record

6. Recipient is now connected
   └─> Dump appears in their Activity feed
   └─> They can react, leave notes
   └─> Future dumps from sender will appear automatically
```

### Claim Code Format
- Pattern: `WORD` + `2 digits` (e.g., `VIBE42`, `MEME99`, `FIRE23`)
- Word list: VIBE, MEME, DUMP, FIRE, GOLD, EPIC, COOL, HYPE, MOOD, FLEX, YEET, DANK, SPICY, CHEF, GOAT, KING, QUEEN, WILD, PURE, FRESH
- Easy to remember while switching between browser and app
- Case-insensitive entry

### Why This Approach
- No email required (you message friends, don't email them)
- Works regardless of deep link support
- Simple manual entry is more reliable than clipboard detection
- Codes are short enough to remember

---

## Claim Once, Push Forever

Once a recipient claims their first dump from a sender, they become **connected**. Future dumps from that sender skip the claim code entirely.

### How It Works

```
First dump to "Mom":
  → System checks: Has this sender→"Mom" relationship been claimed before?
  → NO → Generate claim code + link
  → Sender shares link manually
  → Mom opens link, installs app, enters code
  → System links: sender_id + "Mom" → mom's user_id

Second dump to "Mom":
  → System checks: Has this sender→"Mom" relationship been claimed before?
  → YES → Found mom's user_id from previous claim
  → Create recipient linked directly to her account
  → Send push notification: "New meme dump from [sender]!"
  → Dump appears instantly in Mom's Activity
  → No link sharing needed!
```

### Implementation Details

1. **Lookup**: `db.findClaimedRecipientByName(senderId, name)`
   - Searches previous dumps from this sender
   - Finds recipients with matching name (case-insensitive) who have claimed
   - Returns their `user_id` if found

2. **Connected Recipients**: When match found:
   - Create recipient with `user_id` pre-linked
   - Set `claimed_at` to now (already claimed)
   - No `claim_code` generated
   - Attempt push notification

3. **New Recipients**: When no match:
   - Generate claim code (existing flow)
   - Sender shares link manually

### Response Format

The API now returns richer recipient data:

```json
{
  "recipients": [
    {
      "name": "Mom",
      "link": "https://hitpost.vercel.app/view/abc123",
      "claimCode": null,        // null = already connected
      "isConnected": true,      // true = push was attempted
      "pushSent": true          // true = push notification sent
    },
    {
      "name": "New Friend",
      "link": "https://hitpost.vercel.app/view/def456",
      "claimCode": "VIBE42",    // needs to claim
      "isConnected": false,
      "pushSent": false
    }
  ]
}
```

### Benefits

- **Zero friction for return recipients** - No link sharing after first claim
- **Names as relationship keys** - "Mom" from Alice is different from "Mom" from Bob
- **Progressive enhancement** - First contact manual, then automatic
- **No contact sync required** - System learns relationships from usage

---

## Database Schema (Key Tables)

### users
```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE        -- nullable for device-only users
device_id VARCHAR(255) UNIQUE    -- for anonymous users
created_at TIMESTAMP
```

### dump_recipients
```sql
id UUID PRIMARY KEY
dump_id UUID REFERENCES dumps(id)
name VARCHAR(255) NOT NULL       -- recipient display name
email VARCHAR(255)               -- optional, nullable
user_id UUID REFERENCES users(id) -- linked after claim
token UUID UNIQUE                -- for view link
claim_code VARCHAR(10) UNIQUE    -- e.g., "VIBE42"
claimed_at TIMESTAMP             -- when code was used
viewed_at TIMESTAMP              -- when first opened
view_count INTEGER DEFAULT 0
recipient_note TEXT              -- note left by recipient
created_at TIMESTAMP
```

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Email magic link
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/session` - Get current user

### Memes
- `GET /api/memes` - List user's memes
- `POST /api/memes` - Upload meme
- `DELETE /api/memes/[id]` - Delete meme

### Dumps
- `GET /api/dumps` - List user's sent dumps
- `POST /api/dumps` - Create and send dump
- `GET /api/dumps/[id]` - Get dump details
- `POST /api/dumps/[id]/send` - Send dump to recipients

### Claim
- `POST /api/claim` - Claim a dump with code + deviceId

### Reactions
- `POST /api/reactions` - Add/remove reaction

---

## MVP Success Criteria

A brand new receiver who only installs from a shared link should:

1. Open link in browser and view memes
2. See claim code prominently displayed
3. Install HitPost
4. Create account (email or device-based)
5. Enter claim code
6. See the dump in their Activity
7. View memes and react
8. Leave a note
9. Enjoy it enough to send their own dump

**If this loop works, HitPost MVP is successful.**

---

## MVP Checklist

### Must Have
- [x] Account creation + login (email-based)
- [x] Add memes to Library
- [x] Create meme dump (1-50 memes)
- [x] Optional dump note
- [x] Recipient groups ("Circles")
- [x] Activity feed for receivers
- [x] Dump viewer (grid → fullscreen, reactions, notes)
- [x] View counter: X/Y viewed
- [x] Web view for non-app users
- [x] Claim code system for onboarding
- [ ] Push notifications (in progress)

### Not Included in MVP
- SMS/email automation for invites
- Public feed / discover
- Content moderation
- Contacts sync
- Save memes from received dumps to library

---

## URLs

- **Production:** https://hitpost.vercel.app
- **Web viewer:** https://hitpost.vercel.app/view/{token}
- **Claim page:** https://hitpost.vercel.app/claim (in-app)

---

## Distribution

Currently distributed via TestFlight. Senders manually share the TestFlight/App Store link via messaging apps along with the dump link.

Example invite text:
> Hey, I sent you a meme dump on HitPost! View it here: [link]
>
> Want to get more dumps? Install HitPost and enter code: VIBE42

---

## Current Implementation Status

### Completed (January 2025)

1. **Device-based Auth** - Users auto-login on first visit with device ID stored in localStorage
   - No email required to start
   - Session created automatically via `/api/auth/device`
   - `AutoLogin` component handles seamless onboarding

2. **Name-based Recipients** - Senders enter names, not emails
   - `DumpRecipient.name` field added
   - Claim codes generated per recipient

3. **Claim Code System** - Implemented and tested
   - Format: WORD + 2 digits (e.g., VIBE42)
   - `/api/claim` endpoint links claim code to user
   - Case-insensitive matching

4. **Database Migrations** - All new columns added
   - `users.device_id` for device auth
   - `users.email` now nullable
   - `dump_recipients.name`, `claim_code`, `claimed_at`

5. **Claim Once, Push Forever** - Smart recipient detection
   - `db.findClaimedRecipientByName()` finds previously connected recipients
   - Connected recipients get push notifications, no claim code needed
   - New recipients get claim codes (first-time flow)
   - API returns `isConnected` and `pushSent` status per recipient

### In Progress

1. **Push Notification Integration**
   - Push tokens stored in database (table exists)
   - Push logic implemented (logs for now)
   - TODO: Integrate with APNs (iOS) and FCM (Android)

2. **UI Polish**
   - Show connected vs new recipients differently in send flow
   - [x] "Got a code?" button in Activity tab (ClaimCodeButton component)

### Next Steps

1. **Test end-to-end flows**
   - Test sender creating dump with new recipient → claim code generated
   - Test receiver claiming with code
   - Test sender sending to same recipient again → push sent, no code

2. **Image/Video Optimization on Upload**
   - Compress images before uploading to Vercel Blob
   - Resize large images to reasonable max dimensions (e.g., 1080p)
   - Compress videos or convert to efficient formats
   - Generate thumbnails for video files
   - Consider WebP/AVIF for better compression

3. **Add email backup option**
   - Settings page with "Add email for backup"
   - Link device users to email for recovery

4. **Real push notifications**
   - Integrate APNs for iOS
   - Integrate FCM for Android

---

## Technical Notes

### Important Files

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Database operations, includes `generateClaimCode()`, `findClaimedRecipientByName()`, `createLinkedRecipient()` |
| `src/lib/auth.ts` | Session management, `createSessionFromDeviceId()` |
| `src/components/AutoLogin.tsx` | Auto-login component for new users |
| `src/app/api/auth/device/route.ts` | Device auth endpoint |
| `src/app/api/claim/route.ts` | Claim code validation endpoint |
| `src/app/api/dumps/route.ts` | Create dump with recipients (includes claim-once-push-forever logic) |
| `src/app/api/dumps/[dumpId]/send/route.ts` | Send draft dump to recipients (includes claim-once-push-forever logic) |
| `src/app/api/dev/migrate/route.ts` | Database migrations |

### Environment

- **Production URL:** https://hitpost.vercel.app
- **Database:** Vercel Postgres
- **Build:** `npm run build` (Next.js 16 + Turbopack)
- **Dev:** `npm run dev`

### Key Design Decisions

1. **Device ID over Email** - Reduces friction, email becomes optional backup
2. **Names not Emails** - Senders share via messaging apps where they have phone numbers, not emails
3. **Claim Codes over Deep Links** - App Store install breaks deep link context; codes are reliable
4. **Web Viewer First** - Non-app users can view dumps, then convert to app users
