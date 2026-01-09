# HitPost UI Test Checklist

## Sender Flows

### S1: First Time Open (No Account)
| Action | Expected Result |
|--------|-----------------|
| Open app for first time | Auto-create account with device ID |
| See home screen | Empty state with prompt to create first dump |

### S2: Create New Dump
| Action | Expected Result |
|--------|-----------------|
| Tap new dump action | Camera roll opens |
| Select photos/videos | Selected media appears in preview |
| Add more media | Camera roll opens again, adds to selection |
| Remove media item | Item removed from selection |
| Name the dump | Name saves |
| Open recipient picker | See connections, groups, add new option |
| Select recipients | Recipients shown as selected |
| Send dump | Dump created, sent to recipients |
| Save as draft | Dump saved, can edit later |

### S3: Add New Recipient
| Action | Expected Result |
|--------|-----------------|
| Open recipient picker | See "add someone new" option |
| Type name | Name entered |
| Tap add | New connection created and auto-selected |
| New recipient appears | Shows in pending/not connected section |

### S4: Recipient Picker - Connection Status
| Action | Expected Result |
|--------|-----------------|
| View connected users | Shows indicator that they get push notifications |
| View pending/not connected users | Shows indicator that they need manual link |
| Distinguish visually | Clear difference between connected vs not connected |

### S5: Select Group
| Action | Expected Result |
|--------|-----------------|
| See groups in picker | Groups listed with member count |
| Tap group to expand | Shows list of members in group |
| Select group | All group members included as recipients |
| See group as selected | Group shown in selected recipients |

### S6: Send Dump - Link Sharing
| Action | Expected Result |
|--------|-----------------|
| Send dump with connected recipients only | Success, no link modal needed |
| Send dump with non-connected recipients | Link sharing modal appears |
| See link sharing modal | Lists recipients who need manual links |
| Copy individual link | Link copied to clipboard |
| Share all links | Share sheet opens with all links |
| Dismiss modal | Returns to app |

### S7: Save Draft
| Action | Expected Result |
|--------|-----------------|
| Have memes selected | Can save |
| Have just a name | Can save |
| No recipients required | Draft saves without recipients |
| Tap save | Draft appears on home screen |

### S8: Open Existing Draft
| Action | Expected Result |
|--------|-----------------|
| See draft on home | Draft card visible |
| Tap draft | Opens in edit mode |
| Edit name | Name updates |
| Add/remove memes | Meme selection updates |
| Add/remove recipients | Recipient selection updates |
| Send or save | Appropriate action taken |

### S9: View Sent Dump Status
| Action | Expected Result |
|--------|-----------------|
| See sent dump on home | Shows recipient count and view status |
| Tap sent dump | Opens detail view |
| See recipient list | Shows each recipient with view status |
| See reactions | Shows reactions from each recipient |
| See notes | Shows notes from recipients |

### S10: QR Code Sharing
| Action | Expected Result |
|--------|-----------------|
| Access QR code | QR code displayed |
| QR code links to connect page | Scanning opens connection page |
| Share QR image | Can share QR as image |
| Copy link | Can copy connect URL |

### S11: View Activity Feed
| Action | Expected Result |
|--------|-----------------|
| Open activity | See list of recent activity |
| See views | Shows who viewed dumps |
| See reactions | Shows reactions with emoji |
| See notes | Shows notes from recipients |
| Tap activity item | Navigates to related dump |

### S12: Sign Out
| Action | Expected Result |
|--------|-----------------|
| Access sign out | Sign out option available |
| Tap sign out | Logged out, returns to logged out state |

---

## Recipient Flows

### R1: Receive Link (Not Connected, No App)
| Action | Expected Result |
|--------|-----------------|
| Receive link from sender | Link works (sent via text/message) |
| Tap link | Opens in browser |
| See cover sheet | Shows who sent it, dump name, meme count, preview |

### R2: Open Dump - Cover Sheet
| Action | Expected Result |
|--------|-----------------|
| See sender info | Sender name/avatar visible |
| See dump info | Dump name and meme count visible |
| See preview | Meme preview visible |
| Tap to open | Opens lightbox viewer |

### R3: View Dump - Lightbox
| Action | Expected Result |
|--------|-----------------|
| See first meme | Full screen meme display |
| Swipe left | Next meme |
| Swipe right | Previous meme |
| See progress | Know which meme you're on (e.g., 3/5) |
| See film strip | Thumbnails of all memes |
| Tap thumbnail | Jump to that meme |
| React with emoji | Reaction saved, sender sees it |
| See available reactions | Reaction options visible |
| Toggle reaction | Can change or remove reaction |

