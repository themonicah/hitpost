# Task List: HitPost - Meme Dump Sharing App

**PRD Source:** `/Users/monicaharvancik/Projects/HitPost/tasks/0001-prd-hitpost-app.md`
**Generated:** 2026-01-09
**Last Updated:** 2026-01-09
**Status:** In Progress

---

## Relevant Files

### Project Configuration
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `capacitor.config.ts` - Capacitor configuration for iOS/Android
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Environment variables (local development)

### Database
- `src/lib/db.ts` - Database operations (raw SQL with @vercel/postgres)
- `src/app/api/dev/migrate/route.ts` - Database migrations

### Authentication
- `src/lib/auth.ts` - Session management and device auth
- `src/components/AutoLogin.tsx` - Auto-login component for new users
- `src/app/api/auth/device/route.ts` - Device authentication API endpoint
- `src/app/api/auth/session/route.ts` - Session check endpoint

### Meme Library
- `src/app/api/memes/route.ts` - Meme CRUD API endpoints
- `src/app/api/memes/[id]/route.ts` - Individual meme operations
- `src/components/MemeGrid.tsx` - Responsive meme grid component
- `src/components/MemeUploader.tsx` - Upload interface component

### Dump Creation
- `src/app/api/dumps/route.ts` - Dump creation API endpoint
- `src/app/api/dumps/[dumpId]/route.ts` - Individual dump operations
- `src/app/api/dumps/[dumpId]/send/route.ts` - Send dump to recipients
- `src/components/SendDumpModal.tsx` - Send flow modal
- `src/components/AddToDumpModal.tsx` - Add memes to dump modal
- `src/components/DumpCreator.tsx` - Dump creation flow

### Recipient Management
- `src/app/api/groups/route.ts` - Groups (Circles) API endpoint
- `src/app/api/groups/[id]/route.ts` - Individual group operations
- `src/app/api/groups/[id]/members/route.ts` - Group members

### Claim Code System
- `src/lib/db.ts` - Contains `generateClaimCode()`, `findClaimedRecipientByName()`, `createLinkedRecipient()`
- `src/app/api/claim/route.ts` - Claim code redemption endpoint
- `src/components/ClaimCodeButton.tsx` - "Got a code?" interface

### Web Viewer
- `src/app/view/[token]/page.tsx` - Public web viewer page (recipient-specific)
- `src/app/view/[token]/ViewDumpContent.tsx` - Web viewer component with cover/slideshow/grid
- `src/app/d/[token]/page.tsx` - Public dump landing page (share link)

### In-App Dump Viewer
- `src/components/MemeViewer.tsx` - In-app meme viewer with slideshow
- `src/components/Slideshow.tsx` - Fullscreen meme slideshow
- `src/app/api/reactions/route.ts` - Reactions API endpoint
- `src/app/api/recipient-note/route.ts` - Recipient note endpoint

### Activity Feed & History
- `src/app/activity/page.tsx` - Activity (Inbox) screen
- `src/app/api/activity/route.ts` - Activity feed API endpoint
- `src/components/ActivityDetailDrawer.tsx` - Activity detail view

### App Screens
- `src/app/page.tsx` - Home screen
- `src/app/HomeContent.tsx` - Main library content
- `src/app/layout.tsx` - Root layout
- `src/components/AppShell.tsx` - App shell with navigation
- `src/components/DumpsBar.tsx` - Bottom bar showing dumps

---

## Tasks

### 1.0 Set Up Project Foundation and Database Schema
- [x] 1.1 Initialize Next.js project with TypeScript, ESLint, and Tailwind CSS
- [x] 1.2 Install and configure Capacitor for iOS and Android hybrid app
- [x] 1.3 Create `capacitor.config.ts` with app configuration
- [x] 1.4 Set up Vercel Postgres connection
- [x] 1.5 Create Users table (id, device_id, email nullable, created_at)
- [x] 1.6 Create Memes table (id, user_id, file_url, file_type, created_at)
- [x] 1.7 Create Dumps table (id, sender_id, note, is_draft, share_token, created_at)
- [x] 1.8 Create DumpMemes junction table
- [x] 1.9 Create DumpRecipients table with claim_code, viewed_at, etc.
- [x] 1.10 Create Reactions table
- [x] 1.11 Create Groups and GroupMembers tables (Circles)
- [x] 1.12 Create database operations in `src/lib/db.ts`
- [x] 1.13 Set up Vercel Blob for media storage
- [x] 1.14 Configure environment variables

### 2.0 Implement Authentication and User Management
- [x] 2.1 Create device-based auth that generates UUID device ID on first launch
- [x] 2.2 Implement device ID persistence using localStorage
- [x] 2.3 Create `/api/auth/device` POST endpoint
- [x] 2.4 Create session management in `src/lib/auth.ts`
- [x] 2.5 Implement `AutoLogin` component for seamless onboarding
- [x] 2.6 Implement auto-login on app launch
- [ ] 2.7 Create email backup/recovery flow (optional feature)
- [ ] 2.8 Create Settings page with email backup option

