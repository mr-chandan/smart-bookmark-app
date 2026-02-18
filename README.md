# Smart Bookmark App

A real-time bookmark manager with Google OAuth. Save bookmarks, search them, and watch them sync across tabs instantly.

**Built with:** Next.js 16 · React 19 · Supabase · Tailwind CSS v4 · Vercel

## Problems I Faced & How I Fixed Them

### Supabase Realtime wasn't syncing new bookmarks across tabs

The WebSocket connection showed `SUBSCRIBED` (healthy), but INSERT events never arrived in the other tab — only deletes worked. After debugging replication settings and RLS policies with no luck, I added the browser's **BroadcastChannel API** as a second sync layer. Now when a bookmark is added or deleted, it broadcasts to all open tabs directly. Both mechanisms run in parallel, and state updates deduplicate by ID so nothing doubles up.

### Middleware crashed on Vercel (`MIDDLEWARE_INVOCATION_FAILED`)

Everything worked locally but returned 500 on Vercel. The middleware used `process.env.NEXT_PUBLIC_SUPABASE_URL!` — the `!` assertion hides `undefined` when env vars aren't configured in the Vercel dashboard, and the Supabase client throws at runtime inside the Edge function. Fixed by adding an early return guard when env vars are missing.

### Next.js 16 deprecated `middleware.ts`

Next.js 16 renamed the file convention from `middleware.ts` to `proxy.ts` and the export from `middleware()` to `proxy()`. A simple rename fixed the deprecation warning.

## Quick Start

```bash
npm install
# Add your Supabase URL and anon key to .env.local
npm run dev
```

## What I'd Do Next

- Folders/tags for organizing bookmarks
- Bulk import from browser bookmark bar
- Keyboard shortcuts (`Ctrl+K` to search, `Ctrl+N` to add)
