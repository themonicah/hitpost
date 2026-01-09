# HitPost Product Spec

## Core Value Prop
Send meme dumps to friends. Connected friends get push notifications. Everyone else gets a link you have to send manually (friction = motivation to get them to download the app).

---

## User Types

### Sender (App User)
Has the app, creates dumps, sends to people

### Recipient - Connected
- Has the app OR has claimed a previous dump
- Gets push notifications automatically
- No friction for sender

### Recipient - Not Connected
- Never received from this sender before
- Sender must manually send them a link (SMS, iMessage, etc.)
- This is intentionally friction to encourage app downloads

---

## Key Flows

### Flow 1: First Time Sender (Onboarding)
```
Open App
    ↓
Auto-login with device ID
    ↓
Empty Home Screen
    ├── "Start your first dump" card
    └── QR Code accessible from profile menu
    ↓
Tap "Start dump" → Camera roll opens
```

**QR Code Location:** Profile menu → "My QR Code"
- Purpose: Share with friends so they connect to you
- When scanned: Opens `/connect/[userId]` page where they enter their name
- Result: They become a "connection" you can send to without manual links

---

### Flow 2: Creating & Sending a Dump

```
Tap "New" (💩)
    ↓
Camera Roll opens → Pick memes
    ↓
Name your dump (optional)
    ↓
Select Recipients
    ├── CONNECTED (green checkmark) → Will get push
    ├── PENDING (gray) → You'll need to send link manually
    └── GROUPS → Expand to see members
    ↓
Tap "Send"
    ↓
[If any recipients not connected]
    Show: "Copy links to send manually"
    - List each non-connected person with their unique link
    - "Copy" button for each
    - "Share All" to open share sheet
    ↓
Confetti → Done
```

**Critical UI: Link Sharing for Non-Connected**
After sending, if ANY recipient is not connected:
```
┌─────────────────────────────────────┐
│  Dump sent! 🎉                      │
│                                     │
│  These friends need their links:    │
│                                     │
│  👤 Sarah K.         [Copy Link]    │
│  👤 Mike T.          [Copy Link]    │
│                                     │
│  [Share All Links]                  │
│                                     │
│  💡 Get them to scan your QR code   │
│     so next time they get a push!   │
│                                     │
│              [Done]                 │
└─────────────────────────────────────┘
```

---

### Flow 3: Recipient Experience (First Time - Not Connected)

**Step 1: Link received**
Sender manually texts/messages them a link like:
`hitpost.app/view/abc123`

**Step 2: Cover Sheet**
```
┌─────────────────────────────────────┐
│                                     │
│         [Meme Stack Preview]        │
│         (3 askew polaroids)         │
│                                     │
│     Monica sent you a meme dump     │
│                                     │
│     "Work Memes" • 5 memes          │
│                                     │
│         [Open Dump 💩]              │
│                                     │
└─────────────────────────────────────┘
```

**Step 3: Lightbox**
- Full screen viewer
- Swipe through memes
- React with emoji (😂 ❤️ 🔥 💀)
- Film strip at bottom

**Step 4: Ending Page (after viewing all)**
```
┌─────────────────────────────────────┐
│                                     │
│            That's all! 🎉           │
│                                     │
│    Send Monica a note:              │
│    ┌─────────────────────────┐     │
│    │ These were amazing...   │     │
│    └─────────────────────────┘     │
│           [Send Note]               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📱 Get HitPost                     │
│                                     │
│  Monica has to send you links       │
│  manually. Get the app so she       │
│  can send dumps directly!           │
│                                     │
│  Your connect code: WXYZ-1234       │
│                                     │
│         [Get HitPost]               │
│                                     │
└─────────────────────────────────────┘
```

**Step 5: If they get the app**
- Enter connect code during onboarding
- Auto-links them to Monica
- Future dumps = push notification

---

### Flow 4: Recipient Experience (Connected)

**Step 1: Push notification**
```
HitPost
Monica sent you a meme dump! "Work Memes" • 5 memes
```

**Step 2: Opens app directly to dump**
- Same lightbox experience
- No cover sheet needed (they're in the app)

---

### Flow 5: QR Code Connection

**Sender shares QR:**
Profile → My QR Code → Show/Share QR

**Friend scans:**
```
┌─────────────────────────────────────┐
│                                     │
│     Connect with Monica             │
│                                     │
│     What's your name?               │
│     ┌─────────────────────────┐    │
│     │ Sarah                    │    │
│     └─────────────────────────┘    │
│                                     │
│          [Connect]                  │
│                                     │
│  You'll get Monica's meme dumps     │
│  directly in the app!               │
│                                     │
└─────────────────────────────────────┘
```

**Result:**
- Sarah added to Monica's connections
- Sarah can optionally download app
- If Sarah has app → push notifications
- If not → still gets links but is "connected" (no manual link needed next time... wait, that doesn't work)

**Hmm, rethinking:** QR connection should require app download to be useful. Otherwise there's no way to push to them.

**Revised QR Flow:**
```
Scan QR → "Get HitPost to connect with Monica"
    ↓
Download app → Enter code/scan again
    ↓
Connected! Future dumps = push
```

---

## Current State vs Needed

### ✅ Exists
- Home screen with dumps
- New dump flow
- Recipient picker
- View dump lightbox

### ❌ Missing / Broken
1. **QR Code sharing** - Is it accessible? Working?
2. **Cover sheet** for first-time recipients - `/view/[token]` goes straight to grid
3. **Ending page** after viewing - Note + app upsell
4. **Link sharing modal** after sending to non-connected
5. **Connected indicator** on recipients (who will get push vs need link)
6. **First-time onboarding** - Explain QR, connections

---

## Priority Order

### P0 - Core Loop Must Work
1. ✅ Fix "Add someone new" (migration ran, table created)
2. ⏳ Cover sheet for recipients (`/view/[token]`) - state exists but not implemented
3. ⏳ Ending page after viewing all memes (note + upsell)
4. ⏳ Show links after sending to non-connected recipients

### P1 - Connection System
5. ✅ QR code exists (Profile menu → "My QR Code")
6. ✅ Connect page exists (`/connect/[userId]`)
7. ⏳ Clear "connected" vs "needs link" indicator in recipient picker

### P2 - Polish
8. Push notifications sending
9. First-time onboarding flow
10. Groups management (add/remove members)

---

## Screen Inventory

| Screen | URL | Status |
|--------|-----|--------|
| Home | `/` | ✅ Exists (new dump-centric) |
| New Dump | `/new-dump` | ✅ Exists |
| Dump Drawer | Modal | ✅ Exists |
| View Dump (recipient) | `/view/[token]` | ⚠️ Missing cover sheet |
| Intro/Cover Sheet | `/d/[token]` | ❓ Check if exists |
| Connect via QR | `/connect/[userId]` | ❓ Check if exists |
| Activity | `/activity` | ✅ Exists |
| QR Code Modal | Component | ❓ Check if accessible |
