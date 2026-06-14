# Development Evolution Report

Generated: 2026-06-14T19:16:54.363Z

## Baseline Acquisition

Baseline quality: `mixed`.

The browser-ready build attempts live public ingestion from Statistics Canada's Web Data Service and the Bank of Canada Valet API. Missing or blocked sources are recorded in `baseline_data_log.json` and replaced with conservative fallback priors.

## What Draft 1 Got Wrong

Draft 1 used the same SVAR transmission ordering but skipped bounded stabilization and exact reconciliation. Extreme shocks created accounting identity drift because `Y` and the expenditure components evolved independently.

## Final Structural Decisions

The final TypeScript engine preserves the Cholesky transmission order:

`Policy Rate -> CapEx Fixed Investment -> Employment Multipliers -> Demand-Pull/Supply-Side CPI Inflation -> Expenditure Components -> GDP`

The final build adds Alberta and Ontario/Quebec modifier engines, bounded stress-test state transitions, and a weighted constrained reconciliation solver that enforces `Y = C + I + G + (X - M)` every month without needing SciPy.

## Comparative Performance Matrix

| Scenario | Rate shock bps | Draft max identity gap | Final max identity gap | Draft stability | Final stability | Final convergence failures |
|---|---:|---:|---:|---:|---:|---:|
| Alberta | 800 | 541.095778 | 0.000000 | 0.00 | 88.89 | 0 |
| Ontario | 800 | 540.831455 | 0.000000 | 0.00 | 85.65 | 0 |
| Quebec | -300 | 403.508971 | 0.000000 | 0.00 | 83.54 | 0 |
| Canada | 450 | 77.357905 | 0.000000 | 0.00 | 72.93 | 0 |

## Runtime Artifacts

- `src/lib/svar.ts`: TypeScript SVAR and reconciliation engine.
- `src/lib/dataSources.ts`: live data ingestion and fallback handling.
- `stress_test_outputs.json`: latest stress-audit output.
- `baseline_data_log.json`: latest baseline source path.
