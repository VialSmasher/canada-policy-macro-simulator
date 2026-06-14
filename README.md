# Canada Policy Macro Simulator

Interactive Canadian municipal and macroeconomic policy simulator built as a browser-ready TypeScript/React app.

## What It Does

- Pulls live baseline inputs from Statistics Canada WDS and Bank of Canada Valet when reachable.
- Falls back to conservative documented priors when a public source fails or browser/network policy blocks a request.
- Runs a 24-month Cholesky-identified SVAR policy transmission model.
- Applies Alberta and Ontario/Quebec provincial modifiers.
- Enforces `Y = C + I + G + (X - M)` every month with an exact weighted reconciliation solver.
- Exposes stress-audit comparison outputs and JSON export from the UI.

## Local Setup

```powershell
npm.cmd install
npm.cmd run dev
```

Then open the local URL printed by Vite.

## Build

```powershell
npm.cmd run build
```

The production bundle is written to `dist/`.

## Stress Audit Artifacts

```powershell
npm.cmd run stress
```

This writes:

- `baseline_data_log.json`
- `simulation_diagnostics.log`
- `stress_test_outputs.json`
- `dev_evolution_report.md`

## OpenAI Sites Launch Path

Use the Sites plugin from Codex/OpenAI Sites on this repo after `npm.cmd run build` succeeds. The app is now a static browser app with no Python runtime requirement, so it is much closer to a Sites-compatible deployment than the original Streamlit prototype.

The old Python prototype remains in `macro_simulator_engine.py` as a reference implementation.
