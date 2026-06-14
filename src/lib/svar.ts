import { fallbackBaseline } from "./dataSources";
import type {
  MacroBaseline,
  PolicyScenario,
  Province,
  SimulationMetrics,
  SimulationResult,
  SimulationRow,
  StressComparison
} from "./types";

type ProvincialModifiers = {
  capexElasticity: number;
  energyElasticity: number;
  corporateTaxElasticity: number;
  debtSensitivity: number;
  mortgageTransmission: number;
  retailConsumptionResponse: number;
};

const variables = ["policyRate", "capex", "employment", "cpi", "C", "I", "G", "NX", "Y"] as const;

const canadaModifiers: ProvincialModifiers = {
  capexElasticity: 1,
  energyElasticity: 0.18,
  corporateTaxElasticity: 1,
  debtSensitivity: 1,
  mortgageTransmission: 1,
  retailConsumptionResponse: 1
};

const albertaModifiers: ProvincialModifiers = {
  capexElasticity: 1.55,
  energyElasticity: 0.42,
  corporateTaxElasticity: 1.4,
  debtSensitivity: 0.82,
  mortgageTransmission: 0.8,
  retailConsumptionResponse: 0.86
};

const ontarioQuebecModifiers: ProvincialModifiers = {
  capexElasticity: 0.86,
  energyElasticity: 0.11,
  corporateTaxElasticity: 0.76,
  debtSensitivity: 1.46,
  mortgageTransmission: 1.52,
  retailConsumptionResponse: 1.34
};

export function runPolicySimulation(
  scenario: PolicyScenario,
  baseline: MacroBaseline = fallbackBaseline(),
  finalMode = true
): SimulationResult {
  const rows = runSvar(scenario, baseline, finalMode);
  return {
    baseline,
    scenario,
    rows,
    metrics: summarize(rows, 0)
  };
}

export function runStressAudit(baseline: MacroBaseline = fallbackBaseline()): StressComparison[] {
  const scenarios: PolicyScenario[] = [
    {
      province: "Alberta",
      rateShockBps: 800,
      corporateTaxDeltaPp: -12,
      infrastructureSpendDeltaPct: -35,
      energyPriceDeltaPct: -50,
      consumptionTaxDeltaPp: 0,
      horizonMonths: 24
    },
    {
      province: "Ontario",
      rateShockBps: 800,
      corporateTaxDeltaPp: -12,
      infrastructureSpendDeltaPct: -25,
      energyPriceDeltaPct: 0,
      consumptionTaxDeltaPp: 4,
      horizonMonths: 24
    },
    {
      province: "Quebec",
      rateShockBps: -300,
      corporateTaxDeltaPp: 5,
      infrastructureSpendDeltaPct: 80,
      energyPriceDeltaPct: 35,
      consumptionTaxDeltaPp: 0,
      horizonMonths: 24
    },
    {
      province: "Canada",
      rateShockBps: 450,
      corporateTaxDeltaPp: 0,
      infrastructureSpendDeltaPct: 120,
      energyPriceDeltaPct: 100,
      consumptionTaxDeltaPp: 0,
      horizonMonths: 24
    }
  ];

  return scenarios.map((scenario) => {
    const draftRows = runSvar(scenario, baseline, false);
    const finalRows = runSvar(scenario, baseline, true);
    return {
      scenario,
      draft1: summarize(draftRows, 0),
      final: summarize(finalRows, 0),
      draft1Tail: draftRows.slice(-3),
      finalTail: finalRows.slice(-3)
    };
  });
}

