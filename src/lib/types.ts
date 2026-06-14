export type Province =
  | "Canada"
  | "Alberta"
  | "Ontario"
  | "Quebec"
  | "British Columbia"
  | "Saskatchewan"
  | "Atlantic";

export interface MacroBaseline {
  realGdpGrowth: number;
  headlineCpi: number;
  policyRate: number;
  capexGrowth: number;
  employmentGrowth: number;
  consumptionShare: number;
  investmentShare: number;
  governmentShare: number;
  netExportsShare: number;
  regionalInvestmentMultipliers: Record<string, number>;
  sourceQuality: "live" | "mixed" | "fallback";
  sourceNotes: string[];
  observedAtUtc: string;
}

export interface PolicyScenario {
  province: Province;
  rateShockBps: number;
  corporateTaxDeltaPp: number;
  infrastructureSpendDeltaPct: number;
  energyPriceDeltaPct: number;
  consumptionTaxDeltaPp: number;
  horizonMonths: number;
}

export interface SimulationRow {
  month: number;
  province: Province;
  policyRate: number;
  capexGrowth: number;
  employmentGrowth: number;
  headlineCpi: number;
  C: number;
  I: number;
  G: number;
  NX: number;
  Y: number;
  identityGap: number;
}

export interface SimulationMetrics {
  minGdpGrowth: number;
  maxGdpGrowth: number;
  minInflation: number;
  maxInflation: number;
  maxIdentityGap: number;
  convergenceFailures: number;
  stabilityScore: number;
}

export interface SimulationResult {
  baseline: MacroBaseline;
  scenario: PolicyScenario;
  rows: SimulationRow[];
  metrics: SimulationMetrics;
}

export interface StressComparison {
  scenario: PolicyScenario;
  draft1: SimulationMetrics;
  final: SimulationMetrics;
  draft1Tail: SimulationRow[];
  finalTail: SimulationRow[];
}
