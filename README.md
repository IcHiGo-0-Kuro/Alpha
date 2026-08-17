# Alpha

A scheduled-access application built on Next.js, TypeScript, and Supabase.

[![CI](https://github.com/IcHiGo-0-Kuro/Alpha/actions/workflows/ci.yml/badge.svg)](https://github.com/IcHiGo-0-Kuro/Alpha/actions/workflows/ci.yml)

> **You don't manually lock your apps. You schedule when they are available.**

## Product status

Alpha now contains the real web control-plane foundation for time-based app access: authentication, persistent schedules, a deterministic time-zone-aware schedule engine, live countdowns, app-target records, RLS, and tests.

The current repository is a web application. A browser **cannot** discover arbitrary installed Android/iOS applications or stop them from launching, so Alpha intentionally does not fake OS-level locking. Actual installed-app enforcement belongs in a native Android provider/client. See [`docs/native-android.md`](docs/native-android.md).

## Features

- Next.js App Router + strict TypeScript
- Supabase email/password authentication
- Supabase PostgreSQL persistence with Row Level Security
- Schedule fields: apps, unlock time, duration, repeat rule, time zone, enabled state
- Daily, weekday, weekend, and custom-day repetition
- Cross-midnight access windows
- Live Restricted/Available status and countdown
- Schedule creation, editing, enabling/disabling, and deletion
- Platform-neutral `AppProvider` abstraction
- Browser-safe app-target UI using names/package identifiers
- Deterministic Vitest coverage for scheduling behavior
- ESLint, Prettier, and GitHub Actions CI
- Vercel + Supabase free-tier deployment path

## Architecture

```text
UI (Next.js)
    ↓
Dashboard state
    ↓
ScheduleEngine (pure time calculation)
    ↓
Supabase auth + PostgreSQL + RLS
    ↓
AppProvider abstraction
    ↓
Native Android enforcement (future)
```

The existing repository architecture was preserved: Next.js remains the web/server boundary and Supabase remains the managed data/auth layer. Product logic is isolated from React components where practical.

## Database

Apply `supabase/migrations/20260817_scheduled_access.sql` to your Supabase project. It creates:

- `schedules`
- `app_targets`
- `schedule_apps`
- ownership indexes, constraints, timestamps, and RLS policies

Every mutable table is scoped to `auth.uid()` so a user cannot read or modify another user's schedules or app targets.

## Local development

Prerequisites: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
```

Configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Then:

```bash
npm run dev
```

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment

The intended free web deployment is Vercel. Import this repository, configure the same two public Supabase environment variables, and deploy `main`.

For genuine Android app restriction, the native client must be added separately. It should synchronize schedules, evaluate them locally so browser/network availability is not a single point of failure, and use Android's supported access-control/app-management capabilities. The web app should remain the account and scheduling control plane.

## Security

Never commit `.env.local`, Supabase service-role keys, passwords, private keys, or other credentials. The browser uses only the public Supabase key and relies on database RLS for ownership enforcement.

See [`SECURITY.md`](SECURITY.md) for reporting guidance.

## License

MIT — see [`LICENSE`](LICENSE).
