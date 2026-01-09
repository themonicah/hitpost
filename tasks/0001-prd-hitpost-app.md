# PRD: HitPost - Meme Dump Sharing App

**Document Version:** 1.0
**Created:** 2026-01-09
**Status:** Draft

---

## 1. Introduction/Overview

### What is HitPost?

HitPost is a mobile application (iOS and Android) that allows users to store memes in a personal library and send curated "meme dumps" (small private meme albums) directly to friends. Think of it as a personal meme vault with batch sharing capabilities.

### Problem Statement

Currently, sharing memes with friends involves:
1. Saving memes to Photos app (cluttering personal photos)
2. Opening multiple chat apps (WhatsApp, iMessage, Signal)
3. Re-sending the same memes one-by-one to different people
4. Losing track of which memes you've already sent to whom

This workflow is fragmented, repetitive, and inefficient.

### Solution

HitPost centralizes meme storage and enables batch sharing through "dumps" - curated collections of memes sent directly to recipients via a simple claim-code system that works reliably across app installs.

### High-Level Goal

Create a personal-use tool that **just works** - a snappy, reliable app that makes sending meme dumps to friends feel effortless and enjoyable.

---

## 2. Goals

### Primary Goals

- **G1:** Enable users to store memes in a dedicated library separate from their camera roll
- **G2:** Allow batch selection and sharing of memes as "dumps" to multiple recipients
- **G3:** Implement "claim once, push forever" recipient system - first send requires manual link sharing, subsequent sends are automatic via push notifications
- **G4:** Deliver a snappy, responsive user experience that feels instant
- **G5:** Ship to both iOS App Store and Google Play Store
- **G6:** Track engagement metrics: who opened dumps and who converted to app users

### Secondary Goals

- **G7:** Support large media files through automatic compression and optimization
- **G8:** Enable recipients to react to individual memes and leave notes
- **G9:** Allow organizing recipients into "Circles" (groups) for quick batch sending

---

## 3. User Stories

### Sender Stories

**US-1: Upload Memes**
> As a sender, I want to upload memes from my camera roll to my HitPost library so that I can keep them organized separately from my personal photos.

**US-2: Create a Meme Dump**
> As a sender, I want to select multiple memes and bundle them into a dump so that I can share a curated collection with friends.

**US-3: Add Recipients**
> As a sender, I want to add recipients by name (not email) so that I can easily identify who I'm sending to.

**US-4: Send to New Recipient**
> As a sender, I want to send a dump to someone for the first time and receive a shareable link with claim code so that I can share it via my preferred messaging app.

**US-5: Send to Existing Recipient**
> As a sender, I want subsequent dumps to automatically appear in my friend's app (via push notification) without needing to share another link so that the experience becomes seamless over time.

**US-6: Track Engagement**
> As a sender, I want to see who has viewed my dump and which recipients have installed the app so that I know my memes are being enjoyed.

**US-7: Use Recipient Groups**
> As a sender, I want to save groups of recipients as "Circles" so that I can quickly send to the same group repeatedly.

**US-8: Add Notes**
> As a sender, I want to add an optional note to my dump so that I can provide context or a personal message.

### Receiver Stories

**US-9: View Dump in Browser**
> As a receiver who doesn't have the app, I want to view a meme dump in my browser so that I can see what was sent to me immediately.

**US-10: Install and Claim**
> As a receiver, I want to install the app and enter a simple claim code so that I can connect my account to the dump I received.

**US-11: Receive Future Dumps Automatically**
> As a receiver who has claimed a code from a sender, I want future dumps from that sender to automatically appear in my app so that I don't need to enter codes again.

**US-12: React to Memes**
> As a receiver, I want to add emoji reactions to individual memes so that the sender knows which ones I liked.

**US-13: Leave Notes**
> As a receiver, I want to leave a note after viewing a dump so that I can respond to the sender.

**US-14: View Activity Feed**
> As a receiver, I want to see all incoming dumps in an Activity feed so that I can easily access them.

### Shared Stories

