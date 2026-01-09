# Task List: HitPost - Meme Dump Sharing App

**PRD Source:** `/Users/monicaharvancik/Projects/dumpzone/tasks/0001-prd-hitpost-app.md`
**Generated:** 2026-01-09
**Status:** Complete - High-Level Tasks with Sub-Tasks

---

## Relevant Files

### Project Configuration
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `capacitor.config.ts` - Capacitor configuration for iOS/Android
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Environment variables (local development)
- `.env.production` - Environment variables (production)

### Database
- `lib/db/schema.ts` - Database schema definitions using Drizzle ORM
- `lib/db/index.ts` - Database connection and client setup
- `lib/db/migrations/` - Database migration files
- `lib/db/schema.test.ts` - Unit tests for schema validation

### Authentication
- `lib/auth/device-auth.ts` - Device-based authentication logic
- `lib/auth/session.ts` - Session management and persistence
- `lib/auth/email-recovery.ts` - Email backup and magic link recovery
- `lib/auth/device-auth.test.ts` - Unit tests for device auth
- `lib/auth/session.test.ts` - Unit tests for session management
- `app/api/auth/device/route.ts` - Device authentication API endpoint
- `app/api/auth/magic-link/route.ts` - Magic link generation endpoint
- `app/api/auth/verify-magic-link/route.ts` - Magic link verification endpoint

### Meme Library
- `lib/memes/upload.ts` - Meme upload and compression logic
- `lib/memes/compression.ts` - Image/video compression utilities
- `lib/memes/duplicate-detection.ts` - File hash duplicate detection
- `lib/memes/compression.test.ts` - Unit tests for compression
- `lib/memes/duplicate-detection.test.ts` - Unit tests for duplicate detection
- `app/api/memes/route.ts` - Meme CRUD API endpoints
- `app/api/memes/[id]/route.ts` - Individual meme operations
- `components/MemeGrid.tsx` - Responsive meme grid component
- `components/MemeGrid.test.tsx` - Unit tests for MemeGrid
- `components/MemeUploader.tsx` - Upload interface component
- `components/CameraCapture.tsx` - In-app camera capture component

### Dump Creation
- `lib/dumps/create.ts` - Dump creation logic
- `lib/dumps/validation.ts` - Dump validation (meme count, recipient limits)
- `lib/dumps/create.test.ts` - Unit tests for dump creation
- `app/api/dumps/route.ts` - Dump creation API endpoint
- `app/api/dumps/[id]/route.ts` - Individual dump operations
- `app/api/dumps/[id]/send/route.ts` - Send dump to recipients
- `components/DumpCreationWizard.tsx` - Multi-step dump creation flow
- `components/MemeSelector.tsx` - Multi-select meme picker
- `components/RecipientSelector.tsx` - Recipient selection UI
- `components/DraftManager.tsx` - Draft/Collection management

### Recipient Management
- `lib/recipients/manage.ts` - Recipient CRUD operations
- `lib/circles/manage.ts` - Circles (groups) CRUD operations
- `lib/circles/manage.test.ts` - Unit tests for circles
- `app/api/recipients/route.ts` - Recipients API endpoint
- `app/api/circles/route.ts` - Circles API endpoint
- `app/api/circles/[id]/route.ts` - Individual circle operations
- `components/CircleManager.tsx` - Circle management UI
- `components/CircleSelector.tsx` - Circle selection in dump flow

### Claim Code System
- `lib/claim-codes/generate.ts` - Claim code generation (WORD + 2 digits)
- `lib/claim-codes/redeem.ts` - Claim code redemption logic
- `lib/claim-codes/generate.test.ts` - Unit tests for code generation
- `lib/claim-codes/redeem.test.ts` - Unit tests for redemption
- `lib/claim-codes/words.ts` - Word list for claim codes
- `app/api/claim/route.ts` - Claim code redemption endpoint

### Push Notifications
- `lib/push/firebase.ts` - Firebase Cloud Messaging setup
- `lib/push/send.ts` - Push notification sending logic
- `lib/push/tokens.ts` - Push token management
- `lib/push/send.test.ts` - Unit tests for push sending
- `app/api/push/register/route.ts` - Register push token endpoint
- `public/firebase-messaging-sw.js` - Firebase service worker

