import type { PolicyScenario, Province } from "./types";

export interface EconomyProfile {
  province: Province;
  nominalGdpBillion: number;
  realGrowth2024: number;
  nominalGrowth2024: number;
  source: string;
  texture: string[];
}

export interface TeachingScenario {
  id: string;
  title: string;
  shortTitle: string;
  province: Province;
  summary: string;
  scenario: PolicyScenario;
  directInvestmentBillion: number;
  governmentTakeRate: number;
  retailSpilloverRate: number;
  confidenceEffect: number;
  channels: string[];
  risks: string[];
}

export const economyProfiles: Record<Province, EconomyProfile> = {
  Canada: {
    province: "Canada",
    nominalGdpBillion: 3108.551,
    realGrowth2024: 2.0,
    nominalGrowth2024: 4.8,
    source: "Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["Huge diversified economy", "household spending matters", "exports and rates move the cycle"]
  },
  Alberta: {
    province: "Alberta",
    nominalGdpBillion: 473.937,
    realGrowth2024: 3.0,
    nominalGrowth2024: 5.1,
    source: "Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["energy and capital investment matter a lot", "construction bottlenecks can bite", "retail follows wages and migration"]
  },
  Ontario: {
    province: "Ontario",
    nominalGdpBillion: 1197.02,
    realGrowth2024: 1.3,
    nominalGrowth2024: 5.1,
    source: "Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["consumer debt sensitivity is high", "housing and autos are major channels", "services dominate employment"]
  },
  Quebec: {
    province: "Quebec",
    nominalGdpBillion: 616.771,
    realGrowth2024: 1.3,
    nominalGrowth2024: 5.9,
    source: "Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["hydro and manufacturing matter", "public investment has large regional effects", "consumer demand is rate-sensitive"]
  },
  "British Columbia": {
    province: "British Columbia",
    nominalGdpBillion: 429.089,
    realGrowth2024: 1.2,
    nominalGrowth2024: 3.5,
    source: "Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["housing and ports matter", "tourism and services are important", "cost pressure can limit gains"]
  },
  Saskatchewan: {
    province: "Saskatchewan",
    nominalGdpBillion: 112.839,
    realGrowth2024: 3.0,
    nominalGrowth2024: 0,
    source: "Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["resources and agriculture dominate swings", "export prices matter", "capital projects are chunky"]
  },
  Atlantic: {
    province: "Atlantic",
    nominalGdpBillion: 166.748,
    realGrowth2024: 2.5,
    nominalGrowth2024: 6.1,
    source: "Aggregated Atlantic provinces from Statistics Canada table 36-10-0222-01, 2024 current-dollar GDP.",
    texture: ["smaller economies amplify projects", "aging demographics matter", "ports, energy, and tourism are channels"]
  }
};

export const teachingScenarios: TeachingScenario[] = [
  {
    id: "ab-pipeline",
    title: "Approve one major Alberta pipeline",
    shortTitle: "Pipeline approved",
    province: "Alberta",
    summary: "A large private capital project raises construction demand first, then export capacity if production can fill it.",
    scenario: {
      province: "Alberta",
      rateShockBps: 25,
      corporateTaxDeltaPp: 0,
      infrastructureSpendDeltaPct: 20,
      energyPriceDeltaPct: 12,
      consumptionTaxDeltaPp: 0,
      horizonMonths: 36
    },
    directInvestmentBillion: 14,
    governmentTakeRate: 0.13,
    retailSpilloverRate: 0.18,
    confidenceEffect: 72,
    channels: [
      "Engineering, construction, steel, equipment, trucking, and camp services see the first wave of spending.",
      "Higher labour income spills into restaurants, vehicles, housing, and local services.",
      "If upstream producers invest enough to fill the line, exports and royalties rise after the construction phase.",
      "Investor confidence improves because market access risk falls."
    ],
    risks: [
      "Court delays or permitting conflict push benefits into the future.",
      "Labour shortages can inflate project costs and crowd out smaller construction.",
      "If oil prices fall, the export-capacity gain is less valuable."
    ]
  },
  {
    id: "ab-small-business",
    title: "Lower small-business operating costs",
    shortTitle: "Business cost relief",
    province: "Alberta",
    summary: "A broad cost-relief package improves margins and hiring, but the fiscal cost must be financed somewhere.",
    scenario: {
      province: "Alberta",
      rateShockBps: 0,
      corporateTaxDeltaPp: -2,
      infrastructureSpendDeltaPct: 4,
      energyPriceDeltaPct: 0,
      consumptionTaxDeltaPp: -1,
      horizonMonths: 24
    },
    directInvestmentBillion: 2.2,
    governmentTakeRate: 0.08,
    retailSpilloverRate: 0.24,
    confidenceEffect: 64,
    channels: [
      "Lower fixed costs give small firms more room to hire, discount, or invest.",
      "Households see some price relief if businesses pass through savings.",
      "Retail and services respond faster than heavy industry."
    ],
    risks: [
      "If relief is deficit-financed, future taxes or spending cuts may offset some gains.",
      "Benefits scatter widely, so the impact is less visible than a single megaproject."
    ]
  },
  {
    id: "ca-rate-cut",
    title: "Bank of Canada cuts rates 100 bps",
    shortTitle: "Rate cut",
    province: "Canada",
    summary: "Lower rates support housing, investment, and debt-servicing relief, with inflation risk if demand rebounds too fast.",
    scenario: {
      province: "Canada",
      rateShockBps: -100,
      corporateTaxDeltaPp: 0,
      infrastructureSpendDeltaPct: 4,
      energyPriceDeltaPct: 0,
      consumptionTaxDeltaPp: 0,
      horizonMonths: 24
    },
    directInvestmentBillion: 10,
    governmentTakeRate: 0.1,
    retailSpilloverRate: 0.2,
    confidenceEffect: 58,
    channels: [
      "Mortgage and business borrowing costs ease.",
      "Housing, autos, durable goods, and private investment respond first.",
      "Debt-service relief can support consumer spending."
    ],
    risks: [
      "Housing prices can re-accelerate before supply catches up.",
      "Inflation expectations may rise if cuts arrive before price pressure is contained."
    ]
  },
  {
    id: "ca-infrastructure",
    title: "National infrastructure buildout",
    shortTitle: "Buildout",
    province: "Canada",
    summary: "Public capital spending raises demand now and can lift productivity later if projects relieve real bottlenecks.",
    scenario: {
      province: "Canada",
      rateShockBps: 50,
      corporateTaxDeltaPp: 0,
      infrastructureSpendDeltaPct: 35,
      energyPriceDeltaPct: 4,
      consumptionTaxDeltaPp: 0,
      horizonMonths: 36
    },
    directInvestmentBillion: 45,
    governmentTakeRate: 0.09,
    retailSpilloverRate: 0.16,
    confidenceEffect: 61,
    channels: [
      "Construction and materials rise first.",
      "Better transport, power, housing, or digital capacity can lower future business costs.",
      "The impact is strongest when projects unlock private investment."
    ],
    risks: [
      "Poor project selection creates debt without productivity.",
      "A hot construction market can turn public spending into cost inflation."
    ]
  }
];

export function profileFor(province: Province): EconomyProfile {
  return economyProfiles[province] ?? economyProfiles.Canada;
}
