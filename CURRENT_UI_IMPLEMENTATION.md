# HitPost Current UI Implementation

**Last Updated:** January 10, 2025

This document captures the current working state of the HitPost UI. Use this as reference to maintain consistency and avoid regression.

---

## Design Principles

1. **Flat, clean styling** - No gradients, minimal shadows. Brand color is `bg-orange-500`
2. **Tray-based navigation** - Drawers slide up from bottom, push content back
3. **Polaroid aesthetic** - Dumps displayed as tilted polaroid cards with 3x3 grids
4. **Auto-save behavior** - Changes save automatically, "Done" confirms and closes
5. **Consistent header pattern** - Left: navigation/profile, Center: title, Right: primary action

---

## Color Palette

```
Background:     bg-[#faf8f5]  (warm off-white)
Primary:        bg-orange-500 (buttons, accents)
Primary hover:  bg-orange-600
Text primary:   text-gray-900
Text secondary: text-gray-500
Text muted:     text-gray-400
Success:        bg-green-500, text-green-600
Danger:         text-red-500
```

---

## Core Components

### 1. Header (`src/components/Header.tsx`)

**Layout:**
```
┌─────────────────────────────────────────┐
│ [Bell][Profile]              [+ Dump]   │
└─────────────────────────────────────────┘
```

**Left side:**
- Activity/notification bell (links to `/activity`)
- Profile dropdown (shows email, QR code option, sign out)

**Right side:**
- "+ Dump" button (orange, rounded-full, only on home page)

**Styling:**
- Sticky top, z-40
- Background: `bg-[#faf8f5]` (flat, no gradient)
- Height: h-14

---

### 2. Home Screen (`src/app/HomeContent.tsx`)

**Layout:**
```
┌─────────────────────────────────────────┐
│              [Header]                   │
├─────────────────────────────────────────┤
│                                         │
│    [Polaroid]  [Polaroid]  [Polaroid]  │  ← Draft dumps (scattered)
│         [Polaroid]  [Polaroid]          │
│                                         │
├─────────────────────────────────────────┤
│         ┌───┬───┬───┐                   │
│         │ S │ S │ S │  [X sent]         │  ← Sent stack (bottom)
│         └───┴───┴───┘                   │
└─────────────────────────────────────────┘
```

**Draft Polaroids:**
- Displayed in flex-wrap layout with random rotations (-15 to +15 deg)
- Each card has slight random X/Y offset for organic feel
- No "DRAFT" label - user knows unsent dumps are drafts
- Shows 3x3 meme grid preview
- Tap opens dump drawer for editing

**Sent Stack (bottom):**
- Collapsed stack showing first 3 sent dumps
- Badge shows count (e.g., "5 sent")
- Tap expands to SentFlyout

**SentFlyout:**
- Full-screen overlay with backdrop blur
- Grid of sent dump polaroids
- Tap any to open SentDumpDrawer

**Key code - seeded random for consistent positioning:**
```typescript
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}
```

---

### 3. Dump Drawer (`src/components/AddToDumpModal.tsx`)

The main drawer for creating and editing dumps. Single scrollable view.

**Layout:**
```
┌─────────────────────────────────────────┐
│ [Done/X]  [Untitled Dump▼]  [Send Now]  │  ← Header with editable name
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────────┐             │
│         │  [Meme Stack]   │             │  ← Tap to manage
│         │    5 memes      │             │
│         │  Tap to manage  │             │
│         └─────────────────┘             │
│                                         │
├─────────────────────────────────────────┤
│  Send to...                        [>]  │  ← Recipients row
│  Choose recipients                      │
│                                         │
└─────────────────────────────────────────┘
```

**Header:**
- **Left:** Done (saves) or X (closes without changes)
- **Center:** Editable dump name input (placeholder: "Untitled Dump")
- **Right:** "Send Now" button (only when has memes + recipients)

**Header logic:**
| State | Left Button | Right Button |
|-------|-------------|--------------|
| No changes | X (close) | - |
| Has changes, no recipients | Done (save) | - |
| Has memes + recipients | Done (save) | Send Now |

**Meme Section:**
- Centered stack of askew images (rotated, stacked)
- Shows count: "5 memes"
- Shows hint: "Tap to manage"
- **Tap opens Meme Grid Tray** (not file picker directly)

**Recipients Section:**
- Shows as tappable row with summary
- Tap opens RecipientsTray

**Key behaviors:**
- Name editing happens inline in the header
- "Done" auto-saves all changes and closes
- "Send Now" shows confirmation, then sends
- Sequential file upload (one at a time) to avoid size limits

---

### 3b. Meme Grid Tray (within AddToDumpModal)

**When:** Tap the meme stack in dump drawer

**Layout:**
```
┌─────────────────────────────────────────┐
│ [<]          5 Memes           [+ Add]  │
├─────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐                │
│  │ X  │  │ X  │  │ X  │                │  ← Grid with delete buttons
│  │    │  │    │  │    │                │
│  └────┘  └────┘  └────┘                │
│  ┌────┐  ┌────┐                        │
│  │ X  │  │ X  │                        │
│  └────┘  └────┘                        │
└─────────────────────────────────────────┘
```

**Features:**
- 3-column grid of all memes
- Each meme has visible delete (X) button
- Tap meme to expand/view larger
- "+ Add" button in header to add more memes
- Video indicator badge on video memes

**Expanded Meme View (within grid tray):**
```
┌─────────────────────────────────────────┐
│ [<]          5 Memes           [+ Add]  │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │   [Large Meme]  │             │
│         │                 │             │
│         └─────────────────┘             │
│                                         │
│  [Back to Grid]        [Remove]         │
│                                         │
└─────────────────────────────────────────┘
```

