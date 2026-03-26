# W€spr - European Super App

## Overview

W€spr is a mobile-first "super app" prototype inspired by WeChat, designed for the European market. It combines messaging, social media (Moments), a digital wallet (W€spr Pay), contacts management, QR code scanning, and a services/discovery ecosystem into a single application. The UI uses Dutch language ("nl-NL") for most user-facing text and is presented in a phone-frame container on desktop for a native app feel.

The app follows a full-stack TypeScript architecture with a React frontend (Vite), Express backend, PostgreSQL database with Drizzle ORM, and TanStack React Query for data fetching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled with Vite
- **Routing**: Uses `wouter` for lightweight client-side routing. The app primarily runs as a single-page app with one route (`/`) — the `Home` component manages internal navigation via tab state and overlay screens (chat view, scanner, wallet, etc.) rather than URL-based routing
- **State Management**: Local React state for UI navigation (active tab, open chat, active tool). Server state managed via TanStack React Query with infinite stale time and no automatic refetching
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives, styled with Tailwind CSS v4 and CSS variables for theming
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Styling**: Tailwind CSS with a custom "Nordic Minimalist" light theme using HSL CSS variables. Custom fonts: Inter (body) and Outfit (headings)
- **Responsive Design**: On mobile (below `lg` breakpoint), the app shows a full-screen mobile layout with bottom tab navigation. On desktop (`lg` and above), a sidebar navigation (`SideNav.tsx`) replaces the bottom nav, and content fills the full width. Uses `pb-safe` for safe area insets on mobile

### Key Frontend Components
- `Home.tsx` — Main shell with separate mobile and desktop layouts. **Mobile**: full-screen overlays for ChatView, Scanner, etc. replace the content. **Desktop (lg:)**: master-detail split view for Chats/Contacts tabs (340-380px list panel on left, detail panel on right, like WhatsApp Web). For Discover/Profile, content fills full width. Overlays on desktop render in the detail panel, keeping the list visible
- `ChatList.tsx` / `ChatView.tsx` — Messaging interface with real-time polling (3s interval)
- `Contacts.tsx` — Contact list grouped alphabetically
- `Discover.tsx` — Multi-view discovery section with sub-screens (Moments feed, services, transport, health, food, events, games, mini apps). On desktop, uses CategoryCard grid (2-3 columns) instead of list items for categories. Service grids are responsive (3-5 columns)
- `Profile.tsx` — User profile and settings
- `AuraPay.tsx` — Digital wallet with balance display and transaction history
- `Scanner.tsx` — Mock QR code scanner
- `BottomNav.tsx` — iOS-style bottom tab navigation (hidden on desktop via `lg:hidden`)
- `SideNav.tsx` — Desktop sidebar navigation (hidden on mobile via `hidden lg:flex`)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx` in development
- **API Design**: RESTful JSON API under `/api/*` prefix
- **Authentication**: Email/password auth with bcrypt hashing, express-session (connect-pg-simple store), session cookie (30-day maxAge). Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`. `getCurrentUser(req)` reads `req.session.userId`.
- **Key Endpoints**:
  - `GET/PATCH /api/me` — Current user (session-based, returns 401 if not logged in, password excluded from response)
  - `GET /api/users` — All users
  - `GET/POST/DELETE /api/contacts` — Contact management
  - `GET /api/chats`, `GET/POST /api/chats/:id/messages` — Chat and messaging
  - `GET/POST /api/posts`, `POST /api/posts/:id/like`, `DELETE /api/posts/:id/like`, `POST /api/posts/:id/comments` — Social feed (Moments)
  - `GET/POST /api/transactions` — Wallet transactions
  - `PATCH /api/transactions/:id/receipt` — Update receipt data (OCR scan results)
- **Authentication**: Currently simplified — no real auth system. Uses a hardcoded "me" username lookup. The codebase includes `express-session` and `passport` dependencies suggesting future auth implementation
- **Dev Server**: Vite dev server middleware integrated into Express via `server/vite.ts` for HMR in development
- **Production**: Static files served from `dist/public` with SPA fallback

### Data Storage
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema** (in `shared/schema.ts`):
  - `users` — id (UUID), username, password, displayName, auraId, avatar, bio, walletBalance (integer, cents)
  - `contacts` — userId → contactId relationship
  - `chats` — id, isGroup, name, avatar, isOfficial
  - `chatMembers` — chatId → userId join table
  - `messages` — chatId, senderId, content, sentAt
  - `posts` — userId, content, image, createdAt
  - `postLikes` — postId → userId
  - `postComments` — postId, userId, content
  - `transactions` — userId, type, amount, description, receiptData (JSON text with merchant info, line items, VAT, notes)
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database
- **Connection**: Uses `pg.Pool` directly with Drizzle

### Build System & Runtime
- **Development**: `npm run dev` runs the Express server with Vite middleware via `tsx` (not used in workflow due to SIGHUP stability issues)
- **Production Build**: `npm run build` runs a custom script (`script/build.ts`) that:
  1. Builds the client with Vite (output: `dist/public`)
  2. Builds the server with esbuild (output: `dist/index.cjs`), bundling common dependencies while externalizing others
- **Production Start**: `npm start` runs `node dist/index.cjs`
- **Workflow**: Uses `keepalive.sh` wrapper that runs production build (`node dist/index.cjs`) in a restart loop. Must run `npm run build` before starting the workflow to pick up code changes.

### Performance Optimizations
- **Gzip compression** via `compression` middleware — reduces transfer sizes ~70% (e.g., JS bundle from 895KB to 262KB)
- **Immutable asset caching** — hashed files in `/assets` get `Cache-Control: max-age=1y, immutable` headers
- **Static file caching** — non-hashed static files cached for 1 hour with ETags
- **HTML no-cache** — `index.html` served with `no-cache` to ensure fresh builds are always picked up

### Stability Notes
- The Replit workflow system sends SIGHUP to processes after ~30-60 seconds. The Node server registers a `process.on("SIGHUP", () => {})` handler to ignore this signal and prevent crashes.
- Vite dev server mode is unstable in the workflow because esbuild child processes get killed by SIGHUP. Production mode (pre-built static files) is used instead.
- The `keepalive.sh` script traps SIGHUP and auto-restarts the server if it exits unexpectedly.

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable. Uses `pg` (node-postgres) driver with connection pooling

### Key NPM Packages
- **Frontend**: React, Vite, TanStack React Query, wouter, Framer Motion, shadcn/ui (Radix UI + Tailwind CSS), react-hook-form, recharts, embla-carousel, react-day-picker, vaul (drawer), cmdk (command palette), input-otp, tesseract.js (OCR), jsPDF (PDF generation)
- **Backend**: Express 5, Drizzle ORM, drizzle-zod, connect-pg-simple (session store), passport/passport-local (not yet wired up), express-session, nanoid
- **Shared**: Zod (validation), date-fns

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Development tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Development banner (dev only)
- Custom `vite-plugin-meta-images` — Auto-updates OpenGraph meta tags with Replit deployment URL

### External Services (Dependencies Present but Not Yet Integrated)
- **Stripe** — Payment processing (dependency exists)
- **OpenAI / Google Generative AI** — AI capabilities (dependencies exist)
- **Nodemailer** — Email sending (dependency exists)
- These are included in the build allowlist but don't appear to be actively used in the current codebase