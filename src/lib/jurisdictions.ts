export type JurisdictionKind = "province" | "state";
export type MetricQuality = "comparable" | "directional" | "limited";
export type TrendDirection = "up" | "flat" | "down" | "unknown";
export type DirectoryStatus = "profiled" | "registered";

export interface JurisdictionMetric {
  value: number | null;
  unit: string;
  year: string;
  quality: MetricQuality;
  source: string;
  sourceUrl?: string;
  note?: string;
}

export interface JurisdictionTrend {
  label: string;
  direction: TrendDirection;
  value: string;
  note: string;
}

export interface JurisdictionColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface JurisdictionProfile {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  nickname: string;
  country: "Canada" | "United States";
  kind: JurisdictionKind;
  colors: JurisdictionColors;
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
  affordability: JurisdictionMetric;
  fiscalCapacity: JurisdictionMetric;
  trends: JurisdictionTrend[];
  modelFit: string[];
  scoutingReport: {
    strengths: string[];
    weakSpots: string[];
    policyLevers: string[];
  };
}

export interface JurisdictionDirectoryEntry {
  id: string;
  name: string;
  abbreviation: string;
  country: "Canada" | "United States";
  kind: JurisdictionKind;
  colors: JurisdictionColors;
  peerGroups: string[];
  dataStatus: DirectoryStatus;
  dataCompleteness: number;
  suggestedRivals: string[];
}

export const cadPerUsd = 1.37;