function runSvar(scenario: PolicyScenario, baseline: MacroBaseline, finalMode: boolean): SimulationRow[] {
  const horizon = Math.max(1, Math.min(Math.round(scenario.horizonMonths), 60));
  const restriction = choleskyRestriction();
  const transition = transitionMatrix();
  const shock = scenarioVector(scenario);
  let state = initialState(baseline);
  const rows: SimulationRow[] = [];

  for (let month = 1; month <= horizon; month += 1) {
    const decay = Math.exp(-0.11 * (month - 1));
    const impulse = multiplyMatrixVector(
      restriction,
      shock.map((value) => value * decay)
    );
    const drift = [
      0,
      baseline.capexGrowth / 1200,
      baseline.employmentGrowth / 1200,
      (baseline.headlineCpi - 2) / 1200,
      0.012,
      0.01,
      0.006,
      0,
      baseline.realGdpGrowth / 1200
    ];

    state = addVectors(addVectors(multiplyMatrixVector(transition, state), impulse), drift);
    if (finalMode) {
      state = reconcileIdentity(stabilize(state));
    }
    rows.push(toRow(month, state, scenario.province));
  }

  return rows;
}

function initialState(baseline: MacroBaseline): number[] {
  const y = baseline.realGdpGrowth;
  const c = y * baseline.consumptionShare;
  const i = y * baseline.investmentShare;
  const g = y * baseline.governmentShare;
  const nx = y * baseline.netExportsShare;
  return [baseline.policyRate, baseline.capexGrowth, baseline.employmentGrowth, baseline.headlineCpi, c, i, g, nx, c + i + g + nx];
}

function scenarioVector(scenario: PolicyScenario): number[] {
  const m = modifiersFor(scenario.province);
  const ratePp = scenario.rateShockBps / 100;
  const taxPp = scenario.corporateTaxDeltaPp;
  const infra = scenario.infrastructureSpendDeltaPct;
  const energy = scenario.energyPriceDeltaPct;
  const consumptionTax = scenario.consumptionTaxDeltaPp;
  return [
    ratePp,
    -0.34 * ratePp * m.capexElasticity - 0.06 * taxPp * m.corporateTaxElasticity + 0.04 * infra,
    -0.05 * ratePp * m.debtSensitivity + 0.018 * infra,
    0.05 * energy * m.energyElasticity + 0.08 * consumptionTax + 0.03 * ratePp,
    -0.22 * ratePp * m.retailConsumptionResponse - 0.04 * consumptionTax,
    -0.28 * ratePp * m.mortgageTransmission + 0.02 * infra - 0.05 * taxPp,
    0.08 * infra,
    0.02 * energy - 0.01 * ratePp,
    0
  ];
}

function modifiersFor(province: Province): ProvincialModifiers {
  if (province === "Alberta") return albertaModifiers;
  if (province === "Ontario" || province === "Quebec") return ontarioQuebecModifiers;
  return canadaModifiers;
}

function transitionMatrix(): number[][] {
  const matrix = identity(variables.length);
  matrix[1][0] = -0.055;
  matrix[2][1] = 0.032;
  matrix[3][1] = 0.018;
  matrix[3][2] = 0.03;
  matrix[4][0] = -0.02;
  matrix[4][2] = 0.045;
  matrix[5][0] = -0.06;
  matrix[5][1] = 0.085;
  matrix[6][8] = 0.003;
  matrix[7][3] = -0.006;
  matrix[8][4] = 0.52;
  matrix[8][5] = 0.28;
  matrix[8][6] = 0.15;
  matrix[8][7] = 0.05;

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      matrix[row][col] *= 0.985;
    }
  }

  [0.996, 0.965, 0.972, 0.982, 0.97, 0.958, 0.975, 0.95, 0.966].forEach((value, index) => {
    matrix[index][index] = value;
  });

  return matrix;
}