### 3.0 Build Meme Library with Upload and Management
- [x] 3.1 Create `MemeUploader.tsx` with camera roll upload
- [x] 3.2 Create `/api/memes` POST endpoint for upload to Vercel Blob
- [x] 3.3 Create `/api/memes` GET endpoint for listing user's memes
- [x] 3.4 Create `/api/memes/[id]` DELETE endpoint
- [x] 3.5 Create `MemeGrid.tsx` with responsive grid layout
- [x] 3.6 Add multi-select mode to MemeGrid with selection count
- [ ] 3.7 Implement image compression before upload (>2MB → 80% JPEG, max 1920px)
- [ ] 3.8 Implement video compression (720p max)

### 4.0 Develop Dump Creation and Recipient Management
- [x] 4.1 Create meme selection flow with multi-select
- [x] 4.2 Create `SendDumpModal.tsx` with recipient selection
- [x] 4.3 Create `/api/dumps` POST endpoint for creating dumps
- [x] 4.4 Create `/api/dumps/[id]` GET endpoint for dump details
- [x] 4.5 Implement draft saving (is_draft=true)
- [x] 4.6 Create `DumpsBar.tsx` for showing draft dumps
- [x] 4.7 Create Groups (Circles) CRUD: `/api/groups`
- [x] 4.8 Create group member management: `/api/groups/[id]/members`
- [x] 4.9 Implement circle selection in send flow
- [x] 4.10 Show expandable group members in SendDumpModal

### 5.0 Implement Claim Code System and Push Notifications
- [x] 5.1 Create claim code word list (VIBE, MEME, DUMP, etc.)
- [x] 5.2 Create `generateClaimCode()` function (WORD + 2 digits)
- [x] 5.3 Create `/api/dumps/[id]/send` endpoint with claim code generation
- [x] 5.4 Implement sender-recipient relationship detection ("claim once, push forever")
- [x] 5.5 Create `findClaimedRecipientByName()` for detecting existing connections
- [x] 5.6 Create `createLinkedRecipient()` for connected recipients
- [x] 5.7 Create `/api/claim` POST endpoint for claim code redemption
- [x] 5.8 Create `ClaimCodeButton.tsx` with modal for code entry
- [ ] 5.9 Install Firebase SDK for push notifications
- [ ] 5.10 Create Firebase service worker
- [ ] 5.11 Implement push token storage and permission request
- [ ] 5.12 Create `sendPushNotification()` function with FCM
- [ ] 5.13 Send push notifications to connected recipients on new dump
- [ ] 5.14 Create push notification handler for navigation

### 6.0 Create Web Viewer and In-App Dump Viewer
- [x] 6.1 Create `/view/[token]/page.tsx` for recipient-specific view
- [x] 6.2 Create `ViewDumpContent.tsx` with cover sheet, slideshow, grid views
- [x] 6.3 Display claim code prominently on all views
- [x] 6.4 Add app download upsell banner with claim code
- [x] 6.5 Create `/d/[token]` for shareable dump links
- [x] 6.6 Create `MemeViewer.tsx` for in-app viewing
- [x] 6.7 Create `Slideshow.tsx` with swipe navigation
- [x] 6.8 Create reaction bar with emoji buttons
- [x] 6.9 Create `/api/reactions` POST endpoint
- [x] 6.10 Create recipient note input
- [x] 6.11 Create `/api/recipient-note` POST endpoint
- [x] 6.12 Implement viewed_at timestamp update on first view
- [ ] 6.13 Add meta tags for social sharing (og:image)

### 7.0 Build Activity Feed, History, and Analytics
- [x] 7.1 Create `/api/activity` GET endpoint for received dumps
- [x] 7.2 Create `/activity/page.tsx` with activity feed
- [x] 7.3 Create `ActivityDetailDrawer.tsx` for dump details
- [x] 7.4 Style unread dumps with indicator
- [x] 7.5 Add "Got a code?" button with ClaimCodeButton
- [x] 7.6 Create `/api/dumps` GET for sent dumps (history)
- [ ] 7.7 Create detailed history view with per-recipient stats
- [ ] 7.8 Show recipient status: pending/viewed/claimed
- [ ] 7.9 Implement push notification when recipient views dump

### 8.0 Configure App Store and Play Store Deployment
- [ ] 8.1 Create Apple Developer Account
- [ ] 8.2 Create Google Play Developer Account
- [ ] 8.3 Configure EAS for builds
- [ ] 8.4 Create app icon (1024x1024)
- [ ] 8.5 Create splash screen
- [ ] 8.6 Build iOS production IPA
- [ ] 8.7 Build Android production AAB
- [ ] 8.8 Prepare App Store metadata and screenshots
- [ ] 8.9 Prepare Play Store metadata and screenshots
- [ ] 8.10 Set up TestFlight for iOS beta
- [ ] 8.11 Set up Internal Testing for Android beta
- [ ] 8.12 Submit to App Store Review
- [ ] 8.13 Submit to Play Store Review

---

## Summary

### Completed
- Project setup and database schema
- Device-based authentication
- Meme library with upload, grid, multi-select
- Dump creation with recipients by name
- Circles (groups) management
- Claim code system (generation and redemption)
- "Claim once, push forever" logic
- Web viewer with cover sheet, slideshow, grid, and claim code display
- In-app viewer with reactions and notes
- Activity feed

### In Progress
- Push notifications (logged but not sent via FCM)

### Not Started
- Image/video compression
- Email backup/recovery
- Detailed history stats
- App Store/Play Store deployment
