# Contributing to Alpha

## Local setup

1. Install Node.js 20.9+.
2. Clone the repository.
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local` and add Supabase project values when database features are needed.
5. Run `npm run dev`.

## Branches

Use short descriptive branches such as `feat/health-dashboard`, `fix/session-refresh`, or `docs/setup`.

## Commits

Use Conventional Commits, for example `feat: add user profile` or `fix: handle missing session`.

## Before opening a pull request

Run `npm run format`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Pull requests should explain the change, include relevant tests, avoid unrelated edits, and call out breaking changes.

## Code quality

Prefer small modules, explicit types, accessible UI, server-side secret handling, and tests for behavior rather than implementation details.
