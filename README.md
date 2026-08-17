# Alpha

A production-ready application foundation built with Next.js, TypeScript, and Supabase.

[![CI](https://github.com/IcHiGo-0-Kuro/Alpha/actions/workflows/ci.yml/badge.svg)](https://github.com/IcHiGo-0-Kuro/Alpha/actions/workflows/ci.yml)

## Status

**Foundation / early development.** The application shell, health endpoint, Supabase integration boundary, testing, documentation, and CI are in place. Product-specific features will be added as requirements are defined.

## Features

- Next.js App Router application
- Strict TypeScript configuration
- Supabase browser/server clients isolated under `src/lib`
- Health endpoint at `/api/health`
- Vitest + Testing Library test setup
- ESLint and Prettier
- GitHub Actions quality pipeline
- Dependabot dependency updates
- Secret-safe environment configuration

## Tech stack

- TypeScript
- Next.js
- React
- Supabase PostgreSQL and client libraries
- Vitest + Testing Library
- ESLint + Prettier
- Vercel for the intended free-tier deployment

## Architecture

The project deliberately avoids a separate backend service. Next.js provides the web and server boundary, while Supabase provides managed PostgreSQL and future authentication/storage capabilities. Infrastructure-specific code is kept behind small modules so product features can evolve without spreading database configuration throughout the UI.

```text
src/
├── app/                 # App Router pages, layout, and route handlers
│   └── api/health/      # Liveness endpoint
└── lib/
    ├── env.ts           # Environment validation
    └── supabase/        # Browser/server Supabase clients

tests/                   # Automated tests
.github/                 # CI, Dependabot, issue and PR configuration
docs/                    # Project documentation
```

## Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project for database-backed features

## Installation

```bash
npm install
cp .env.example .env.local
```

Add your Supabase project values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Never commit `.env.local`, service-role keys, passwords, private keys, or other credentials.

## Development

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests interactively |
| `npm run lint` | Run ESLint |
| `npm run format` | Format source files |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | Run TypeScript checks |
| `npm run clean` | Remove generated build/test output |

## API

### Health check

`GET /api/health`

Example response:

```json
{"status":"ok","service":"alpha"}
```

## Deployment

The intended free deployment is Vercel. Import the GitHub repository into a Vercel project and deploy the `main` branch. Configure the same Supabase environment variables in the Vercel project settings.

No Docker configuration is included because a separate container layer is unnecessary for the selected deployment architecture.

## Troubleshooting

**The app fails because Supabase variables are missing:** copy `.env.example` to `.env.local` and provide the values from your Supabase project settings. Pages that do not instantiate the Supabase client can still be developed independently.

**Dependencies are inconsistent:** remove `node_modules` and reinstall with `npm install`.

**CI fails on formatting or linting:** run `npm run format`, then `npm run lint` locally and commit the resulting fixes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branch naming, commits, testing, and pull request expectations.

## Security

See [SECURITY.md](SECURITY.md). Never expose a Supabase service-role key to browser code.

## License

Alpha is licensed under the MIT License. See [LICENSE](LICENSE).

## Maintainer

Maintained by [IcHiGo-0-Kuro](https://github.com/IcHiGo-0-Kuro).
