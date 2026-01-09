# HitPost Brand Guidelines

## Brand Personality
HitPost is **playful**, **friendly**, and **effortless**. We make sharing memes feel like passing notes to friends - spontaneous, fun, and a little chaotic (in the best way).

**Voice:** Casual, witty, Gen-Z friendly
**Tone:** Warm, encouraging, never takes itself too seriously

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Sunny Yellow** | `#FFD93D` | Primary accent, CTAs, highlights |
| **Electric Blue** | `#6C9FFF` | Links, interactive elements |
| **Hot Coral** | `#FF6B6B` | Alerts, hearts, important actions |

### Secondary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Mint Fresh** | `#6BCB77` | Success states, confirmations |
| **Soft Lavender** | `#B794F6` | Reactions, special features |
| **Peachy** | `#FFAB76` | Warm accents, notifications |

### Neutrals
| Name | Hex | Usage |
|------|-----|-------|
| **Off White** | `#FAFAFA` | Light backgrounds |
| **Soft Gray** | `#F5F5F5` | Cards, secondary backgrounds |
| **Medium Gray** | `#9CA3AF` | Secondary text |
| **Dark Gray** | `#374151` | Primary text |
| **Near Black** | `#111827` | Dark mode backgrounds |

### Gradients
- **Primary Gradient:** `#FFD93D` → `#FFAB76` (Sunny to Peachy)
- **Action Gradient:** `#6C9FFF` → `#B794F6` (Blue to Lavender)
- **Fun Gradient:** `#FF6B6B` → `#B794F6` (Coral to Lavender)

---

## Typography

### Font Family
- **Primary:** Inter (clean, modern, highly legible)
- **Accent/Display:** System default bold (-apple-system)
- **Monospace:** SF Mono / Roboto Mono (for codes)

### Type Scale
| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 32px | Bold (700) | Hero headlines |
| H1 | 24px | Semibold (600) | Page titles |
| H2 | 20px | Semibold (600) | Section headers |
| H3 | 18px | Medium (500) | Card titles |
| Body | 16px | Regular (400) | Main content |
| Small | 14px | Regular (400) | Secondary info |
| Caption | 12px | Medium (500) | Labels, hints |

### Text Style Guidelines
- Headlines can be playful: "drop that heat", "send the vibes"
- Use lowercase for casual feel when appropriate
- Avoid ALL CAPS except for very short labels

---

## Illustration Style

### Character Guidelines
- **Style:** Flat vector, minimal shading
- **Shapes:** Rounded, friendly, blob-like
- **Outlines:** None or very subtle
- **Proportions:** Slightly exaggerated, cute

### Object Guidelines
- Simple geometric shapes
- Soft shadows (drop-shadow, not realistic)
- Floating elements with slight rotation
- Confetti, sparkles, and small decorative shapes

### Color in Illustrations
- Use brand colors prominently
- Add small pops of contrasting colors
- Include subtle background shapes (circles, blobs)
- Maintain white space

### Common Illustration Elements
- 📦 Cardboard boxes (for "dumps")
- 🔥 Fire/flames (for "heat")
- ✨ Sparkles and stars
- 💬 Speech bubbles
- 🎉 Confetti
- 😎 Simple face expressions
- 📱 Phone mockups

---

## UI Components

### Buttons
```
Primary: Yellow background (#FFD93D), dark text, rounded-2xl
Secondary: White background, border, rounded-2xl
Ghost: Transparent, text only
Destructive: Coral background (#FF6B6B), white text
```

### Cards
- Background: White (light) / Gray-900 (dark)
- Border radius: 16px (rounded-2xl)
- Shadow: Subtle, warm-toned
- Padding: 16px

### Input Fields
- Border radius: 12px (rounded-xl)
- Border: 2px solid gray-200
- Focus: Blue border with ring
- Placeholder: Casual, helpful text

### Modals & Drawers
- Border radius: 24px (rounded-3xl)
- Backdrop blur effect
- Slide-up animation on mobile

---

## Iconography

### Style
- Rounded stroke icons (2px weight)
- Filled variants for selected states
- Consistent 24px size for navigation
- 20px for inline/buttons

### Custom Icons Needed
- Dump box (open/closed)
- Fire/flame
- Meme stack
- Share/send
- Reaction emojis

---

## Animation Principles

### Timing
- Quick interactions: 150-200ms
- Page transitions: 300ms
- Celebratory animations: 500-800ms

### Easing
- Enter: ease-out
- Exit: ease-in
- Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Personality Animations
- Confetti on successful sends
- Bounce on selections
- Wiggle on errors
- Float for loading states
- Heart pop on double-tap

---

## Empty States

Each empty state should include:
1. Illustrated character/object
2. Friendly headline
3. Brief description
4. Clear CTA button

### Examples
- **No Memes:** Box character looking curious, "Your vault is empty"
- **No Dumps:** Sleeping box, "No dumps yet"
- **No Activity:** Peaceful scene, "All quiet here"

---

## Do's and Don'ts

### Do
- Use playful, casual language
- Add small delightful animations
- Keep UI clean with breathing room
- Use illustrations to guide users
- Celebrate user actions

### Don't
- Use corporate/formal language
- Overload screens with too many colors
- Make interactions feel slow
- Use stock photos
- Take yourself too seriously

---

## Asset Locations

```
public/
  illustrations/
    empty-memes.svg
    empty-dumps.svg
    empty-activity.svg
    onboarding-1.svg
    onboarding-2.svg
    success-send.svg
    box-character.svg
    fire-mascot.svg
```