### Web Viewer
- `app/view/[token]/page.tsx` - Public web viewer page
- `app/view/[token]/layout.tsx` - Web viewer layout
- `lib/view/tracking.ts` - View tracking logic
- `lib/view/tracking.test.ts` - Unit tests for view tracking
- `app/api/view/[token]/route.ts` - Web viewer data endpoint
- `components/WebDumpViewer.tsx` - Web viewer component
- `components/ClaimCodeBanner.tsx` - Claim code display banner

### In-App Dump Viewer
- `components/DumpViewer.tsx` - In-app dump viewer
- `components/FullscreenSlideshow.tsx` - Fullscreen meme slideshow
- `components/ReactionBar.tsx` - Emoji reaction picker
- `components/RecipientNote.tsx` - Note input component
- `components/DumpViewer.test.tsx` - Unit tests for dump viewer
- `app/api/reactions/route.ts` - Reactions API endpoint
- `app/api/dumps/[id]/note/route.ts` - Recipient note endpoint

### Activity Feed & History
- `components/ActivityFeed.tsx` - Received dumps feed
- `components/ActivityFeed.test.tsx` - Unit tests for activity feed
- `components/ClaimCodeEntry.tsx` - "Got a code?" interface
- `components/HistoryView.tsx` - Sent dumps history
- `components/DumpStats.tsx` - Dump engagement statistics
- `app/api/activity/route.ts` - Activity feed API endpoint
- `app/api/history/route.ts` - Sent dumps history API endpoint

### App Screens
- `app/(tabs)/layout.tsx` - Tab navigation layout
- `app/(tabs)/library/page.tsx` - Library (Home) screen
- `app/(tabs)/dumps/page.tsx` - Dumps screen (drafts + sent)
- `app/(tabs)/activity/page.tsx` - Activity (Inbox) screen
- `app/(tabs)/settings/page.tsx` - Settings screen
- `app/create-dump/page.tsx` - Dump creation flow
- `app/circles/page.tsx` - Circles management screen

### App Store Deployment
- `eas.json` - Expo Application Services build configuration
- `app.json` - Expo app configuration
- `ios/` - iOS native project files (generated by Capacitor)
- `android/` - Android native project files (generated by Capacitor)
- `assets/app-icon.png` - App icon source (1024x1024)
- `assets/splash.png` - Splash screen source
- `assets/screenshots/` - App Store screenshot assets
- `fastlane/Fastfile` - Fastlane automation (optional)
- `fastlane/Appfile` - Fastlane app configuration (optional)

### Notes

**Testing Framework:**
- Use Jest with React Testing Library for component tests
- Use Jest for unit tests on lib/ utilities
- Integration tests should use MSW (Mock Service Worker) for API mocking
- End-to-end tests use Playwright or Detox for mobile

**Architecture Patterns:**
- API routes follow Next.js App Router conventions (app/api/)
- Database operations use Drizzle ORM with Vercel Postgres
- Media uploads go through Vercel Blob storage
- State management uses React Context or Zustand for client state
- Push notifications via Firebase Cloud Messaging (FCM)

**Performance Considerations:**
- Implement virtual scrolling for meme grid (react-window or similar)
- Use Next.js Image component for optimized image loading
- Implement progressive image loading with blur placeholders
- Cache API responses appropriately

**Mobile-Specific:**
- Capacitor plugins needed: Camera, Filesystem, PushNotifications, Share
- Handle platform differences in push notification setup (iOS vs Android)
- Test on physical devices for camera and notification features

---

## Tasks

