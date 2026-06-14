# Phase 8 Launch Plan: Vercel, Supabase, and Railway

## Current MVP State

The app is currently a static Vite React prototype. It can be hosted on Vercel with:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

No database, auth provider, backend server, paid resource, or secret environment variable is required for the current MVP.

## Recommended Live Architecture

### MVP Now: Vercel Only

Use Vercel for the hosted frontend while the product is still proving the user experience:

- League table and matchup views use seeded jurisdiction data.
- Simulator runs in the browser.
- Export buttons generate client-side artifacts.
- Public baseline fetches can continue from the browser when CORS allows it.

This is the fastest, lowest-risk path for demos and stakeholder feedback.

### Next Step: Supabase When Persistence Matters

Add Supabase only when the app needs durable records:

- Saved simulation runs
- Jurisdiction metric history
- Source metadata and confidence notes
- Public score snapshots
- Optional user accounts later
- File storage for exports or uploaded source files

Supabase should own structured data first. Auth should stay out until there is a concrete need for private workspaces or saved user history.

### Later: Railway When Server Work Matters

Add Railway only when the app needs a long-running API or worker:

- Scheduled data ingestion from StatCan, BEA, FBI, CDC, Bank of Canada, or similar sources
- API proxying for public sources that fail in deployed browsers because of CORS
- Python/R economic model jobs that are too heavy for the browser
- Background reconciliation, data normalization, and audit log generation

Railway should not be added for static hosting. Vercel already handles that.

## Environment Variable Inventory

| Variable | Used By | Platform | Public Safe | Source | Required Now |
| --- | --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend API calls if a Railway API is added | Vercel | Yes, if URL only | Railway public service URL | No |
| `VITE_SUPABASE_URL` | Frontend Supabase client if public reads are enabled | Vercel | Yes | Supabase project settings | No |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client if public reads are enabled | Vercel | Yes, with RLS | Supabase project API settings | No |
| `SUPABASE_URL` | Backend ingestion/API service | Railway | Secret-ish config | Supabase project settings | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend writes and admin ingestion | Railway only | No | Supabase project API settings | No |
| `CORS_ORIGIN` | Railway API CORS allowlist | Railway | No secret | Vercel production URL | No |
| `DATA_SOURCE_*_KEY` | Optional third-party API adapters | Railway | No | Relevant data providers | No |

Rules:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.
- Never commit `.env` files or secrets.
- Prefer entering secrets directly into Vercel, Railway, or Supabase dashboards/CLI settings.
- Browser-safe `VITE_*` variables are still public once shipped.

## Suggested Supabase Schema

When persistence is approved, start with these tables:

- `jurisdictions`: canonical provinces, states, and later cities.
- `metric_definitions`: metric names, units, polarity, source notes, and comparability rules.
- `metric_observations`: jurisdiction, metric, period, value, confidence tier, and source.
- `sources`: source agency, URL, publication cadence, and license notes.
- `league_snapshots`: score outputs by division and date.
- `simulation_runs`: saved scenario inputs and outputs.
- `audit_logs`: ingestion and model validation diagnostics.

## Deployment Sequence

1. Keep the current Vercel deployment as the public MVP.
2. Add Supabase only after deciding which records must persist.
3. Create row-level security policies before exposing Supabase to the frontend.
4. Add Railway only if scheduled ingestion or an API proxy is required.
5. Move public-data fetch failures behind the smallest possible Railway or Vercel serverless proxy.
6. Switch the UI from seeded data to API-backed data one section at a time.
7. Keep the seeded dataset as an offline fallback for demos.

## Access And Approvals Needed Later

Before provisioning Supabase or Railway, approval is needed for:

- Creating the Supabase project.
- Creating the Railway project/service.
- Adding production secrets to platform dashboards.
- Enabling any paid plan, if free-tier limits are exceeded.
- Running migrations against production data.

## Known MVP Limitations

- League movement and form are seeded prototype values.
- Only a small set of jurisdictions have full metric profiles.
- Registered but unprofiled jurisdictions are not yet fully scored.
- Cross-border metrics need stricter normalization before being treated as regulator-grade.
- The current app has no database, auth, scheduled ingestion, or persistent saved runs.
