export type JurisdictionKind = "province" | "state";
export type MetricQuality = "comparable" | "directional" | "limited";

export interface JurisdictionMetric {
  value: number | null;
  unit: string;
  year: string;
  quality: MetricQuality;
  source: string;
  note?: string;
}

export interface JurisdictionProfile {
  id: string;
  name: string;
  country: "Canada" | "United States";
  kind: JurisdictionKind;
  populationMillions: number;
  gdpBillionLocal: number;
  currency: "CAD" | "USD";
  gdpPerCapitaLocal: number;
  realGrowthPct: number | null;
  nominalGrowthPct: number | null;
  violentCrime: JurisdictionMetric;
  propertyCrime: JurisdictionMetric;
  overdoseDeaths: JurisdictionMetric;
  lifeExpectancy: JurisdictionMetric;
  studentOutcome: JurisdictionMetric;
  modelFit: string[];
}

export const cadPerUsd = 1.37;

export const jurisdictions: JurisdictionProfile[] = [
  {
    id: "alberta",
    name: "Alberta",
    country: "Canada",
    kind: "province",
    populationMillions: 4.85,
    gdpBillionLocal: 473.937,
    currency: "CAD",
    gdpPerCapitaLocal: 97700,
    realGrowthPct: 3.0,
    nominalGrowthPct: 5.1,
    violentCrime: {
      value: 105.9,
      unit: "violent CSI",
      year: "2024",
      quality: "directional",
      source: "Statistics Canada crime and justice dashboard",
      note: "Canada reports a Crime Severity Index; it is not the same as FBI violent crime per 100,000."
    },
    propertyCrime: {
      value: 92.3,
      unit: "non-violent CSI",
      year: "2024",
      quality: "directional",
      source: "Statistics Canada crime and justice dashboard"
    },
    overdoseDeaths: {
      value: 22.6,
      unit: "per 100k",
      year: "2025 Jan-Sep",
      quality: "directional",
      source: "Public Health Agency of Canada opioid and stimulant harms dashboard"
    },
    lifeExpectancy: {
      value: 81.6,
      unit: "years",
      year: "latest pre-pandemic comparable series",
      quality: "limited",
      source: "Canadian provincial life-expectancy series; needs refresh in next data pass"
    },
    studentOutcome: {
      value: null,
      unit: "index",
      year: "TBD",
      quality: "limited",
      source: "Needs PISA / provincial education outcome harmonization"
    },
    modelFit: ["energy investment sensitivity", "high capital formation", "resource royalties", "interprovincial migration"]
  },
  {
    id: "ontario",
    name: "Ontario",
    country: "Canada",
    kind: "province",
    populationMillions: 16.14,
    gdpBillionLocal: 1197.02,
    currency: "CAD",
    gdpPerCapitaLocal: 74143,
    realGrowthPct: 1.3,
    nominalGrowthPct: 5.1,
    violentCrime: { value: null, unit: "violent CSI", year: "2024", quality: "limited", source: "Statistics Canada harmonization pending" },
    propertyCrime: { value: null, unit: "non-violent CSI", year: "2024", quality: "limited", source: "Statistics Canada harmonization pending" },
    overdoseDeaths: { value: null, unit: "per 100k", year: "2024/2025", quality: "limited", source: "PHAC harmonization pending" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "Needs harmonized series" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs PISA / province data" },
    modelFit: ["large services base", "housing sensitivity", "manufacturing", "household debt"]
  },
  {
    id: "quebec",
    name: "Quebec",
    country: "Canada",
    kind: "province",
    populationMillions: 9.0,
    gdpBillionLocal: 616.771,
    currency: "CAD",
    gdpPerCapitaLocal: 68565,
    realGrowthPct: 1.3,
    nominalGrowthPct: 5.9,
    violentCrime: { value: null, unit: "violent CSI", year: "2024", quality: "limited", source: "Statistics Canada harmonization pending" },
    propertyCrime: { value: null, unit: "non-violent CSI", year: "2024", quality: "limited", source: "Statistics Canada harmonization pending" },
    overdoseDeaths: { value: null, unit: "per 100k", year: "2024/2025", quality: "limited", source: "PHAC harmonization pending" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "Needs harmonized series" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs PISA / province data" },
    modelFit: ["hydro advantage", "manufacturing", "public services", "lower GDP per capita but strong social indicators"]
  },
  {
    id: "texas",
    name: "Texas",
    country: "United States",
    kind: "state",
    populationMillions: 31.3,
    gdpBillionLocal: 2904,
    currency: "USD",
    gdpPerCapitaLocal: 92800,
    realGrowthPct: null,
    nominalGrowthPct: null,
    violentCrime: { value: 389, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts / FBI CDE" },
    propertyCrime: { value: 2041, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts / FBI CDE" },
    overdoseDeaths: { value: 15.9, unit: "per 100k", year: "2024", quality: "comparable", source: "CDC via USAFacts" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "CDC/NCHS harmonization pending" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "NAEP/PISA harmonization pending" },
    modelFit: ["energy", "population growth", "business formation", "lower tax model", "large metro divergence"]
  },
  {
    id: "florida",
    name: "Florida",
    country: "United States",
    kind: "state",
    populationMillions: 23.4,
    gdpBillionLocal: 1726.71,
    currency: "USD",
    gdpPerCapitaLocal: 73879,
    realGrowthPct: null,
    nominalGrowthPct: null,
    violentCrime: { value: null, unit: "per 100k", year: "2024", quality: "limited", source: "FBI/USAFacts; 2024 state-level coverage flagged limited" },
    propertyCrime: { value: null, unit: "per 100k", year: "2024", quality: "limited", source: "FBI/USAFacts; 2024 state-level coverage flagged limited" },
    overdoseDeaths: { value: 21.2, unit: "per 100k", year: "2024", quality: "comparable", source: "CDC via USAFacts" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "CDC/NCHS harmonization pending" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "NAEP/PISA harmonization pending" },
    modelFit: ["migration", "tourism", "retirement income", "real estate", "hurricane risk"]
  },
  {
    id: "california",
    name: "California",
    country: "United States",
    kind: "state",
    populationMillions: 39.4,
    gdpBillionLocal: 4251,
    currency: "USD",
    gdpPerCapitaLocal: 107900,
    realGrowthPct: null,
    nominalGrowthPct: 6.0,
    violentCrime: { value: 486, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts/FBI and California DOJ/PPIC" },
    propertyCrime: { value: 2078, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts / FBI CDE" },
    overdoseDeaths: { value: 22.9, unit: "per 100k", year: "2024", quality: "comparable", source: "CDC via USAFacts" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "CDC/NCHS harmonization pending" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "NAEP/PISA harmonization pending" },
    modelFit: ["technology", "ports", "housing constraints", "high GDP per capita", "high cost of living"]
  }
];

export function gdpCadEquivalent(profile: JurisdictionProfile): number {
  return profile.currency === "USD" ? profile.gdpBillionLocal * cadPerUsd : profile.gdpBillionLocal;
}

export function gdpPerCapitaCadEquivalent(profile: JurisdictionProfile): number {
  return profile.currency === "USD" ? profile.gdpPerCapitaLocal * cadPerUsd : profile.gdpPerCapitaLocal;
}

export function scoreJurisdiction(profile: JurisdictionProfile) {
  const prosperity = clampScore((gdpPerCapitaCadEquivalent(profile) / 135000) * 100);
  const growth = clampScore(((profile.realGrowthPct ?? profile.nominalGrowthPct ?? 2.5) / 6) * 100);
  const violent = profile.violentCrime.value;
  const property = profile.propertyCrime.value;
  const safety =
    violent === null && property === null
      ? null
      : clampScore(100 - ((violent ?? 350) / 700) * 45 - ((property ?? 1800) / 3500) * 35);
  const overdose = profile.overdoseDeaths.value;
  const health = overdose === null ? null : clampScore(100 - (overdose / 45) * 70);
  const available = [prosperity, growth, safety, health].filter((value): value is number => value !== null);
  const overall = Math.round(available.reduce((sum, value) => sum + value, 0) / available.length);
  const confidencePenalty = [profile.violentCrime, profile.propertyCrime, profile.overdoseDeaths, profile.lifeExpectancy].filter(
    (metric) => metric.quality === "limited"
  ).length;
  return {
    prosperity,
    growth,
    safety,
    health,
    overall: clampScore(overall - confidencePenalty * 3)
  };
}

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}