- [ ] 1.0 Set Up Project Foundation and Database Schema
  - [ ] 1.1 Initialize Next.js project with TypeScript, ESLint, and Tailwind CSS using `npx create-next-app@latest` with App Router enabled
  - [ ] 1.2 Install and configure Capacitor for iOS and Android hybrid app (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`)
  - [ ] 1.3 Create `capacitor.config.ts` with app name "HitPost", bundle ID, and web directory pointing to Next.js output
  - [ ] 1.4 Install Drizzle ORM and Vercel Postgres client (`drizzle-orm`, `@vercel/postgres`, `drizzle-kit`)
  - [ ] 1.5 Create `lib/db/schema.ts` with Users table (id, device_id, email nullable, push_token, created_at)
  - [ ] 1.6 Add Memes table to schema (id, user_id FK, blob_url, file_hash, file_size_bytes, media_type enum, created_at)
  - [ ] 1.7 Add Dumps table to schema (id, sender_id FK, note nullable, sent_at nullable, is_draft boolean, created_at)
  - [ ] 1.8 Add DumpMemes junction table (id, dump_id FK, meme_id FK, order_index)
  - [ ] 1.9 Add DumpRecipients table (id, dump_id FK, name, user_id FK nullable, token unique, claim_code, claimed_at nullable, viewed_at nullable, view_count default 0, recipient_note nullable)
  - [ ] 1.10 Add Reactions table (id, dump_recipient_id FK, meme_id FK, emoji enum, created_at)
  - [ ] 1.11 Add Circles table (id, user_id FK, name, created_at) and CircleMembers table (id, circle_id FK, recipient_name)
  - [ ] 1.12 Create `lib/db/index.ts` to initialize database connection with connection pooling
  - [ ] 1.13 Generate initial database migration using `drizzle-kit generate:pg` and apply with `drizzle-kit push:pg`
  - [ ] 1.14 Install Vercel Blob SDK (`@vercel/blob`) for media storage
  - [ ] 1.15 Create `.env.local` template with POSTGRES_URL, BLOB_READ_WRITE_TOKEN, FIREBASE_CONFIG placeholders
  - [ ] 1.16 Set up project folder structure: `lib/`, `components/`, `app/(tabs)/`, `app/api/`, `public/`
  - [ ] 1.17 Write unit tests for schema validation in `lib/db/schema.test.ts` to verify table relationships and constraints
  - [ ] 1.18 Configure Jest with TypeScript support for testing (`jest.config.js`, `jest.setup.js`)

- [ ] 2.0 Implement Authentication and User Management
  - [ ] 2.1 Create `lib/auth/device-auth.ts` with `getOrCreateDeviceUser()` function that generates UUID device ID on first launch
  - [ ] 2.2 Implement device ID persistence using Capacitor Preferences plugin or localStorage fallback for web
  - [ ] 2.3 Create `app/api/auth/device/route.ts` POST endpoint that accepts device_id and returns or creates user record with JWT token
  - [ ] 2.4 Create `lib/auth/session.ts` with session token storage, retrieval, and refresh logic
  - [ ] 2.5 Implement `AuthProvider` React context in `lib/auth/AuthContext.tsx` to manage auth state across app
  - [ ] 2.6 Create `useAuth()` hook that provides current user, loading state, and auth methods
  - [ ] 2.7 Implement auto-login on app launch in root layout that calls device auth if no session exists
  - [ ] 2.8 Create `lib/auth/email-recovery.ts` with `sendMagicLink()` function for optional email backup
  - [ ] 2.9 Create `app/api/auth/magic-link/route.ts` POST endpoint that generates and emails magic link token
  - [ ] 2.10 Create `app/api/auth/verify-magic-link/route.ts` GET endpoint that validates token and links email to user
  - [ ] 2.11 Create `app/(tabs)/settings/page.tsx` with email input field, save button, and current email display
  - [ ] 2.12 Add push notification token field update endpoint in `app/api/auth/push-token/route.ts`
  - [ ] 2.13 Write unit tests for device auth in `lib/auth/device-auth.test.ts` covering new user creation and existing user retrieval
  - [ ] 2.14 Write unit tests for session management in `lib/auth/session.test.ts` covering token persistence and expiry

- [ ] 3.0 Build Meme Library with Upload and Management
  - [ ] 3.1 Install Capacitor Camera plugin (`@capacitor/camera`) and configure permissions for iOS (NSPhotoLibraryUsageDescription) and Android
  - [ ] 3.2 Create `components/MemeUploader.tsx` with "Upload from Camera Roll" button that opens native image picker with multi-select
  - [ ] 3.3 Create `components/CameraCapture.tsx` with in-app camera interface for capturing photos/videos
  - [ ] 3.4 Create `lib/memes/compression.ts` with `compressImage()` function that reduces images >2MB to 80% JPEG quality, max 1920px width
  - [ ] 3.5 Add `compressVideo()` function in compression.ts that transcodes videos to 720p H.264 at 30fps max using browser/native APIs
  - [ ] 3.6 Create `lib/memes/duplicate-detection.ts` with `calculateFileHash()` using SHA-256 and `checkDuplicate()` database lookup
  - [ ] 3.7 Create `lib/memes/upload.ts` with `uploadMeme()` function that compresses, hashes, checks duplicates, uploads to Vercel Blob, and creates DB record
  - [ ] 3.8 Create `app/api/memes/route.ts` POST endpoint for meme upload that returns meme record with blob URL
  - [ ] 3.9 Create `app/api/memes/route.ts` GET endpoint that returns paginated memes for current user with filter support (all/used/unused)
  - [ ] 3.10 Create `app/api/memes/[id]/route.ts` DELETE endpoint for meme removal (also deletes from Vercel Blob)
  - [ ] 3.11 Create `components/MemeGrid.tsx` with responsive CSS grid layout (3-4 columns based on screen width)
  - [ ] 3.12 Implement lazy loading in MemeGrid using react-window or Intersection Observer for 60fps scrolling with large libraries
  - [ ] 3.13 Add multi-select mode to MemeGrid with tap-to-select, selection count badge, and "Select/Cancel" toggle button
  - [ ] 3.14 Create filter tabs UI in `app/(tabs)/library/page.tsx` with All/Used/Unused options that update meme query
  - [ ] 3.15 Implement duplicate detection dialog that prompts "This meme already exists. Upload anyway?" before proceeding
  - [ ] 3.16 Add pull-to-refresh functionality using native scroll refresh or custom implementation
  - [ ] 3.17 Write unit tests for compression in `lib/memes/compression.test.ts` verifying size reduction and quality preservation
  - [ ] 3.18 Write unit tests for duplicate detection in `lib/memes/duplicate-detection.test.ts` verifying hash calculation and lookup

- [ ] 4.0 Develop Dump Creation and Recipient Management
  - [ ] 4.1 Create `lib/dumps/validation.ts` with validation functions: `validateMemeCount(1-50)`, `validateRecipientCount(1-50)`, `validateNoteLength(max 500 chars)`
  - [ ] 4.2 Create `components/MemeSelector.tsx` that displays selected memes count and grid, inherits from MemeGrid with selection state
  - [ ] 4.3 Create `components/DumpCreationWizard.tsx` with 4-step wizard state machine: SelectMemes > AddNote > AddRecipients > Review
  - [ ] 4.4 Implement Step 1 (SelectMemes) in wizard with MemeSelector, selected count display, and "Next" button (disabled if 0 selected)
  - [ ] 4.5 Implement Step 2 (AddNote) in wizard with optional textarea, character count, and Skip/Next buttons
  - [ ] 4.6 Create `components/RecipientSelector.tsx` with text input for adding recipients by name and list of added recipients with remove button
  - [ ] 4.7 Implement Step 3 (AddRecipients) in wizard with RecipientSelector, recent recipients suggestion list, and Circle quick-add
  - [ ] 4.8 Implement Step 4 (Review) in wizard showing meme thumbnails, note preview, recipient list, and "Send Dump" button
  - [ ] 4.9 Create `lib/dumps/create.ts` with `createDump()` function that creates Dump record and DumpMemes junction records
  - [ ] 4.10 Create `app/api/dumps/route.ts` POST endpoint for creating dump (draft or ready to send)
  - [ ] 4.11 Create `app/api/dumps/[id]/route.ts` GET endpoint for dump details and DELETE for removing drafts
  - [ ] 4.12 Implement draft (Collection) saving by setting is_draft=true and allowing resume from dump ID
  - [ ] 4.13 Create `components/DraftManager.tsx` that lists saved drafts with resume and delete options
  - [ ] 4.14 Create `lib/recipients/manage.ts` with `getRecentRecipients()` that returns unique recipient names from user's sent dumps
  - [ ] 4.15 Create `lib/circles/manage.ts` with CRUD functions: `createCircle()`, `getCircles()`, `updateCircle()`, `deleteCircle()`
  - [ ] 4.16 Create `app/api/circles/route.ts` GET/POST endpoints for circles list and creation
  - [ ] 4.17 Create `app/api/circles/[id]/route.ts` PUT/DELETE endpoints for circle updates and deletion
  - [ ] 4.18 Create `components/CircleManager.tsx` with list of circles, add/edit/delete UI, and member management
  - [ ] 4.19 Create `components/CircleSelector.tsx` for quick-adding all circle members as recipients in dump creation flow
  - [ ] 4.20 Create `app/circles/page.tsx` settings screen for managing circles
  - [ ] 4.21 Write unit tests for dump validation in `lib/dumps/validation.test.ts` covering all limit cases
  - [ ] 4.22 Write unit tests for circles management in `lib/circles/manage.test.ts` covering CRUD operations

- [ ] 5.0 Implement Claim Code System and Push Notifications
  - [ ] 5.1 Create `lib/claim-codes/words.ts` exporting WORD_LIST array with 20 words: VIBE, MEME, DUMP, FIRE, GOLD, EPIC, COOL, HYPE, MOOD, FLEX, YEET, DANK, SPICY, CHEF, GOAT, KING, QUEEN, WILD, PURE, FRESH
  - [ ] 5.2 Create `lib/claim-codes/generate.ts` with `generateClaimCode()` that picks random word + 2 random digits (e.g., VIBE42)
  - [ ] 5.3 Add `generateUniqueClaimCode()` that generates code and verifies uniqueness against DumpRecipients table
  - [ ] 5.4 Create `lib/claim-codes/link.ts` with `generateShareableLink()` that creates unique token (UUID) and returns full URL
  - [ ] 5.5 Create `app/api/dumps/[id]/send/route.ts` POST endpoint that processes recipients: for each NEW recipient (no user_id linked), generate claim code and token; for EXISTING (has user_id), skip code generation
  - [ ] 5.6 Implement sender-recipient relationship detection in send logic: query if recipient name + sender_id has existing user_id linked
  - [ ] 5.7 Create DumpRecipients records with generated claim codes, tokens, and link new recipients to existing user_id if found
  - [ ] 5.8 Create `lib/claim-codes/redeem.ts` with `redeemClaimCode()` that validates code (case-insensitive), links user_id to DumpRecipient, sets claimed_at
  - [ ] 5.9 Create `app/api/claim/route.ts` POST endpoint that accepts claim_code and current user's auth token, calls redeem logic
  - [ ] 5.10 Install Firebase SDK (`firebase`, `@capacitor/push-notifications`) and create `lib/push/firebase.ts` with FCM initialization
  - [ ] 5.11 Create `public/firebase-messaging-sw.js` service worker for web push notifications
  - [ ] 5.12 Create `lib/push/tokens.ts` with `requestPushPermission()` and `savePushToken()` functions
  - [ ] 5.13 Create `app/api/push/register/route.ts` POST endpoint that saves push token to user record
  - [ ] 5.14 Create `lib/push/send.ts` with `sendPushNotification()` that sends FCM message with title, body, and data payload
  - [ ] 5.15 Integrate push notification sending into `/api/dumps/[id]/send/route.ts`: after creating DumpRecipients, send push to recipients with user_id and push_token
  - [ ] 5.16 Implement push notification content: "New meme dump from [sender_name]!" with meme count in body
  - [ ] 5.17 Create push notification handler in app that navigates to Activity tab on notification tap
  - [ ] 5.18 Write unit tests for claim code generation in `lib/claim-codes/generate.test.ts` verifying format and uniqueness
  - [ ] 5.19 Write unit tests for claim code redemption in `lib/claim-codes/redeem.test.ts` covering valid/invalid codes and linking
  - [ ] 5.20 Write unit tests for push sending in `lib/push/send.test.ts` mocking FCM API calls

- [ ] 6.0 Create Web Viewer and In-App Dump Viewer
  - [ ] 6.1 Create `app/view/[token]/page.tsx` as public page (no auth required) that fetches dump data by recipient token
  - [ ] 6.2 Create `app/api/view/[token]/route.ts` GET endpoint that returns dump memes, sender name, claim code, and increments view_count
  - [ ] 6.3 Create `lib/view/tracking.ts` with `recordView()` that sets first viewed_at on first access and increments view_count
  - [ ] 6.4 Create `components/WebDumpViewer.tsx` displaying meme grid optimized for mobile web browsers
  - [ ] 6.5 Create `components/ClaimCodeBanner.tsx` with large, bold claim code display, copy button, and install instructions text
  - [ ] 6.6 Add App Store and Play Store badge links to ClaimCodeBanner (use placeholder URLs until app is live)
  - [ ] 6.7 Create `app/view/[token]/layout.tsx` with minimal header showing "HitPost" branding and responsive viewport
  - [ ] 6.8 Add meta tags for social sharing (og:image, og:title) using first meme as preview image
  - [ ] 6.9 Create `components/DumpViewer.tsx` for in-app viewing with grid layout and tap-to-open fullscreen
  - [ ] 6.10 Create `components/FullscreenSlideshow.tsx` with swipe navigation, pinch-to-zoom, and close button
  - [ ] 6.11 Implement swipe gestures using touch events or react-swipeable for natural slideshow navigation
  - [ ] 6.12 Create `components/ReactionBar.tsx` with 4 emoji buttons: thumbs up, thumbs down, heart, laugh (fixed at bottom of slideshow)
  - [ ] 6.13 Create `app/api/reactions/route.ts` POST endpoint that creates Reaction record (one per user per meme)
  - [ ] 6.14 Create `components/RecipientNote.tsx` with textarea for leaving note at end of slideshow viewing
  - [ ] 6.15 Create `app/api/dumps/[id]/note/route.ts` PUT endpoint that saves recipient_note to DumpRecipient record
  - [ ] 6.16 Implement viewed_at timestamp update on first in-app dump open via API call
  - [ ] 6.17 Write unit tests for view tracking in `lib/view/tracking.test.ts` verifying first view and increment logic
  - [ ] 6.18 Write component tests for DumpViewer in `components/DumpViewer.test.tsx` testing grid and slideshow modes

- [ ] 7.0 Build Activity Feed, History, and Analytics
  - [ ] 7.1 Create `app/api/activity/route.ts` GET endpoint returning received dumps for current user (via DumpRecipients where user_id matches)
  - [ ] 7.2 Order activity results by created_at descending and include sender name, meme count, viewed status
  - [ ] 7.3 Create `components/ActivityFeed.tsx` with list of received dumps showing sender avatar placeholder, name, meme count, and new/viewed badge
  - [ ] 7.4 Style unread dumps (viewed_at is null) with bold text and blue indicator dot
  - [ ] 7.5 Create `components/ClaimCodeEntry.tsx` with "Got a code?" button that opens modal with code input field
  - [ ] 7.6 Implement claim code submission in ClaimCodeEntry that calls /api/claim and refreshes activity feed on success
  - [ ] 7.7 Add error handling for invalid claim codes with user-friendly error message display
  - [ ] 7.8 Create `app/(tabs)/activity/page.tsx` with ActivityFeed and ClaimCodeEntry floating button
  - [ ] 7.9 Create `app/api/history/route.ts` GET endpoint returning sent dumps for current user (via Dumps where sender_id matches)
  - [ ] 7.10 Include statistics in history response: total recipients, viewed count, claimed count, total reactions
  - [ ] 7.11 Create `components/HistoryView.tsx` with list of sent dumps showing meme thumbnails, recipient count, and stats summary
  - [ ] 7.12 Create `components/DumpStats.tsx` showing detailed per-dump statistics: X/Y viewed, X/Y claimed, reaction breakdown
  - [ ] 7.13 Implement expandable recipient list in DumpStats showing each recipient's status: pending (gray), viewed (blue), claimed (green)
  - [ ] 7.14 Create `app/(tabs)/dumps/page.tsx` with two sections: Drafts (saved collections) and Sent (history with stats)
  - [ ] 7.15 Add pull-to-refresh on Activity and History lists
  - [ ] 7.16 Implement push notification sending to senders when recipients view their dump (call from view tracking logic)
  - [ ] 7.17 Write unit tests for ActivityFeed in `components/ActivityFeed.test.tsx` testing render and status display
  - [ ] 7.18 Write integration tests for activity and history API endpoints using MSW for mocking

- [ ] 8.0 Configure App Store and Play Store Deployment
  - [ ] 8.1 Create Apple Developer Account ($99/year) if not already enrolled, and set up App Store Connect with HitPost app record
  - [ ] 8.2 Create Google Play Developer Account ($25 one-time) if not already enrolled, and create HitPost app in Google Play Console
  - [ ] 8.3 Install Expo CLI and EAS CLI globally (`npm install -g expo-cli eas-cli`) for build automation
  - [ ] 8.4 Initialize EAS in project with `eas init` and create `eas.json` with build profiles for development, preview, and production
  - [ ] 8.5 Configure `app.json` (or `app.config.js`) with app name "HitPost", slug, version, iOS bundleIdentifier, Android package name
  - [ ] 8.6 Generate iOS distribution certificate and provisioning profile in Apple Developer portal, download and configure in EAS
  - [ ] 8.7 Generate Android upload key (keystore) for Play Store signing using `keytool` and configure in `eas.json` credentials
  - [ ] 8.8 Create app icon source file `assets/app-icon.png` at 1024x1024px with HitPost branding
  - [ ] 8.9 Create splash screen source `assets/splash.png` with HitPost logo centered on brand color background
  - [ ] 8.10 Configure icon and splash in `app.json` pointing to asset files, set splash resizeMode and backgroundColor
  - [ ] 8.11 Run `eas build --platform ios --profile production` to create iOS production build (IPA file)
  - [ ] 8.12 Run `eas build --platform android --profile production` to create Android production build (AAB file)
  - [ ] 8.13 Prepare App Store listing metadata: app name, subtitle, description (up to 4000 chars), keywords, category (Social Networking)
  - [ ] 8.14 Prepare Play Store listing metadata: short description (80 chars), full description (4000 chars), category (Social)
  - [ ] 8.15 Create 5-8 App Store screenshots for iPhone 6.7" display (1290x2796) and 5.5" (1242x2208) showing key app flows
  - [ ] 8.16 Create 5-8 Play Store screenshots for phone (1080x1920 or 9:16 aspect) showing same key app flows
  - [ ] 8.17 Write App Store privacy policy URL and prepare privacy nutrition labels (data collection disclosure)
  - [ ] 8.18 Configure age rating questionnaire for both stores (likely 4+ / Everyone)
  - [ ] 8.19 Upload iOS build to App Store Connect via EAS Submit or Transporter, complete app information forms
  - [ ] 8.20 Set up TestFlight for iOS beta testing: add internal testers (up to 100), configure beta app description
  - [ ] 8.21 Distribute TestFlight build to internal testers and collect feedback on core flows
  - [ ] 8.22 Upload Android build to Play Console via EAS Submit or manual upload, complete store listing
  - [ ] 8.23 Set up Internal Testing track in Play Console: add tester email list, configure release notes
  - [ ] 8.24 Promote to Closed Testing track for wider beta testing (up to 500 testers) before production
  - [ ] 8.25 Review and address any App Store Review rejection feedback (common: missing demo account, privacy policy issues)
  - [ ] 8.26 Review and address any Play Store policy compliance issues (common: permissions justification, content policy)
  - [ ] 8.27 Submit iOS app for App Store Review (allow 1-7 days for review process)
  - [ ] 8.28 Submit Android app for Play Store Review (allow 1-3 days for review process)
  - [ ] 8.29 Configure release automation with EAS Update for over-the-air JavaScript updates post-launch
  - [ ] 8.30 Document release process in DEPLOYMENT.md including version bumping, changelog, and submission steps
