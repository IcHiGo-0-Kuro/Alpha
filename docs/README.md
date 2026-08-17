# Alpha documentation

## Architecture

Alpha uses Next.js App Router as the application boundary. UI lives under `src/app`, shared runtime configuration under `src/lib`, and Supabase access is isolated behind dedicated clients. This keeps product code independent from infrastructure details.

## Development

Use `npm ci` for reproducible installs. Run `npm run dev` for local development. Quality checks are available as npm scripts and are enforced by GitHub Actions.

## Deployment

The intended deployment target is Vercel's free tier. Connect the GitHub repository to a Vercel project, select the `main` branch, and configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.

## API

`GET /api/health` returns a small JSON health response and can be used by external monitoring or smoke tests.
