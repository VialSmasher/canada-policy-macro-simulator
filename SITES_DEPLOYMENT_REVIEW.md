# Sites Deployment Review

Date: 2026-06-14

## Verdict

This project can be used as a fast hosted Sites MVP without Supabase, Vercel, Railway, or Express.

The current deployable surface is a Vite static React app:

- build command: `npm.cmd run build`
- output directory: `dist`
- runtime server: none
- environment variables: none
- database requirement: none for the MVP
- file storage requirement: none for the MVP

## Project Structure

- `src/main.tsx`: interactive simulator UI
- `src/lib/svar.ts`: TypeScript SVAR model, provincial modifiers, stress audit, and GDP identity reconciliation
- `src/lib/dataSources.ts`: optional live public baseline refresh with timeout and fallback
- `scripts/stress-audit.ts`: local audit artifact generator
- `dist/`: latest compiled static app bundle
- `macro_simulator_engine.py`: legacy Python prototype, not used by the Sites build

## Dependency Scan

No project source or config depends on:

- Supabase
- Vercel
- Railway
- Express
- `process.env`
- `import.meta.env`
- private API keys
- `DATABASE_URL`

Only public external data services are used:

- Statistics Canada WDS
- Bank of Canada Valet

These calls are optional. If they fail, time out, or are blocked by browser/CORS policy, the app falls back to conservative baseline priors and remains usable.

## Can Sites Replace The Missing Pieces?

Yes for hosting. Sites can replace Vercel/Railway for this MVP because the app now builds to static assets and does not require a Node server.

Supabase is not needed yet. There is no authentication, multi-user database, saved scenario library, uploaded file, or server-side private secret requirement in the current MVP.

## Persistence Plan If Needed Later

Use D1 for structured records:

- saved scenarios
- baseline snapshots
- audit run records
- user notes or comparison metadata

Use R2 only if the app later stores files:

- uploaded CSVs
- generated reports
- exported model bundles

The current MVP does not require D1 or R2.

## Changes Made For Sites Readiness

- Added a timeout wrapper around live baseline refreshes so public API slowness cannot stall the hosted MVP.
- Confirmed the app has no Supabase, Vercel, Railway, Express, or environment-variable dependency.
- Preserved the legacy Python simulator as reference-only code outside the Vite build path.

## Limitations Remaining

- Live public data refresh happens from the browser. Some public endpoints may fail because of CORS, rate limits, or temporary availability.
- CapEx still uses fallback priors when the configured StatCan vector candidates do not resolve.
- No user persistence exists yet. Exports are downloaded JSON files, not server-stored records.
- This is an MVP/prototype model, not an official forecast or institutional-grade econometric release.

## Saved Deployable Version

A local deployable snapshot is saved in `sites_saved_version/`.

Because the Sites plugin is not callable in this session, this is a local saved deployable version rather than a platform-level Sites saved version. Do not deploy until the summary above is reviewed.
