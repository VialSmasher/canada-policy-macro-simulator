import { writeFileSync } from "node:fs";
import { buildBaseline } from "../src/lib/dataSources";
import { runStressAudit } from "../src/lib/svar";

const baseline = await buildBaseline();
const comparisons = runStressAudit(baseline);
const generatedAtUtc = new Date().toISOString();

writeFileSync(
  "baseline_data_log.json",
  JSON.stringify(baseline, null, 2),
  "utf8"
);

writeFileSync(
  "stress_test_outputs.json",
  JSON.stringify({ generatedAtUtc, baselineSourceQuality: baseline.sourceQuality, baseline, comparisons }, null, 2),
  "utf8"
);

const rows = comparisons
  .map(
    (item) =>
      `| ${item.scenario.province} | ${item.scenario.rateShockBps.toFixed(0)} | ${item.draft1.maxIdentityGap.toFixed(
        6
      )} | ${item.final.maxIdentityGap.toFixed(6)} | ${item.draft1.stabilityScore.toFixed(2)} | ${item.final.stabilityScore.toFixed(
        2
      )} | ${item.final.convergenceFailures} |`
  )
  .join("\n");

writeFileSync(
  "dev_evolution_report.md",
  `# Development Evolution Report

Generated: ${generatedAtUtc}

## Baseline Acquisition

Baseline quality: \`${baseline.sourceQuality}\`.

The browser-ready build attempts live public ingestion from Statistics Canada's Web Data Service and the Bank of Canada Valet API. Missing or blocked sources are recorded in \`baseline_data_log.json\` and replaced with conservative fallback priors.

## What Draft 1 Got Wrong

Draft 1 used the same SVAR transmission ordering but skipped bounded stabilization and exact reconciliation. Extreme shocks created accounting identity drift because \`Y\` and the expenditure components evolved independently.

## Final Structural Decisions

The final TypeScript engine preserves the Cholesky transmission order:

\`Policy Rate -> CapEx Fixed Investment -> Employment Multipliers -> Demand-Pull/Supply-Side CPI Inflation -> Expenditure Components -> GDP\`

The final build adds Alberta and Ontario/Quebec modifier engines, bounded stress-test state transitions, and a weighted constrained reconciliation solver that enforces \`Y = C + I + G + (X - M)\` every month without needing SciPy.

## Comparative Performance Matrix

| Scenario | Rate shock bps | Draft max identity gap | Final max identity gap | Draft stability | Final stability | Final convergence failures |
|---|---:|---:|---:|---:|---:|---:|
${rows}

## Runtime Artifacts

- \`src/lib/svar.ts\`: TypeScript SVAR and reconciliation engine.
- \`src/lib/dataSources.ts\`: live data ingestion and fallback handling.
- \`stress_test_outputs.json\`: latest stress-audit output.
- \`baseline_data_log.json\`: latest baseline source path.
`,
  "utf8"
);

writeFileSync(
  "simulation_diagnostics.log",
  [`${generatedAtUtc} stress audit completed`, `baseline source quality: ${baseline.sourceQuality}`, ...baseline.sourceNotes].join(
    "\n"
  ),
  "utf8"
);

console.log(JSON.stringify(comparisons, null, 2));