function choleskyRestriction(): number[][] {
  const covariance = [
    [1.0, -0.34, -0.08, 0.03, -0.18, -0.3, 0.0, -0.02, -0.12],
    [-0.34, 1.0, 0.3, 0.14, 0.22, 0.54, 0.04, 0.06, 0.44],
    [-0.08, 0.3, 1.0, 0.26, 0.48, 0.22, 0.03, 0.04, 0.42],
    [0.03, 0.14, 0.26, 1.0, 0.2, 0.12, 0.04, -0.12, 0.15],
    [-0.18, 0.22, 0.48, 0.2, 1.0, 0.32, 0.12, -0.03, 0.74],
    [-0.3, 0.54, 0.22, 0.12, 0.32, 1.0, 0.08, 0.02, 0.62],
    [0.0, 0.04, 0.03, 0.04, 0.12, 0.08, 1.0, -0.01, 0.24],
    [-0.02, 0.06, 0.04, -0.12, -0.03, 0.02, -0.01, 1.0, 0.1],
    [-0.12, 0.44, 0.42, 0.15, 0.74, 0.62, 0.24, 0.1, 1.0]
  ].map((row, rowIndex) => row.map((value, colIndex) => value + (rowIndex === colIndex ? 0.12 : 0)));
  return cholesky(covariance);
}

function stabilize(state: number[]): number[] {
  return [
    clamp(state[0], -0.5, 18),
    clamp(state[1], -14, 14),
    clamp(state[2], -8, 8),
    clamp(state[3], -1, 14),
    ...state.slice(4, 9).map((value) => clamp(value, -15, 15))
  ];
}

export function reconcileIdentity(state: number[]): number[] {
  const target = state.slice(4, 9);
  const weights = [1, 1.2, 0.8, 1.35, 1.5];
  const a = [-1, -1, -1, -1, 1];
  const numerator = dot(a, target);
  const denominator = a.reduce((sum, value, index) => sum + (value * value) / weights[index], 0);
  const lambda = numerator / denominator;
  const reconciled = target.map((value, index) => clamp(value - (a[index] / weights[index]) * lambda, -15, 15));
  reconciled[4] = reconciled[0] + reconciled[1] + reconciled[2] + reconciled[3];
  return [...state.slice(0, 4), ...reconciled];
}

export function summarize(rows: SimulationRow[], convergenceFailures: number): SimulationMetrics {
  const gdp = rows.map((row) => row.Y);
  const cpi = rows.map((row) => row.headlineCpi);
  const gaps = rows.map((row) => row.identityGap);
  const finitePenalty = rows.every((row) => Object.values(row).every((value) => typeof value !== "number" || Number.isFinite(value)))
    ? 0
    : 100;
  const volatility = pstdev(gdp) + pstdev(cpi);
  const stabilityScore = Math.max(0, 100 - volatility * 3.5 - convergenceFailures * 12 - finitePenalty - Math.max(...gaps) * 100);
  return {
    minGdpGrowth: round(Math.min(...gdp), 4),
    maxGdpGrowth: round(Math.max(...gdp), 4),
    minInflation: round(Math.min(...cpi), 4),
    maxInflation: round(Math.max(...cpi), 4),
    maxIdentityGap: round(Math.max(...gaps), 10),
    convergenceFailures,
    stabilityScore: round(stabilityScore, 2)
  };
}

function toRow(month: number, state: number[], province: Province): SimulationRow {
  const identityGap = Math.abs(state[8] - (state[4] + state[5] + state[6] + state[7]));
  return {
    month,
    province,
    policyRate: round(state[0], 4),
    capexGrowth: round(state[1], 4),
    employmentGrowth: round(state[2], 4),
    headlineCpi: round(state[3], 4),
    C: round(state[4], 4),
    I: round(state[5], 4),
    G: round(state[6], 4),
    NX: round(state[7], 4),
    Y: round(state[8], 4),
    identityGap: round(identityGap, 10)
  };
}

function cholesky(matrix: number[][]): number[][] {
  const n = matrix.length;
  const lower = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = 0;
      for (let k = 0; k < j; k += 1) sum += lower[i][k] * lower[j][k];
      if (i === j) {
        lower[i][j] = Math.sqrt(Math.max(matrix[i][i] - sum, 1e-9));
      } else {
        lower[i][j] = (matrix[i][j] - sum) / lower[j][j];
      }
    }
  }
  return lower;
}

function identity(size: number): number[][] {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)));
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function addVectors(left: number[], right: number[]): number[] {
  return left.map((value, index) => value + right[index]);
}

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function pstdev(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}
