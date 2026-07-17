# Sales Task Manager

A simple, sales-focused task manager. Track leads, follow-ups and deals — with
client name, deal value, priority, status (Lead → Contacted → Proposal →
Won/Lost) and follow-up dates. Built with **Next.js** and deployed on
**Vercel**, with **Supabase** (Postgres) as the backend.

## Features

- Add tasks with client/company, deal value, priority, status, follow-up date and notes
- Mark tasks done, delete tasks, search and filter by status
- Live dashboard: open tasks, pipeline value, won value
- Overdue follow-ups are highlighted
- No login — open the link and start using it

## Tech stack

| Layer      | Tech                          |
| ---------- | ----------------------------- |
| Frontend   | Next.js 14 (App Router), React, TypeScript |
| Backend/DB | Supabase (Postgres + REST)    |
| Hosting    | Vercel                        |

## Environment variables

Create a `.env.local` file (copy from `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://bniwgbwkwqqgoptcqdqu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_i7VeWNHcvtbiu8-xTGN0EA_G5-ECGOv
```

These are **public** keys and are safe to expose in the browser. On Vercel, add
the same two variables under **Project → Settings → Environment Variables**.

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

## Database

The app uses a single table, `sales_tasks`, defined in
`supabase/migrations/0001_init_sales_tasks.sql`. It's already created in the
Supabase project. To recreate it elsewhere, run that SQL in the Supabase SQL
editor.

### A note on security (no-login mode)

Because you chose a no-login app, the table's row-level security policies allow
the public key to read and write everything. That means **anyone who has the
site URL can view, add and delete tasks.** This is fine for personal or
internal use. If you later want private, per-user tasks, add Supabase Auth and
tighten the policies to `auth.uid()` — happy to add that when you need it.

## Deploy to Vercel

1. Push this repo to GitHub (already done on branch
   `claude/task-manager-vercel-supabase-9rwoox`).
2. In Vercel, **Add New Project** → import this repository.
3. Add the two environment variables above.
4. Deploy. Vercel auto-detects Next.js — no extra config needed.
