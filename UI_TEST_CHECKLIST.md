# HitPost UI Test Checklist

## Screen 1: Home (Dump-Centric View)
**URL:** `/`

### Expected Elements
- [ ] Header with "HitPost" title and fire emoji
- [ ] "New" button (💩) in header top-right
- [ ] Activity bell icon
- [ ] Profile icon with dropdown menu
- [ ] Drafts section (if drafts exist)
- [ ] Sent section (if sent dumps exist)
- [ ] "Start a dump" card when no drafts

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| Click "💩 New" button | Navigate to `/new-dump` |
| Click draft dump card | Open dump drawer (AddToDumpModal) |
| Click sent dump card | Open dump drawer showing recipients/status |
| Click activity bell | Navigate to `/activity` |
| Click profile icon | Show dropdown menu |
| Click "Sign out" in menu | Log out and redirect to login |

---

## Screen 2: New Dump Flow
**URL:** `/new-dump`

### Expected Elements
- [ ] Header with "Cancel" (left), "New Dump" (center), "Send/Save" (right)
- [ ] Camera roll picker opens automatically on load
- [ ] Scattered polaroid preview of selected photos
- [ ] "Name your dump..." input field
- [ ] "Send to" section with "+ Add" button
- [ ] Recipient picker (expandable)
- [ ] Action hint text at bottom

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| Select photos from camera roll | Photos appear in polaroid preview |
| Click "+ Add more" | Re-open camera roll picker |
| Click "×" on photo | Remove that photo |
| Type dump name | Name updates in input |
| Click "+ Add" in Send to | Show recipient picker |
| Click on connection | Toggle selection (blue checkmark) |
| Click on group row | Expand to show members |
| Click group checkbox | Select entire group |
| Type name in "Add someone new" | Enable "Add" button |
| Click "Add" for new person | **BUG: Currently failing** - Create new connection |
| Click "Cancel" | Go back to home |
| Click "Save" (no recipients) | Save as draft, go home |
| Click "Send" (has recipients) | Upload memes, create dump, show confetti, redirect |

---

## Screen 3: Dump Drawer (AddToDumpModal)
**Opens from:** Home screen dump cards, MemeViewer

### Expected Elements
- [ ] Header with Cancel/✕, title (editable for existing), action button
- [ ] Dump name input field
- [ ] Meme stack preview (askew polaroids)
- [ ] "+ Add more memes" button
- [ ] "Send to" section with recipient chips
- [ ] Recipient picker (expandable)

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| Edit dump name | Name updates, shows as unsaved |
| Click meme stack | Open meme picker |
| Select/deselect memes | Update meme preview |
| Add recipient | Recipient chip appears |
| Click "×" on recipient chip | Remove recipient |
| Click "Save Draft" | Save changes, close drawer |
| Click "Send Now" | Show confirmation dialog |
| Confirm send | Send dump, show confetti, close |
| Click backdrop | Close drawer (or prompt to save) |

---

## Screen 4: Recipient Picker (within drawer)
**Sections:** Connected, Pending, Groups, Add Someone New

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| Click connected user | Toggle blue checkmark |
| Click pending user | Toggle blue checkmark |
| Click group row (not checkbox) | Expand/collapse member list |
| Click group checkbox | Select all group members |
| See expanded group | Shows list of member names |
| Type new name | Enable "Add" button |
| Click "Add" | **BUG** - Should create connection and auto-select |
| Press Enter in name field | Trigger add action |

---

## Screen 5: Meme Picker
**Opens from:** Dump drawer "+ Add more memes"

### Expected Elements
- [ ] Header with "Done" and "Add Memes"
- [ ] Grid of user's memes
- [ ] Checkmarks on selected memes
- [ ] Selection count indicator

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| Click meme | Toggle checkmark |
| Click "Done" | Return to drawer with selections |
| Scroll | Load more memes if paginated |

---

## Screen 6: View Dump (Recipient View)
**URL:** `/view/[token]`

### Expected Elements
- [ ] Header with sender name and dump title
- [ ] 2-column meme grid
- [ ] Reaction badges on memes (if reacted)
- [ ] Video badge on video memes
- [ ] "Send a note" section
- [ ] "Get HitPost" prompt (if not claimed)

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| Click meme | Open lightbox |
| Swipe left/right in lightbox | Navigate memes |
| Click reaction emoji | Toggle reaction |
| Type and send note | Note saves |
| Click "Get HitPost" | Show app download modal |

---

## Screen 7: Activity Feed
**URL:** `/activity`

### Expected Elements
- [ ] Header with "Activity" title
- [ ] List of activity items (views, reactions)
- [ ] User avatars with initials
- [ ] Timestamps

### Interactions to Test
| Action | Expected Result |
|--------|-----------------|
| View activity | See recent views/reactions |
| Click activity item | Navigate to dump detail |

---

## Known Bugs to Fix

### Critical
1. **"Add someone new" fails** - Returns "Failed to create connection"
   - Location: `/api/connections` POST endpoint
   - Symptom: Error message shown, connection not created

### To Investigate
2. **Group editing** - No way to add/remove members from groups
3. **Meme library removed** - Verify camera-roll-only flow works on mobile

---

## Test Commands

```bash
# Run dev server
npm run dev

# Run build
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

## API Endpoints to Test

| Endpoint | Method | Test |
|----------|--------|------|
| `/api/connections` | GET | Returns user's connections |
| `/api/connections` | POST | Creates new connection |
| `/api/groups` | GET | Returns groups with members |
| `/api/dumps` | GET | Returns dumps (drafts/sent/all) |
| `/api/dumps` | POST | Creates new dump |
| `/api/memes` | POST | Uploads memes |