export const jurisdictions: JurisdictionProfile[] = [
  {
    id: "alberta",
    name: "Alberta",
    shortName: "Alberta",
    abbreviation: "AB",
    nickname: "Energy Club",
    country: "Canada",
    kind: "province",
    colors: { primary: "#005eb8", secondary: "#f6c343", accent: "#d43f2f" },
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
      sourceUrl: "https://www.statcan.gc.ca/en/subjects-start/crime_and_justice",
      note: "Canada reports a Crime Severity Index; it is not the same as FBI violent crime per 100,000."
    },
    propertyCrime: {
      value: 92.3,
      unit: "non-violent CSI",
      year: "2024",
      quality: "directional",
      source: "Statistics Canada crime and justice dashboard",
      sourceUrl: "https://www.statcan.gc.ca/en/subjects-start/crime_and_justice",
      note: "Non-violent CSI is a severity-weighted index, not an incident rate."
    },
    overdoseDeaths: {
      value: 22.6,
      unit: "per 100k",
      year: "2025 Jan-Sep",
      quality: "directional",
      source: "Public Health Agency of Canada opioid and stimulant harms dashboard",
      sourceUrl: "https://health-infobase.canada.ca/substance-related-harms/opioids-stimulants/maps.html"
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
    affordability: {
      value: null,
      unit: "index",
      year: "TBD",
      quality: "limited",
      source: "Needs rent, home-price, and income harmonization"
    },
    fiscalCapacity: {
      value: null,
      unit: "index",
      year: "TBD",
      quality: "limited",
      source: "Needs own-source revenue and debt-service harmonization"
    },
    trends: [
      { label: "Growth momentum", direction: "up", value: "3.0% real GDP", note: "Solid 2024 provincial-account growth." },
      { label: "Health pressure", direction: "down", value: "22.6 overdose deaths/100k", note: "Drug deaths remain a major drag on outcomes." },
      { label: "Data quality", direction: "flat", value: "mixed", note: "Economic data is strong; crime comparability needs conversion." }
    ],
    modelFit: ["energy investment sensitivity", "high capital formation", "resource royalties", "interprovincial migration"],
    scoutingReport: {
      strengths: ["High GDP per person", "Energy investment upside", "Large fiscal royalty channel"],
      weakSpots: ["Commodity exposure", "Overdose pressure", "Crime comparability gap"],
      policyLevers: ["Infrastructure approvals", "Skilled migration", "Addiction treatment capacity"]
    }
  },
  {
    id: "ontario",
    name: "Ontario",
    shortName: "Ontario",
    abbreviation: "ON",
    nickname: "Industrial Core",
    country: "Canada",
    kind: "province",
    colors: { primary: "#006b3f", secondary: "#ffffff", accent: "#d71920" },
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
    affordability: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs housing affordability harmonization" },
    fiscalCapacity: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs provincial fiscal harmonization" },
    trends: [
      { label: "Growth momentum", direction: "flat", value: "1.3% real GDP", note: "Large economy, slower recent real growth." },
      { label: "Housing pressure", direction: "down", value: "high", note: "Affordability should become a core scorecard metric." },
      { label: "Data quality", direction: "down", value: "limited", note: "Crime, health, and education need next-pass source integration." }
    ],
    modelFit: ["large services base", "housing sensitivity", "manufacturing", "household debt"],
    scoutingReport: {
      strengths: ["Very large market", "Manufacturing and finance depth", "Immigration scale"],
      weakSpots: ["Housing affordability", "Lower GDP per person than western peers", "Household debt sensitivity"],
      policyLevers: ["Housing supply", "Transit productivity", "Industrial power costs"]
    }
  },
  {
    id: "quebec",
    name: "Quebec",
    shortName: "Quebec",
    abbreviation: "QC",
    nickname: "Hydro Bloc",
    country: "Canada",
    kind: "province",
    colors: { primary: "#003da5", secondary: "#ffffff", accent: "#7bb6ff" },
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
    affordability: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs housing/income harmonization" },
    fiscalCapacity: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs fiscal harmonization" },
    trends: [
      { label: "Growth momentum", direction: "flat", value: "1.3% real GDP", note: "Stable but not fast in the latest baseline." },
      { label: "Power advantage", direction: "up", value: "hydro", note: "Low-carbon power is a strategic industrial asset." },
      { label: "Data quality", direction: "down", value: "limited", note: "Social-outcome series should be added before judging the model." }
    ],
    modelFit: ["hydro advantage", "manufacturing", "public services", "lower GDP per capita but strong social indicators"],
    scoutingReport: {
      strengths: ["Hydro power advantage", "Manufacturing depth", "Potential social-outcome strength"],
      weakSpots: ["Lower GDP per person", "Slower recent real growth", "Missing harmonized outcome data"],
      policyLevers: ["Power-intensive industry", "Productivity investment", "Interprovincial trade"]
    }
  },
  {
    id: "texas",
    name: "Texas",
    shortName: "Texas",
    abbreviation: "TX",
    nickname: "Growth Machine",
    country: "United States",
    kind: "state",
    colors: { primary: "#bf0d3e", secondary: "#00205b", accent: "#ffffff" },
    populationMillions: 31.3,
    gdpBillionLocal: 2904,
    currency: "USD",
    gdpPerCapitaLocal: 92800,
    realGrowthPct: null,
    nominalGrowthPct: null,
    violentCrime: { value: 389, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts / FBI CDE", sourceUrl: "https://usafacts.org/answers/what-is-the-crime-rate-in-the-us/state/texas/" },
    propertyCrime: { value: 2041, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts / FBI CDE", sourceUrl: "https://usafacts.org/answers/what-is-the-crime-rate-in-the-us/state/texas/" },
    overdoseDeaths: { value: 15.9, unit: "per 100k", year: "2024", quality: "comparable", source: "CDC via USAFacts", sourceUrl: "https://usafacts.org/answers/how-many-drug-overdose-deaths-happen-every-year-in-the-us/state/texas/" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "CDC/NCHS harmonization pending" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "NAEP/PISA harmonization pending" },
    affordability: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs housing-cost/income harmonization" },
    fiscalCapacity: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs state-local fiscal harmonization" },
    trends: [
      { label: "Scale momentum", direction: "up", value: "large and growing", note: "Population and investment scale are core advantages." },
      { label: "Overdose pressure", direction: "up", value: "15.9/100k", note: "Better than several peers in this seed set." },
      { label: "Growth data", direction: "unknown", value: "TBD", note: "Needs direct BEA real GDP time-series integration." }
    ],
    modelFit: ["energy", "population growth", "business formation", "lower tax model", "large metro divergence"],
    scoutingReport: {
      strengths: ["Huge GDP scale", "High GDP per person", "Energy and business formation"],
      weakSpots: ["Metro inequality", "Violent crime remains material", "Missing live growth feed"],
      policyLevers: ["Grid reliability", "Workforce training", "Urban safety"]
    }
  },
  {
    id: "florida",
    name: "Florida",
    shortName: "Florida",
    abbreviation: "FL",
    nickname: "Migration Wave",
    country: "United States",
    kind: "state",
    colors: { primary: "#f58220", secondary: "#00529b", accent: "#00a3e0" },
    populationMillions: 23.4,
    gdpBillionLocal: 1726.71,
    currency: "USD",
    gdpPerCapitaLocal: 73879,
    realGrowthPct: null,
    nominalGrowthPct: null,
    violentCrime: { value: null, unit: "per 100k", year: "2024", quality: "limited", source: "FBI/USAFacts; 2024 state-level coverage flagged limited" },
    propertyCrime: { value: null, unit: "per 100k", year: "2024", quality: "limited", source: "FBI/USAFacts; 2024 state-level coverage flagged limited" },
    overdoseDeaths: { value: 21.2, unit: "per 100k", year: "2024", quality: "comparable", source: "CDC via USAFacts", sourceUrl: "https://usafacts.org/answers/how-many-drug-overdose-deaths-happen-every-year-in-the-us/state/florida/" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "CDC/NCHS harmonization pending" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "NAEP/PISA harmonization pending" },
    affordability: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs insurance/housing affordability harmonization" },
    fiscalCapacity: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs state-local fiscal harmonization" },
    trends: [
      { label: "Migration momentum", direction: "up", value: "strong", note: "Population growth is the core story." },
      { label: "Climate/insurance risk", direction: "down", value: "rising", note: "Cost-of-living pressure should be modeled explicitly." },
      { label: "Crime data", direction: "unknown", value: "limited", note: "2024 state-level coverage needs validation." }
    ],
    modelFit: ["migration", "tourism", "retirement income", "real estate", "hurricane risk"],
    scoutingReport: {
      strengths: ["Population inflow", "Tourism engine", "Large retirement-income base"],
      weakSpots: ["Insurance pressure", "Incomplete crime data", "Hurricane exposure"],
      policyLevers: ["Resilience infrastructure", "Housing supply", "Health system capacity"]
    }
  },
  {
    id: "california",
    name: "California",
    shortName: "California",
    abbreviation: "CA",
    nickname: "Innovation Giant",
    country: "United States",
    kind: "state",
    colors: { primary: "#b13a2d", secondary: "#0b5e3c", accent: "#f5c542" },
    populationMillions: 39.4,
    gdpBillionLocal: 4251,
    currency: "USD",
    gdpPerCapitaLocal: 107900,
    realGrowthPct: null,
    nominalGrowthPct: 6.0,
    violentCrime: { value: 486, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts/FBI and California DOJ/PPIC", sourceUrl: "https://usafacts.org/answers/what-is-the-crime-rate-in-the-us/state/california/" },
    propertyCrime: { value: 2078, unit: "per 100k", year: "2024", quality: "comparable", source: "USAFacts / FBI CDE", sourceUrl: "https://usafacts.org/answers/what-is-the-crime-rate-in-the-us/state/california/" },
    overdoseDeaths: { value: 22.9, unit: "per 100k", year: "2024", quality: "comparable", source: "CDC via USAFacts", sourceUrl: "https://usafacts.org/answers/how-many-drug-overdose-deaths-happen-every-year-in-the-us/state/california/" },
    lifeExpectancy: { value: null, unit: "years", year: "latest", quality: "limited", source: "CDC/NCHS harmonization pending" },
    studentOutcome: { value: null, unit: "index", year: "TBD", quality: "limited", source: "NAEP/PISA harmonization pending" },
    affordability: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs housing-cost/income harmonization" },
    fiscalCapacity: { value: null, unit: "index", year: "TBD", quality: "limited", source: "Needs state-local fiscal harmonization" },
    trends: [
      { label: "GDP scale", direction: "up", value: "largest", note: "Still the benchmark for economic mass." },
      { label: "Affordability", direction: "down", value: "high pressure", note: "Housing costs should be a separate penalty category." },
      { label: "Growth data", direction: "flat", value: "6.0% nominal", note: "Needs real-growth series for apples-to-apples scoring." }
    ],
    modelFit: ["technology", "ports", "housing constraints", "high GDP per capita", "high cost of living"],
    scoutingReport: {
      strengths: ["Massive GDP", "Technology concentration", "Ports and global capital"],
      weakSpots: ["Housing constraints", "High cost of living", "Elevated property/violent crime rates"],
      policyLevers: ["Housing permitting", "Grid and water resilience", "Public safety execution"]
    }
  }
];

const peerGroupMap: Record<string, string[]> = {
  alberta: ["energy", "high-gdp-per-capita", "resource-economy", "canada"],
  ontario: ["large-economy", "manufacturing", "housing-pressure", "canada"],
  quebec: ["hydro-power", "manufacturing", "social-outcomes", "canada"],
  texas: ["energy", "large-economy", "population-growth", "low-tax"],
  florida: ["population-growth", "tourism", "housing-pressure", "climate-risk"],
  california: ["large-economy", "technology", "housing-pressure", "ports"]
};

const rivalMap: Record<string, string[]> = {
  alberta: ["texas", "saskatchewan", "north-dakota", "oklahoma", "colorado", "british-columbia"],
  ontario: ["california", "new-york", "illinois", "michigan", "quebec", "texas"],
  quebec: ["ontario", "british-columbia", "washington", "massachusetts", "california", "alberta"],
  texas: ["alberta", "california", "florida", "oklahoma", "north-dakota", "georgia"],
  florida: ["texas", "california", "arizona", "georgia", "north-carolina", "ontario"],
  california: ["texas", "ontario", "new-york", "washington", "florida", "quebec"]
};

const registeredCanada = [
  ["british-columbia", "British Columbia", "BC", ["canada", "ports", "housing-pressure", "resource-economy"], ["alberta", "washington", "california", "ontario"]],
  ["saskatchewan", "Saskatchewan", "SK", ["canada", "energy", "resource-economy", "agriculture"], ["alberta", "north-dakota", "texas", "manitoba"]],
  ["manitoba", "Manitoba", "MB", ["canada", "agriculture", "manufacturing"], ["saskatchewan", "north-dakota", "ontario", "minnesota"]],
  ["new-brunswick", "New Brunswick", "NB", ["canada", "atlantic", "small-economy"], ["nova-scotia", "maine", "quebec", "prince-edward-island"]],
  ["nova-scotia", "Nova Scotia", "NS", ["canada", "atlantic", "ports", "universities"], ["new-brunswick", "maine", "massachusetts", "newfoundland-and-labrador"]],
  ["prince-edward-island", "Prince Edward Island", "PE", ["canada", "atlantic", "small-economy"], ["nova-scotia", "new-brunswick", "maine", "vermont"]],
  ["newfoundland-and-labrador", "Newfoundland and Labrador", "NL", ["canada", "energy", "atlantic", "resource-economy"], ["alberta", "nova-scotia", "north-dakota", "texas"]],
  ["yukon", "Yukon", "YT", ["canada", "north", "resource-economy"], ["alaska", "northwest-territories", "british-columbia", "alberta"]],
  ["northwest-territories", "Northwest Territories", "NT", ["canada", "north", "resource-economy"], ["yukon", "alaska", "nunavut", "alberta"]],
  ["nunavut", "Nunavut", "NU", ["canada", "north", "small-economy"], ["northwest-territories", "yukon", "alaska", "newfoundland-and-labrador"]]
] as const;

const registeredStates = [
  ["alabama", "Alabama", "AL", ["manufacturing", "low-tax", "southern"], ["tennessee", "georgia", "mississippi", "texas"]],
  ["alaska", "Alaska", "AK", ["energy", "resource-economy", "north"], ["yukon", "northwest-territories", "alberta", "wyoming"]],
  ["arizona", "Arizona", "AZ", ["population-growth", "housing-pressure", "southwest"], ["florida", "texas", "nevada", "colorado"]],
  ["arkansas", "Arkansas", "AR", ["low-tax", "southern", "manufacturing"], ["oklahoma", "missouri", "tennessee", "texas"]],
  ["colorado", "Colorado", "CO", ["energy", "technology", "housing-pressure"], ["alberta", "texas", "utah", "washington"]],
  ["connecticut", "Connecticut", "CT", ["high-income", "finance", "northeast"], ["massachusetts", "new-york", "new-jersey", "ontario"]],
  ["delaware", "Delaware", "DE", ["small-economy", "finance", "business-formation"], ["new-jersey", "maryland", "virginia", "florida"]],
  ["georgia", "Georgia", "GA", ["population-growth", "logistics", "southern"], ["texas", "florida", "north-carolina", "tennessee"]],
  ["hawaii", "Hawaii", "HI", ["tourism", "housing-pressure", "island"], ["florida", "california", "alaska", "nevada"]],
  ["idaho", "Idaho", "ID", ["population-growth", "low-tax", "mountain"], ["utah", "montana", "arizona", "alberta"]],
  ["illinois", "Illinois", "IL", ["large-economy", "manufacturing", "logistics"], ["ontario", "michigan", "new-york", "california"]],
  ["indiana", "Indiana", "IN", ["manufacturing", "low-tax", "midwest"], ["michigan", "ohio", "ontario", "illinois"]],
  ["iowa", "Iowa", "IA", ["agriculture", "manufacturing", "midwest"], ["saskatchewan", "nebraska", "minnesota", "manitoba"]],
  ["kansas", "Kansas", "KS", ["agriculture", "energy", "midwest"], ["oklahoma", "nebraska", "texas", "saskatchewan"]],
  ["kentucky", "Kentucky", "KY", ["manufacturing", "southern", "logistics"], ["tennessee", "indiana", "ohio", "alabama"]],
  ["louisiana", "Louisiana", "LA", ["energy", "ports", "southern"], ["texas", "alberta", "mississippi", "florida"]],
  ["maine", "Maine", "ME", ["northeast", "small-economy", "coastal"], ["new-brunswick", "nova-scotia", "vermont", "new-hampshire"]],
  ["maryland", "Maryland", "MD", ["high-income", "government", "ports"], ["virginia", "delaware", "new-jersey", "massachusetts"]],
  ["massachusetts", "Massachusetts", "MA", ["technology", "education", "high-income"], ["quebec", "california", "connecticut", "ontario"]],
  ["michigan", "Michigan", "MI", ["manufacturing", "auto", "midwest"], ["ontario", "ohio", "indiana", "illinois"]],
  ["minnesota", "Minnesota", "MN", ["health", "manufacturing", "midwest"], ["manitoba", "ontario", "iowa", "wisconsin"]],
  ["mississippi", "Mississippi", "MS", ["southern", "low-cost", "small-economy"], ["alabama", "arkansas", "louisiana", "tennessee"]],
  ["missouri", "Missouri", "MO", ["logistics", "manufacturing", "midwest"], ["illinois", "kansas", "arkansas", "tennessee"]],
  ["montana", "Montana", "MT", ["resource-economy", "mountain", "low-density"], ["alberta", "idaho", "wyoming", "north-dakota"]],
  ["nebraska", "Nebraska", "NE", ["agriculture", "midwest", "low-tax"], ["iowa", "kansas", "south-dakota", "saskatchewan"]],
  ["nevada", "Nevada", "NV", ["tourism", "population-growth", "low-tax"], ["florida", "arizona", "california", "texas"]],
  ["new-hampshire", "New Hampshire", "NH", ["low-tax", "northeast", "small-economy"], ["vermont", "maine", "massachusetts", "florida"]],
  ["new-jersey", "New Jersey", "NJ", ["high-income", "ports", "northeast"], ["new-york", "connecticut", "maryland", "ontario"]],
  ["new-mexico", "New Mexico", "NM", ["energy", "southwest", "low-density"], ["texas", "arizona", "colorado", "alberta"]],
  ["new-york", "New York", "NY", ["large-economy", "finance", "housing-pressure"], ["ontario", "california", "new-jersey", "illinois"]],
  ["north-carolina", "North Carolina", "NC", ["population-growth", "technology", "manufacturing"], ["georgia", "florida", "texas", "virginia"]],
  ["north-dakota", "North Dakota", "ND", ["energy", "resource-economy", "agriculture"], ["alberta", "saskatchewan", "texas", "montana"]],
  ["ohio", "Ohio", "OH", ["manufacturing", "midwest", "large-economy"], ["ontario", "michigan", "indiana", "pennsylvania"]],
  ["oklahoma", "Oklahoma", "OK", ["energy", "low-tax", "southern"], ["texas", "alberta", "arkansas", "kansas"]],
  ["oregon", "Oregon", "OR", ["ports", "technology", "housing-pressure"], ["washington", "british-columbia", "california", "colorado"]],
  ["pennsylvania", "Pennsylvania", "PA", ["manufacturing", "energy", "large-economy"], ["ohio", "new-york", "ontario", "michigan"]],
  ["rhode-island", "Rhode Island", "RI", ["small-economy", "northeast", "coastal"], ["connecticut", "massachusetts", "delaware", "nova-scotia"]],
  ["south-carolina", "South Carolina", "SC", ["manufacturing", "population-growth", "southern"], ["georgia", "north-carolina", "tennessee", "florida"]],
  ["south-dakota", "South Dakota", "SD", ["low-tax", "agriculture", "small-economy"], ["north-dakota", "nebraska", "wyoming", "saskatchewan"]],
  ["tennessee", "Tennessee", "TN", ["population-growth", "manufacturing", "low-tax"], ["texas", "georgia", "north-carolina", "alabama"]],
  ["utah", "Utah", "UT", ["population-growth", "technology", "mountain"], ["colorado", "idaho", "arizona", "texas"]],
  ["vermont", "Vermont", "VT", ["small-economy", "northeast", "quality-of-life"], ["new-hampshire", "maine", "quebec", "prince-edward-island"]],
  ["virginia", "Virginia", "VA", ["high-income", "government", "technology"], ["maryland", "north-carolina", "texas", "ontario"]],
  ["washington", "Washington", "WA", ["technology", "ports", "housing-pressure"], ["british-columbia", "california", "oregon", "quebec"]],
  ["west-virginia", "West Virginia", "WV", ["energy", "resource-economy", "appalachia"], ["pennsylvania", "kentucky", "ohio", "alberta"]],
  ["wisconsin", "Wisconsin", "WI", ["manufacturing", "agriculture", "midwest"], ["minnesota", "michigan", "ontario", "iowa"]],
  ["wyoming", "Wyoming", "WY", ["energy", "low-tax", "resource-economy"], ["alberta", "north-dakota", "texas", "montana"]]
] as const;

export const jurisdictionDirectory: JurisdictionDirectoryEntry[] = [
  ...jurisdictions.map((profile) => ({
    id: profile.id,
    name: profile.name,
    abbreviation: profile.abbreviation,
    country: profile.country,
    kind: profile.kind,
    colors: profile.colors,
    peerGroups: peerGroupMap[profile.id] ?? [],
    dataStatus: "profiled" as const,
    dataCompleteness: profileCompleteness(profile),
    suggestedRivals: rivalMap[profile.id] ?? []
  })),
  ...registeredCanada.map(([id, name, abbreviation, peerGroups, suggestedRivals]) =>
    registeredEntry(id, name, abbreviation, "Canada", "province", peerGroups, suggestedRivals)
  ),
  ...registeredStates.map(([id, name, abbreviation, peerGroups, suggestedRivals]) =>
    registeredEntry(id, name, abbreviation, "United States", "state", peerGroups, suggestedRivals)
  )
].sort((a, b) => a.name.localeCompare(b.name));

export function richProfileFor(id: string): JurisdictionProfile | undefined {
  return jurisdictions.find((profile) => profile.id === id);
}

export function directoryEntryFor(id: string): JurisdictionDirectoryEntry | undefined {
  return jurisdictionDirectory.find((entry) => entry.id === id);
}

export function suggestedRivalsFor(id: string): JurisdictionDirectoryEntry[] {
  const entry = directoryEntryFor(id);
  if (!entry) return [];
  return entry.suggestedRivals
    .map((rivalId) => directoryEntryFor(rivalId))
    .filter((rival): rival is JurisdictionDirectoryEntry => Boolean(rival));
}

function registeredEntry(
  id: string,
  name: string,
  abbreviation: string,
  country: "Canada" | "United States",
  kind: JurisdictionKind,
  peerGroups: readonly string[],
  suggestedRivals: readonly string[]
): JurisdictionDirectoryEntry {
  return {
    id,
    name,
    abbreviation,
    country,
    kind,
    colors: country === "Canada" ? { primary: "#12695f", secondary: "#d8efe5", accent: "#f6c343" } : { primary: "#2f5d8c", secondary: "#e7eef8", accent: "#bf0d3e" },
    peerGroups: [...peerGroups],
    dataStatus: "registered",
    dataCompleteness: 0.12,
    suggestedRivals: [...suggestedRivals]
  };
}

function profileCompleteness(profile: JurisdictionProfile): number {
  const metrics = [
    profile.violentCrime,
    profile.propertyCrime,
    profile.overdoseDeaths,
    profile.lifeExpectancy,
    profile.studentOutcome,
    profile.affordability,
    profile.fiscalCapacity
  ];
  const observed = metrics.filter((metric) => metric.value !== null).length;
  const quality = metrics.reduce((sum, metric) => {
    if (metric.quality === "comparable") return sum + 1;
    if (metric.quality === "directional") return sum + 0.65;
    return sum + 0.25;
  }, 0);
  return Math.round(((observed / metrics.length) * 0.7 + (quality / metrics.length) * 0.3) * 100) / 100;
}

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

export function metricRegistry(profile: JurisdictionProfile) {
  return [
    {
      key: "gdp",
      label: "GDP",
      category: "Economy",
      value: gdpCadEquivalent(profile),
      displayValue: `${currency(gdpCadEquivalent(profile))}B CAD eq.`,
      detail: `${currency(profile.gdpBillionLocal)}B ${profile.currency}`,
      quality: "comparable" as MetricQuality,
      year: "2024",
      source: profile.country === "Canada" ? "Statistics Canada provincial accounts" : "BEA GDP by state"
    },
    {
      key: "gdp-per-capita",
      label: "GDP / person",
      category: "Prosperity",
      value: gdpPerCapitaCadEquivalent(profile),
      displayValue: `${numberCompact(gdpPerCapitaCadEquivalent(profile))} CAD eq.`,
      detail: `${numberCompact(profile.gdpPerCapitaLocal)} ${profile.currency}`,
      quality: "comparable" as MetricQuality,
      year: "2024",
      source: "GDP divided by resident population; FX conversion for U.S. states"
    },
    {
      key: "growth",
      label: "Growth",
      category: "Momentum",
      value: profile.realGrowthPct,
      displayValue: profile.realGrowthPct === null ? "Needs live series" : `${profile.realGrowthPct.toFixed(1)}%`,
      detail: profile.nominalGrowthPct === null ? "real GDP preferred" : `${profile.nominalGrowthPct.toFixed(1)}% nominal`,
      quality: profile.realGrowthPct === null ? ("limited" as MetricQuality) : ("comparable" as MetricQuality),
      year: "2024",
      source: profile.country === "Canada" ? "Statistics Canada real GDP by province" : "BEA real GDP by state pending"
    },
    { key: "violent-crime", label: "Violent crime", category: "Safety", ...metricToRegistry(profile.violentCrime) },
    { key: "property-crime", label: "Property crime", category: "Safety", ...metricToRegistry(profile.propertyCrime) },
    { key: "overdose-deaths", label: "Overdose deaths", category: "Health", ...metricToRegistry(profile.overdoseDeaths) },
    { key: "life-expectancy", label: "Life expectancy", category: "Health", ...metricToRegistry(profile.lifeExpectancy) },
    { key: "student-outcome", label: "Student outcomes", category: "Education", ...metricToRegistry(profile.studentOutcome) },
    { key: "affordability", label: "Affordability", category: "Affordability", ...metricToRegistry(profile.affordability) },
    { key: "fiscal-capacity", label: "Fiscal capacity", category: "Government", ...metricToRegistry(profile.fiscalCapacity) }
  ];
}

function metricToRegistry(metric: JurisdictionMetric) {
  return {
    value: metric.value,
    displayValue: metric.value === null ? "TBD" : `${metric.value.toLocaleString("en-CA", { maximumFractionDigits: 1 })} ${metric.unit}`,
    detail: metric.note ?? metric.source,
    quality: metric.quality,
    year: metric.year,
    source: metric.source,
    sourceUrl: metric.sourceUrl
  };
}

function currency(value: number) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(value);
}

function numberCompact(value: number) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}