### R4: Finish Viewing - Ending Page
| Action | Expected Result |
|--------|-----------------|
| View all memes | Ending page appears |
| See completion message | Know you've seen everything |
| See reaction summary | Your reactions displayed |
| Write note to sender | Text input available |
| Send note | Note saves, sender can see it |

### R5: App Upsell (Not Connected)
| Action | Expected Result |
|--------|-----------------|
| See app upsell | Prompted to download app |
| See value prop | Explains why to get app (direct push notifications) |
| See claim code | Unique code displayed |
| Tap download | Goes to app store |
| Dismiss | Can stay on web |

### R6: Receive Push Notification (Connected, Has App)
| Action | Expected Result |
|--------|-----------------|
| Get push notification | Shows sender name and dump info |
| Tap notification | Opens directly to dump |
| View dump | Same lightbox experience |
| React and note | Same functionality |

### R7: Connect via QR Code
| Action | Expected Result |
|--------|-----------------|
| Scan sender's QR code | Opens connect page |
| See connect page | Shows sender info |
| Enter your name | Name input available |
| Tap connect | Connection created |
| Success | Now in sender's connections |

### R8: Connect via Claim Code
| Action | Expected Result |
|--------|-----------------|
| Download app | App installed |
| Enter claim code | Code input available |
| Submit code | Links to sender |
| Success | Future dumps = push notification |

---

## Group Flows

### G1: Create Group
| Action | Expected Result |
|--------|-----------------|
| Access group creation | Create group option available |
| Enter group name | Name saves |
| Add members | Members added to group |
| Save group | Group created and available |

### G2: View Group Members
| Action | Expected Result |
|--------|-----------------|
| See group in list | Group visible with member count |
| Expand group | Member list visible |
| See all members | Each member name shown |

### G3: Edit Group
| Action | Expected Result |
|--------|-----------------|
| Access group edit | Edit option available |
| Rename group | Name updates |
| Add new member | Member added |
| Remove member | Member removed |
| Delete group | Group deleted |

### G4: Send to Group
| Action | Expected Result |
|--------|-----------------|
| Select group when creating dump | Group selected |
| All members included | Each member is a recipient |
| Each member gets own link or push | Based on connection status |

---

## Connection Flows

### C1: Sender Adds Recipient by Name
| Action | Expected Result |
|--------|-----------------|
| Type name in recipient picker | Name entered |
| Tap add | Connection created as "pending" |
| Send dump to them | They get a link (not push) |

### C2: Recipient Becomes Connected
| Action | Expected Result |
|--------|-----------------|
| Recipient receives dump link | Link works |
| Opens dump, sees claim code | Code visible |
| Downloads app | App installed |
| Enters claim code | Linked to sender |
| Future dumps | Gets push notification, no manual link needed |

### C3: Connected Indicator
| Action | Expected Result |
|--------|-----------------|
| View recipient in picker | Can tell if connected or not |
| Connected = push | Visual indicator for auto-delivery |
| Not connected = needs link | Visual indicator for manual send |

---

## Edge Cases

### E1: Empty States
| Scenario | Expected Result |
|----------|-----------------|
| No dumps yet | Prompt to create first dump |
| No recipients | Prompt to add recipients |
| No groups | Prompt to create group |
| No activity | Empty activity state |

### E2: Errors
| Scenario | Expected Result |
|----------|-----------------|
| Upload fails | Error shown, can retry |
| Send fails | Error shown, saved as draft |
| Connection create fails | Error message shown |
| Network offline | Offline state shown |

### E3: Permissions
| Scenario | Expected Result |
|----------|-----------------|
| Camera roll access denied | Prompt to enable in settings |
| Push notifications denied | Note that they won't get push |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/connections` | GET | Get user's connections |
| `/api/connections` | POST | Create new connection |
| `/api/groups` | GET | Get groups with members |
| `/api/groups` | POST | Create new group |
| `/api/groups/[id]` | PUT | Update group |
| `/api/groups/[id]` | DELETE | Delete group |
| `/api/groups/[id]/members` | POST | Add member to group |
| `/api/groups/[id]/members` | PUT | Update member |
| `/api/groups/[id]/members` | DELETE | Remove member |
| `/api/dumps` | GET | Get dumps (drafts/sent/all) |
| `/api/dumps` | POST | Create/send dump |
| `/api/dumps/[id]` | GET | Get dump details |
| `/api/memes` | POST | Upload memes |
| `/api/reactions` | POST | Save/update reaction |
| `/api/recipient-note` | POST | Save recipient note |
| `/api/activity` | GET | Get activity feed |
| `/api/claim` | POST | Claim with code |

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
