# HitPost Tray System Specification

## Overview

The tray system provides a consistent, layered UI pattern for all dump-related workflows. Trays slide up from the bottom of the screen, can stack on top of each other, and use spring animations for a natural feel.

## Design Principles

1. **Context Preservation** - Trays overlay content rather than replacing screens
2. **Variable Heights** - Each tray level has different height to show progression
3. **Spring Animations** - Bouncy transitions for natural feel
4. **Push-Back Effect** - Background trays scale down and dim when a new tray opens

## Tray Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME SCREEN                               │
│                                                                  │
│    Scattered polaroid dumps on "messy desk"                     │
│                                                                  │
│    [Draft Dump] [Draft Dump] [Sent Dump] [Sent Dump]           │
│                                                                  │
│                                              [💩 FAB]           │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │ TAP FAB   │      │ TAP DRAFT │      │ TAP SENT  │
    └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
          │                   │                   │
          ▼                   ▼                   ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │ NEW DUMP  │      │ EDIT DUMP │      │ SENT DUMP │
    │   TRAY    │      │   TRAY    │      │   TRAY    │
    │  (75vh)   │      │  (75vh)   │      │  (85vh)   │
    └───────────┘      └───────────┘      └───────────┘
```

## Tray Types

### 1. New Dump Tray (AddToDumpModal - New Mode)

**Entry Point:** FAB button tap

**Height:** 75vh

**Initial State:**
- Empty memes list
- Empty name field
- No recipients selected
- Action button: "Save Draft" (disabled until has content)

**Layout:**
```
┌─────────────────────────────────────┐
│  ✕        New Dump        [Action]  │  ← Action = "Save Draft" or "Send Now"
├─────────────────────────────────────┤
│  Name: [____________________]       │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │      [+ Add memes]          │    │  ← Opens camera roll
│  │      From your camera roll  │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [👥 Send to...  →]                 │  ← Opens Recipients Tray
└─────────────────────────────────────┘
```

**Transitions:**
- Tap "Add memes" → Opens device camera roll (native picker)
- Tap "Send to..." → Opens Recipients Tray (stacks on top)
- Tap ✕ → Closes tray (warns if unsaved changes)
- Tap "Save Draft" → Saves and closes
- Tap "Send Now" → Shows confirmation → Sends → Shows confetti → Closes

---

### 2. Edit Dump Tray (AddToDumpModal - Edit Mode)

**Entry Point:** Tap a DRAFT polaroid

**Height:** 75vh

**Initial State:**
- Pre-populated with existing memes
- Pre-populated name
- No recipients (drafts don't have recipients yet)
- Action button: "Save Draft" or "Send Now"

**Layout:**
```
┌─────────────────────────────────────┐
│  ✕       [Dump Name]        [Action]│
├─────────────────────────────────────┤
│  Name: [Current Name_______]        │
├─────────────────────────────────────┤
│  ┌───┬───┬───┐                      │
│  │   │   │   │  16 memes            │
│  ├───┼───┼───┤  Ready to send       │
│  │   │   │   │                      │
│  └───┴───┴───┘                      │
│  [+ Add more]                       │
├─────────────────────────────────────┤
│  [👥 Send to...  →]                 │
└─────────────────────────────────────┘
```

**Transitions:** Same as New Dump Tray

---

### 3. Recipients Tray

**Entry Point:** Tap "Send to..." from Dump Tray

**Height:** 85vh (taller than parent to show progression)

**Layout:**
```
┌─────────────────────────────────────┐
│  ←        Recipients         Done   │
├─────────────────────────────────────┤
│  CONNECTED (gets push)              │
│  [✓] John D.                        │
│  [ ] Mom                            │
├─────────────────────────────────────┤
│  NOT CONNECTED (needs link)         │
│  [ ] Sarah K.                       │
│  [✓] Will P.                        │
├─────────────────────────────────────┤
│  GROUPS                             │
│  [ ] Work Friends (5)               │
│  [✓] Family (3)                     │
├─────────────────────────────────────┤
│  ADD SOMEONE NEW                    │
│  [Name...____________] [Add]        │
└─────────────────────────────────────┘
```

**Transitions:**
- Tap ← or "Done" → Closes recipients tray, returns to parent dump tray
- Selections are preserved when returning

**Animation:**
- Opens: `animate-tray-up` with spring easing
- Parent tray: `animate-tray-push-back` (scales to 92%, dims, shifts up 8px)
- Closes: `animate-tray-down`, parent: `animate-tray-pull-forward`

---

### 4. Sent Dump Tray (SentDumpDrawer)

**Entry Point:** Tap a SENT polaroid

**Height:** 85vh

**State:** Read-only view of sent dump

**Layout:**
```
┌─────────────────────────────────────┐
│  ✕        [Dump Name]               │
├─────────────────────────────────────┤
│  ┌───────────┐                      │
│  │ [meme]    │   3/5 opened         │
│  │   stack   │   12 memes · 8 views │
│  └───────────┘                      │
├─────────────────────────────────────┤
│  RECIPIENTS                         │
│  ┌─────────────────────────────┐    │
│  │ [M] meesh                   │    │
│  │     Not opened yet   [Copy] │    │
│  ├─────────────────────────────┤    │
│  │ [M] Monica P.       😂🔥   │    │
│  │     Opened · 3 views [Copy] │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│       Sent 1/10/2026, 9:38 AM       │
└─────────────────────────────────────┘
```

**Transitions:**
- Tap ✕ → Closes tray
- Tap "Copy" → Copies recipient's unique link

---

## State Machine

```
                    ┌──────────────┐
                    │    HOME      │
                    │   SCREEN     │
                    └──────┬───────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
  [Tap FAB]          [Tap Draft]         [Tap Sent]
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  NEW DUMP    │    │  EDIT DUMP   │    │  SENT DUMP   │
│    TRAY      │    │    TRAY      │    │    TRAY      │
│              │    │              │    │  (read-only) │
│ activeView:  │    │ activeView:  │    │              │
│   "main"     │    │   "main"     │    └──────┬───────┘
└──────┬───────┘    └──────┬───────┘           │
       │                   │              [Tap ✕]
       │                   │                   │
  [Tap "Send to..."]  [Tap "Send to..."]       ▼
       │                   │              ┌──────────┐
       ▼                   ▼              │  CLOSE   │