**Interactions:**
- Back arrow returns to dump drawer
- Tap image in grid → expanded view
- "Back to Grid" → returns to grid
- "Remove" → deletes meme, returns to grid

---

### 4. Recipients Tray

**Layout (expanded from dump drawer):**
```
┌─────────────────────────────────────────┐
│ Back           Add People               │
├─────────────────────────────────────────┤
│  GROUPS                                 │
│  [✓] Work Friends (5)                   │
│  [ ] Family (3)                         │
│                                         │
│  CONNECTED                              │
│  [✓] John D.                            │
│  [ ] Mom                                │
│  [✓] Sarah K.                           │
│                                         │
│  [+ Add someone new...]  ← collapsible  │
│                                         │
└─────────────────────────────────────────┘
```

**Order:**
1. Groups (first)
2. Connected people
3. Add new (collapsible)

**Name format:** "First L." (e.g., "John D.", "Sarah S.")
- Single word names stay as-is (e.g., "Mom")

---

### 5. Link Sharing Modal (`src/components/LinkSharingModal.tsx`)

Shown after sending a dump with unconnected recipients.

**Layout:**
```
┌─────────────────────────────────────────┐
│  [X]                                    │
├─────────────────────────────────────────┤
│         ┌───┬───┬───┐                   │
│         │   │   │   │  ← Splayed photos │
│         └───┴───┴───┘                   │
│                                         │
│         "Dump Name"                     │
│         X/Y opened                      │
├─────────────────────────────────────────┤
│  [Recipient 1]           [Copy Link]    │
│  [Recipient 2]           [Copy Link]    │
├─────────────────────────────────────────┤
│  [Preview link]                 [Copy]  │
├─────────────────────────────────────────┤
│           [Done]                        │
└─────────────────────────────────────────┘
```

**Features:**
- Splayed photo stack at top (3 images, rotated)
- Dump name as title
- View count: "X/Y opened"
- List of recipients with copy link buttons
- Preview link for sender to view
- Done returns to home

---

### 6. Sent Dump Drawer (`src/components/SentDumpDrawer.tsx`)

Matches LinkSharingModal layout for consistency.

**Same layout as LinkSharingModal:**
- Gradient header (amber to orange)
- Splayed photos
- Recipient list with view status
- Copy link buttons
- Preview link

---

## Animations

**Tray slide-up:**
```css
@keyframes tray-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-tray-up {
  animation: tray-up 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
```

**Scale-in (dropdowns):**
```css
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-scaleIn {
  animation: scaleIn 0.15s ease-out;
}
```

**Expand-in (collapsible sections):**
```css
@keyframes expandIn {
  from { opacity: 0; transform: translateY(12px); max-height: 0; }
  to { opacity: 1; transform: translateY(0); max-height: 100px; }
}
.animate-expandIn {
  animation: expandIn 0.25s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}
```

---

## File Upload

**Sequential upload to avoid body size limits:**
```typescript
async function handleFileUpload(files: File[]) {
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      // Add to meme list
    }
  }
}
```

This prevents the Next.js 4MB body size limit from causing failures when uploading multiple images.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/components/Header.tsx` | App header with nav, profile, actions |
| `src/app/HomeContent.tsx` | Home screen with polaroids and sent stack |
| `src/app/LoggedInHome.tsx` | Wrapper that manages header + content state |
| `src/components/AddToDumpModal.tsx` | Main dump creation/editing drawer |
| `src/components/SentDumpDrawer.tsx` | View sent dump details |
| `src/components/LinkSharingModal.tsx` | Post-send link sharing |
| `src/app/globals.css` | Animations and global styles |

---

## Flow Summary

### Creating a New Dump
1. Tap "+ Dump" in header
2. Dump drawer opens (empty)
3. Tap empty meme area to add from camera roll
4. Edit name in header (placeholder: "Untitled Dump")
5. Tap meme stack → opens meme grid tray
   - View all memes in grid
   - Delete unwanted memes
   - Add more memes
   - Tap to expand/preview
6. Add recipients via tray
7. "Send Now" if ready, or "Done" to save draft

### Editing a Draft
1. Tap polaroid on home screen
2. Dump drawer opens with existing content
3. Edit name in header
4. Tap meme stack to manage memes
5. Add/remove recipients
6. "Done" saves, "Send Now" sends

### Managing Memes (within dump drawer)
1. Tap meme stack preview
2. Meme grid tray opens
3. See all memes in 3-column grid
4. Tap X on any meme to delete
5. Tap meme to expand/view larger
6. Tap "+ Add" to add more memes
7. Tap back arrow to return to dump drawer

### Viewing Sent Dumps
1. Tap sent stack at bottom
2. Flyout shows all sent dumps
3. Tap any to see details
4. See who viewed, copy links, etc.

---

## What NOT to Change

These decisions are intentional:

1. **No "DRAFT" labels** - Users understand unsent = draft
2. **No stats bar** - Clutter-free home screen
3. **No FAB** - Header button is cleaner
4. **No gradients on buttons** - Flat orange brand color
5. **Auto-save on Done** - No separate save confirmation
6. **Groups before Connections** - In recipient picker
7. **Sequential file upload** - Prevents size limit errors
8. **Name in header** - Not a separate input field below
9. **Meme management in separate tray** - Not inline in main dump drawer
10. **Delete buttons always visible** - Mobile-friendly, no hover dependency