**US-15: Zero-Friction Onboarding**
> As a new user, I want to start using the app immediately without entering email or creating an account so that I can get started quickly.

**US-16: Optional Email Backup**
> As an existing user, I want to optionally add my email so that I can recover my account and library on a new device.

---

## 4. Functional Requirements

### 4.1 Authentication & Onboarding

| ID | Requirement |
|----|-------------|
| FR-1.1 | The system must create a user account automatically using device ID on first app launch (no email required). |
| FR-1.2 | The system must persist the device-based session across app restarts. |
| FR-1.3 | The system must allow users to optionally add an email address for account backup/recovery. |
| FR-1.4 | The system must support account recovery via email magic link for users who have added email. |

### 4.2 Meme Library

| ID | Requirement |
|----|-------------|
| FR-2.1 | The system must allow users to upload images and videos from their device camera roll. |
| FR-2.2 | The system must allow users to capture new photos/videos directly within the app. |
| FR-2.3 | The system must display all uploaded memes in a scrollable grid view. |
| FR-2.4 | The system must support filtering memes by: All, Used (sent in a dump), Unused (never sent). |
| FR-2.5 | The system must allow deletion of memes from the library. |
| FR-2.6 | The system must automatically compress images larger than 2MB to optimize storage and transmission. |
| FR-2.7 | The system must automatically compress videos to a maximum of 720p resolution. |
| FR-2.8 | The system must detect duplicate memes (same file hash) and prompt the user before uploading ("This meme already exists in your library. Upload anyway?"). |

### 4.3 Dump Creation

| ID | Requirement |
|----|-------------|
| FR-3.1 | The system must allow users to multi-select memes from their library (1-50 memes per dump). |
| FR-3.2 | The system must enforce a maximum of 50 memes per dump. |
| FR-3.3 | The system must allow users to add an optional text note to the dump. |
| FR-3.4 | The system must allow users to save a dump as a draft (Collection) before sending. |
| FR-3.5 | The system must display selected meme count during dump creation. |

### 4.4 Recipient Management

| ID | Requirement |
|----|-------------|
| FR-4.1 | The system must allow senders to add recipients by display name (not email). |
| FR-4.2 | The system must enforce a maximum of 50 recipients per dump. |
| FR-4.3 | The system must allow users to create, edit, and delete recipient groups ("Circles"). |
| FR-4.4 | The system must allow users to select an entire Circle as recipients when creating a dump. |
| FR-4.5 | The system must remember previous recipients for quick re-selection. |

### 4.5 Claim Code System ("Claim Once, Push Forever")

