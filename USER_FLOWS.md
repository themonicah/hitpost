# HitPost User Flows

## Sender Flows

### S1: First Time Open (No Account)
- App opens
- Auto-create account with device ID
- See empty home state
- See prompt to create first dump

### S2: Create New Dump
- Tap new dump action
- Camera roll opens
- Select one or more photos/videos
- See selected media preview
- Optionally name the dump
- Open recipient picker
- Select recipients (connections, groups, or add new)
- Send dump OR save as draft

### S3: Add New Recipient (During Dump Creation)
- Open recipient picker
- Type name in "add someone new" field
- Tap add
- New recipient appears in list and is auto-selected
- Recipient is saved for future dumps

### S4: Select Group
- Open recipient picker
- See list of groups
- Tap group to expand and see members
- Select group (selects all members)
- See group as chip in selected recipients

### S5: Send Dump
- Have memes selected
- Have at least one recipient selected
- Tap send
- If any recipients are NOT connected: see links to copy/share
- If all recipients are connected: just show success
- See confirmation/confetti

### S6: Copy Links for Non-Connected Recipients
- After sending dump with non-connected recipients
- See list of recipients who need links
- Copy individual link
- Or share all links via share sheet
- Dismiss and return home

### S7: Save Draft
- Have memes selected OR just a name
- No recipients required
- Tap save
- Draft appears on home screen
- Can reopen and continue editing later

### S8: Open Existing Draft
- See draft on home screen
- Tap draft
- Opens in drawer/editor mode
- Can edit name
- Can add/remove memes
- Can add/remove recipients
- Can send or save again

### S9: View Sent Dump Status
- See sent dump on home screen
- Shows how many recipients have viewed
- Tap to see details
- See list of recipients with view status
- See reactions from each recipient
- See notes from recipients

### S10: Share QR Code
- Open profile menu
- Tap QR code option
- See QR code that links to your connect page
- Can share QR image
- Can copy link
- When someone scans: they can connect to you

### S11: View Activity Feed
- Tap activity icon
- See list of recent activity
- Views, reactions, notes from recipients
- Tap activity item to see related dump

### S12: Sign Out
- Open profile menu
- Tap sign out
- Return to logged out state

---

## Recipient Flows

### R1: Receive Link (Not Connected, No App)
- Sender manually sends link via text/message
- Tap link
- See cover sheet with:
  - Who sent it
  - Dump name
  - Meme count
  - Preview of memes (blurred or small)
- Tap to open/view

### R2: View Dump (Lightbox)
- After opening from cover sheet
- See first meme full screen
- Swipe left/right to navigate
- See film strip of all memes
- Tap reaction emoji on any meme
- Reaction is saved and sender sees it

### R3: Finish Viewing (Ending Page)
- After viewing last meme (or dismissing lightbox)
- See ending screen
- Can write a note to sender
- Tap send note
- See upsell to download app
- See claim code if not connected

### R4: Download App Prompt
- On ending page
- See value prop: "Get the app so [sender] can send you dumps directly"
- See claim/connect code
- Tap to go to app store
- Or dismiss and stay on web

### R5: Receive Push Notification (Connected, Has App)
- Get push: "[Sender] sent you a meme dump"
- Tap notification
- Opens directly to dump (skip cover sheet since in-app)
- View in lightbox
- React and leave note

### R6: Connect via QR Code
- Scan sender's QR code
- See connect page
- Enter your name
- Tap connect
- You're now in sender's connections
- Future dumps from them = push notification

### R7: Connect via Claim Code
- Download app
- During onboarding or in settings
- Enter claim code from dump you received
- Links you to that sender
- Future dumps = push notification

---

## Connection Flows

### C1: Sender Adds Recipient by Name
- In recipient picker
- Type name
- Tap add
- Creates "pending" connection
- When sending: this person gets a link (not push)

### C2: Recipient Becomes Connected
- Recipient receives dump link
- Opens dump, sees claim code
- Downloads app
- Enters claim code
- Now "connected" to sender
- Future dumps = push, no manual link needed

### C3: Recipient Scans QR
- Sender shows QR code
- Recipient scans
- Enters their name
- If recipient has app: fully connected, gets push
- If no app: pending until they download

---

## Group Flows

### G1: Create Group
- Go to groups section
- Tap create new group
- Enter group name
- Add members (from connections or new names)
- Save group

### G2: Edit Group
- View group
- See list of members
- Add new member
- Remove existing member
- Rename group
- Delete group

### G3: Send to Group
- Creating dump
- In recipient picker
- Select a group
- All group members are included as recipients
- Each member gets their own link or push

---

## Edge Cases

### E1: Empty States
- No dumps yet: show create first dump prompt
- No recipients: show add recipient prompt
- No groups: show create group prompt
- No activity: show empty activity state

### E2: Errors
- Upload fails: show error, allow retry
- Send fails: show error, save as draft
- Connection create fails: show error message
- Network offline: show offline state

### E3: Permissions
- Camera roll access denied: show prompt to enable
- Push notifications denied: note that they won't get push
- Cannot access recipient's data: only sender sees view counts

---

## Data Each Screen Needs

### Home Screen
- List of drafts (name, meme count, preview)
- List of sent dumps (name, recipient count, viewed count, preview)

### New Dump / Edit Dump
- Selected memes (file, preview, type)
- Dump name
- Available connections (name, connected status)
- Available groups (name, member count, members)
- Selected recipients

### Recipient Picker
- Connected users (name, has app indicator)
- Pending users (name)
- Groups (name, member count, expandable members)
- Input for new recipient name

### View Dump (Recipient)
- Sender name
- Dump name
- Meme list (url, type)
- Existing reactions (meme → emoji)
- Existing note
- Claim code (if not claimed)

### Dump Detail (Sender)
- Dump name
- Meme previews
- Recipient list with:
  - Name
  - Viewed status
  - View count
  - Reactions
  - Note from them
- Copy link for each recipient

### Activity Feed
- Activity items:
  - Type (view, reaction, note)
  - Who (recipient name)
  - What (dump name, meme, emoji, note text)
  - When (timestamp)