┌──────────────┐    ┌──────────────┐      └──────────┘
│  RECIPIENTS  │    │  RECIPIENTS  │
│    TRAY      │    │    TRAY      │
│              │    │              │
│ activeView:  │    │ activeView:  │
│ "recipients" │    │ "recipients" │
└──────┬───────┘    └──────┬───────┘
       │                   │
  [Tap Done/←]        [Tap Done/←]
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  DUMP TRAY   │    │  DUMP TRAY   │
│ activeView:  │    │ activeView:  │
│   "main"     │    │   "main"     │
└──────────────┘    └──────────────┘
```

## Animation Specifications

### Spring Easing
```css
cubic-bezier(0.34, 1.56, 0.64, 1)  /* overshoots for bounce */
```

### Tray Slide Up
```css
@keyframes traySlideUp {
  0% { transform: translateY(100%); opacity: 0.8; }
  100% { transform: translateY(0); opacity: 1; }
}
animation: traySlideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
```

### Push Back (Parent Tray)
```css
@keyframes trayPushBack {
  0% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
  100% { transform: scale(0.92) translateY(-8px); opacity: 0.5; filter: brightness(0.85); }
}
animation: trayPushBack 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
```

## Action Button Logic

| Has Memes? | Has Recipients? | Button Text | Button State |
|------------|-----------------|-------------|--------------|
| No         | Any             | Save Draft  | Disabled     |
| Yes        | No              | Save Draft  | Enabled      |
| Yes        | Yes             | Send Now    | Enabled      |

## Error States

1. **Network Error** - Show inline error message, allow retry
2. **Upload Failed** - Show toast with retry option
3. **Send Failed** - Stay on tray, show error, allow retry

## Accessibility

- All trays have proper focus management
- Backdrop click closes tray
- Escape key closes tray
- All buttons have min 44px touch targets
- Screen readers announce tray opening/closing

## Files

| File | Purpose |
|------|---------|
| `src/components/AddToDumpModal.tsx` | New/Edit dump tray with recipients sub-tray |
| `src/components/SentDumpDrawer.tsx` | Read-only sent dump tray |
| `src/app/globals.css` | Tray animation keyframes |
| `src/app/HomeContent.tsx` | Orchestrates which tray is open |