| ID | Requirement |
|----|-------------|
| FR-5.1 | When sending to a NEW recipient (no existing sender-recipient relationship), the system must generate a unique claim code in format: WORD + 2 digits (e.g., VIBE42). |
| FR-5.2 | When sending to a NEW recipient, the system must generate a unique shareable link containing a token. |
| FR-5.3 | When sending to an EXISTING recipient (previously claimed from this sender), the system must NOT generate a new claim code. |
| FR-5.4 | When sending to an EXISTING recipient who has push notifications enabled, the system must send a push notification directly. |
| FR-5.5 | The system must accept claim codes case-insensitively. |
| FR-5.6 | The system must display the claim code prominently in the web viewer. |
| FR-5.7 | The system must provide a "Got a code?" button in the Activity tab for entering claim codes. |
| FR-5.8 | When a claim code is entered, the system must link the recipient's user account to the sender's recipient record, establishing the relationship. |
| FR-5.9 | The system must store the relationship: sender_id + recipient_name + user_id (recipient's account) after claiming. |

### 4.6 Push Notifications

| ID | Requirement |
|----|-------------|
| FR-6.1 | The system must request push notification permission on app launch (with appropriate context). |
| FR-6.2 | The system must store push tokens for users who grant permission. |
| FR-6.3 | The system must send push notifications to claimed recipients when they receive a new dump. |
| FR-6.4 | The system must send push notifications to senders when a recipient views their dump. |
| FR-6.5 | Push notification content for new dump must include: sender name and meme count. |

### 4.7 Web Viewer

| ID | Requirement |
|----|-------------|
| FR-7.1 | The system must provide a web-based viewer accessible via shareable link. |
| FR-7.2 | The web viewer must display all memes in the dump without requiring login. |
| FR-7.3 | The web viewer must display the claim code prominently with install instructions. |
| FR-7.4 | The web viewer must link to both App Store and Play Store downloads. |
| FR-7.5 | The web viewer must track view events (first view timestamp, total view count). |

### 4.8 Dump Viewer (In-App)

| ID | Requirement |
|----|-------------|
| FR-8.1 | The system must display dumps in a grid view initially. |
| FR-8.2 | The system must allow fullscreen viewing with swipe navigation between memes. |
| FR-8.3 | The system must allow recipients to add emoji reactions to individual memes (thumbs up, thumbs down, heart, laugh). |
| FR-8.4 | The system must allow recipients to leave a text note at the end of the dump. |
| FR-8.5 | The system must mark the dump as viewed on first open (set viewed_at timestamp). |

### 4.9 Activity Feed (Inbox)

| ID | Requirement |
|----|-------------|
| FR-9.1 | The system must display all received dumps in reverse chronological order. |
| FR-9.2 | Each dump entry must show: sender name, meme count, viewed/new status. |
| FR-9.3 | The system must visually distinguish between new (unread) and viewed dumps. |
| FR-9.4 | The system must provide a "Got a code?" button for entering claim codes. |

### 4.10 History (Sent Dumps)

| ID | Requirement |
|----|-------------|
| FR-10.1 | The system must display all sent dumps with statistics. |
| FR-10.2 | Statistics must include: X/Y recipients viewed, total reactions received, notes received. |
| FR-10.3 | The system must show per-recipient status: claimed (converted), viewed, pending. |

### 4.11 Analytics & Tracking

| ID | Requirement |
|----|-------------|
| FR-11.1 | The system must track dump views (count and timestamp per recipient). |
| FR-11.2 | The system must track claim code redemptions (conversion events). |
| FR-11.3 | The system must track push notification delivery status. |
| FR-11.4 | The system must provide senders with visibility into: total views, unique viewers, conversions (app installs from their dumps). |

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **NOT** part of this product:

| Non-Goal | Rationale |
|----------|-----------|
| SMS/email automation for invites | Manual sharing via messaging apps is preferred; avoids spam concerns |
| Public feed / discovery | This is a personal sharing tool, not a social network |
| Content moderation | Personal use tool; trust-based sharing between known contacts |
| Contacts sync | Privacy concern; users manually enter recipient names |
| Save memes from received dumps | Prevents redistribution; senders own their content |
| In-app messaging/chat | Users already have messaging apps for conversation |
| Meme editing/annotation | Out of scope for MVP; use external tools |
| Claim code expiration | Left as open question (see Section 9) |
| Scheduling dumps for later | Send immediately; no scheduling |
| Analytics dashboard | Simple inline stats only; no separate dashboard |

---

## 6. Design Considerations

### 6.1 User Experience Principles

- **Snappy:** All interactions must feel instant (<200ms perceived latency)
- **Simple:** Minimal taps to complete core flows
- **Reliable:** "It just works" - no confusing error states
- **Modern:** Clean, contemporary iOS/Android design patterns

### 6.2 Key Screens

| Screen | Purpose |
|--------|---------|
| Library (Home) | Grid of all memes with multi-select capability |
| Dumps | Drafts section + Sent section with stats |
| Create Dump Flow | 4-step wizard: Select memes > Add note > Add recipients > Send |
| Activity (Inbox) | Received dumps feed + claim code entry |
| Dump Viewer | Grid > fullscreen slideshow with reactions |
| Circles | Recipient group management |
| Settings | Email backup, notification preferences |

### 6.3 UI Components

- **Meme Grid:** Responsive grid with efficient lazy loading
- **Multi-select Mode:** Tap to select with count badge
- **Claim Code Display:** Large, bold, easy-to-read typography
- **Reaction Bar:** Horizontal emoji picker (4 options max)
- **Pull-to-refresh:** Standard refresh pattern on all lists

### 6.4 Performance Requirements

- App launch to interactive: <2 seconds
- Image grid scroll: 60fps, no jank
- Send dump operation: <5 seconds (plus upload time)
- Push notification delivery: <30 seconds

---

## 7. Technical Considerations

### 7.1 Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js + Capacitor | Hybrid approach for iOS + Android from single codebase |
| Auth | Device-based (device ID) | Email optional for backup |
| Database | Vercel Postgres | Managed PostgreSQL |
| Media Storage | Vercel Blob | For meme file storage |
| Hosting | Vercel | Serverless deployment |
| Push Notifications | Firebase Cloud Messaging (FCM) | Cross-platform push |

### 7.2 Platforms

- **iOS:** App Store distribution
- **Android:** Google Play Store distribution
- **Web:** View-only for dump links (not a full web app)

### 7.3 Key Data Models

**Users Table:**
- id, device_id, email (nullable), push_token, created_at

**Memes Table:**
- id, user_id, blob_url, file_hash, file_size_bytes, media_type, created_at

**Dumps Table:**
- id, sender_id, note, sent_at, created_at

**DumpRecipients Table:**
- id, dump_id, name, user_id (nullable until claimed), token, claim_code, claimed_at, viewed_at, view_count, recipient_note, push_token

**Reactions Table:**
- id, dump_id, meme_id, user_id, emoji, created_at

**Circles Table:**
- id, user_id, name, created_at

**CircleMembers Table:**
- id, circle_id, recipient_name

### 7.4 Media Optimization

| Media Type | Compression Strategy |
|------------|---------------------|
| Images >2MB | Compress to 80% quality JPEG, max 1920px width |
| GIFs | Keep original (no compression) |
| Videos | Transcode to 720p H.264, 30fps max |

### 7.5 API Endpoints (Key)

- `POST /api/auth/device` - Device-based login
- `POST /api/memes` - Upload meme (with compression)
- `POST /api/dumps` - Create dump
- `POST /api/dumps/[id]/send` - Send to recipients
- `POST /api/claim` - Claim code redemption
- `POST /api/reactions` - Add reaction
- `GET /api/view/[token]` - Web viewer data

### 7.6 Integration Points

- **App Stores:** iOS App Store Connect, Google Play Console
- **Push Services:** Firebase Cloud Messaging
- **Analytics:** Consider lightweight solution (Posthog, Mixpanel, or custom)

---

## 8. Success Metrics

### Primary Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Dump View Rate | % of dumps that are viewed by at least one recipient | >70% |
| Claim Conversion Rate | % of dump viewers who install app and claim code | >20% |
| Repeat Send Rate | % of senders who send 2+ dumps | >50% |
| Push Delivery Rate | % of push notifications successfully delivered | >95% |

### Secondary Metrics

| Metric | Description |
|--------|-------------|
| Time to First Dump | How long from install until first dump sent |
| Memes per Dump | Average number of memes in a dump |
| Reactions per Dump | Average reactions received per dump |
| Recipient Group Usage | % of dumps sent to Circles vs individual recipients |

### Tracking Implementation

The system must track and expose to senders:
- **Per Dump:** Total views, unique viewers, claim conversions
- **Per Recipient:** Viewed (yes/no), Claimed/Converted (yes/no), Reaction count

---

## 9. Open Questions

| # | Question | Impact | Notes |
|---|----------|--------|-------|
| OQ-1 | Should claim codes expire? If so, after how long? | Security vs. convenience | Left open per user request; recommend 30-day expiration with re-send capability |
| OQ-2 | What happens if a recipient loses their device? | Account recovery | Email backup is optional; device-only users would lose access |
| OQ-3 | Should senders be notified when recipients react? | Push notification volume | Could get noisy; consider batching |
| OQ-4 | Maximum file size for uploads before compression kicks in? | Storage costs, UX | Currently set at 2MB for images; needs validation |
| OQ-5 | How long to retain unclaimed dumps? | Storage costs | Recommend 90-day retention |
| OQ-6 | Should duplicate detection be based on file hash only or also include perceptual hashing? | Accuracy of detection | File hash is simpler; perceptual catches resaved images |

---

## 10. Acceptance Criteria Checklist

### Core Flow: Sender Creates and Sends First Dump
- [ ] User can upload memes from camera roll
- [ ] User can multi-select up to 50 memes
- [ ] User can add optional note
- [ ] User can add recipients by name (up to 50)
- [ ] System generates unique claim code per NEW recipient
- [ ] System generates shareable link per recipient
- [ ] User can copy/share link via system share sheet

### Core Flow: Receiver Claims and Views
- [ ] Recipient can view dump in browser without app
- [ ] Claim code displays prominently in web view
- [ ] App Store/Play Store links are visible
- [ ] New user can open app without email sign-up
- [ ] User can enter claim code in Activity tab
- [ ] Dump appears in Activity feed after claiming
- [ ] User can view memes in fullscreen slideshow
- [ ] User can add reactions to individual memes
- [ ] User can leave a note

### Core Flow: Subsequent Sends (Push Forever)
- [ ] System recognizes existing sender-recipient relationship
- [ ] System does NOT generate new claim code
- [ ] System sends push notification to recipient
- [ ] Dump appears automatically in recipient's Activity feed

### Performance
- [ ] App launches to interactive in <2 seconds
- [ ] Grid scrolls at 60fps
- [ ] Large images compress automatically
- [ ] Push notifications deliver within 30 seconds

---

## Appendix A: Claim Code Word List

VIBE, MEME, DUMP, FIRE, GOLD, EPIC, COOL, HYPE, MOOD, FLEX, YEET, DANK, SPICY, CHEF, GOAT, KING, QUEEN, WILD, PURE, FRESH

---

## Appendix B: Example User Flows

### First-Time Send Flow
```
Sender opens app
  -> Goes to Library
  -> Taps "Select" to enter multi-select mode
  -> Taps 5 memes
  -> Taps "Create Dump"
  -> Adds note: "Check out these gems!"
  -> Adds recipients: "Mom", "Jake", "Sarah"
  -> Taps "Send"
  -> System generates 3 claim codes (one per recipient)
  -> System shows shareable links
  -> Sender taps share icon for "Mom"
  -> System share sheet opens (WhatsApp, iMessage, etc.)
  -> Sender shares link via WhatsApp
```

### Receiver Claim Flow
```
Mom receives WhatsApp message with link
  -> Taps link
  -> Browser opens web viewer
  -> Sees 5 memes
  -> Sees banner: "Get HitPost! Enter code: VIBE42"
  -> Goes to App Store
  -> Installs HitPost
  -> Opens app (auto-creates device account)
  -> Goes to Activity tab
  -> Taps "Got a code?"
  -> Enters "VIBE42"
  -> Dump appears in Activity feed
  -> Mom is now linked to Sender
```

### Subsequent Send Flow (Push Forever)
```
Sender creates new dump
  -> Adds recipient: "Mom"
  -> System detects existing relationship (Mom claimed previously)
  -> System does NOT show claim code for Mom
  -> Sender taps "Send"
  -> System sends push notification to Mom
  -> Mom's phone shows notification: "New meme dump from [Sender]!"
  -> Mom opens app
  -> Dump is already in Activity feed
  -> No claim code needed
```

---

## Appendix C: Testing Strategy Recommendations

### Unit Tests
- Claim code generation (format validation, uniqueness)
- Media compression logic
- Duplicate detection algorithm
- Push notification payload construction

### Integration Tests
- Device auth flow (create account, persist session)
- Dump creation and sending pipeline
- Claim code redemption linking
- Push notification delivery

### End-to-End Tests
- Full sender flow: upload > create dump > send > share
- Full receiver flow: web view > install > claim > view
- Subsequent send flow: push notification delivery

### Manual QA Testing
- App Store submission requirements
- Various device sizes and OS versions
- Offline behavior and error recovery
- Push notification permissions flow

---

*End of PRD*
