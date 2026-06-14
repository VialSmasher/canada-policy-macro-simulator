import {
  directoryEntryFor,
  jurisdictionDirectory,
  jurisdictions,
  scoreJurisdiction,
  type JurisdictionDirectoryEntry,
  type JurisdictionProfile
} from "./jurisdictions";

export type LeagueDivisionId =
  | "overall"
  | "canada"
  | "us-states"
  | "energy"
  | "large-economies"
  | "growth"
  | "safety"
  | "affordability"
  | "data-complete";

export type FormSignal = "up" | "flat" | "down" | "unknown";

export interface LeagueDivision {
  id: LeagueDivisionId;
  label: string;
  description: string;
}

export interface LeagueStanding {
  profile: JurisdictionProfile;
  entry: JurisdictionDirectoryEntry;
  score: ReturnType<typeof scoreJurisdiction>;
  currentRank: number;
  previousRank: number | null;
  movement: number | null;
  form: FormSignal[];
  gapToLeader: number;
  topStrength: string;
  biggestWeakness: string;
  closestRivalId: string;
  leaderRivalId: string;
  dataConfidence: "high" | "medium" | "low";
  divisionTags: string[];
}

export const leagueDivisions: LeagueDivision[] = [
  { id: "overall", label: "Overall", description: "All fully profiled jurisdictions." },
  { id: "canada", label: "Canada", description: "Canadian provinces with current profile cards." },
  { id: "us-states", label: "U.S. States", description: "U.S. states with current profile cards." },
  { id: "energy", label: "Energy", description: "Resource and energy-exposed peers." },
  { id: "large-economies", label: "Large Economies", description: "Large-scale markets and mega-regions." },
  { id: "growth", label: "Growth", description: "Ranked by growth score first." },
  { id: "safety", label: "Safety", description: "Ranked by safety score first." },
  { id: "affordability", label: "Affordability", description: "Housing-pressure peers until real affordability data lands." },
  { id: "data-complete", label: "Data Complete", description: "Best-current data coverage and source confidence." }
];

const previousRankSeed: Record<string, number> = {
  texas: 1,
  california: 2,
  alberta: 3,
  florida: 4,
  ontario: 5,
  quebec: 6
};

const formSeed: Record<string, FormSignal[]> = {
  california: ["up", "up", "flat", "up", "flat"],
  alberta: ["up", "flat", "down", "up", "flat"],
  texas: ["down", "up", "up", "unknown", "flat"],
  florida: ["up", "flat", "unknown", "down", "flat"],
  ontario: ["flat", "down", "flat", "unknown", "down"],
  quebec: ["flat", "flat", "up", "unknown", "down"]
};

export function buildLeagueStandings(divisionId: LeagueDivisionId): LeagueStanding[] {
  const candidates = jurisdictions.filter((profile) => matchesDivision(profile, divisionId));
  const ranked = [...candidates].sort((a, b) => divisionScore(b, divisionId) - divisionScore(a, divisionId));
  const previousRanks = previousRankMap(ranked);
  const leaderScore = ranked.length ? divisionScore(ranked[0], divisionId) : 0;

  return ranked.map((profile, index) => {
    const entry = directoryEntryFor(profile.id) ?? fallbackEntry(profile);
    const score = scoreJurisdiction(profile);
    const currentRank = index + 1;
    const previousRank = previousRanks.get(profile.id) ?? null;
    const movement = previousRank === null ? null : previousRank - currentRank;
    const scoreValue = divisionScore(profile, divisionId);
    const rival = ranked[index === 0 ? 1 : index - 1] ?? ranked[0] ?? profile;

    return {
      profile,
      entry,
      score,
      currentRank,
      previousRank,
      movement,
      form: formSeed[profile.id] ?? ["unknown", "unknown", "unknown", "unknown", "unknown"],
      gapToLeader: Math.max(0, Math.round(leaderScore - scoreValue)),
      topStrength: topCategory(score),
      biggestWeakness: weakCategory(profile, score),
      closestRivalId: rival.id,
      leaderRivalId: ranked[0]?.id ?? profile.id,
      dataConfidence: dataConfidence(entry.dataCompleteness),
      divisionTags: entry.peerGroups
    };
  });
}

export function findStanding(divisionId: LeagueDivisionId, id: string): LeagueStanding | undefined {
  return buildLeagueStandings(divisionId).find((standing) => standing.profile.id === id);
}

function matchesDivision(profile: JurisdictionProfile, divisionId: LeagueDivisionId): boolean {
  const entry = directoryEntryFor(profile.id);
  if (divisionId === "overall") return true;
  if (divisionId === "canada") return profile.country === "Canada";
  if (divisionId === "us-states") return profile.country === "United States";
  if (divisionId === "growth") return true;
  if (divisionId === "safety") return true;
  if (divisionId === "data-complete") return (entry?.dataCompleteness ?? 0) >= 0.45;
  if (divisionId === "large-economies") return Boolean(entry?.peerGroups.includes("large-economy"));
  if (divisionId === "energy") return Boolean(entry?.peerGroups.some((tag) => ["energy", "resource-economy"].includes(tag)));
  if (divisionId === "affordability") return Boolean(entry?.peerGroups.includes("housing-pressure"));
  return true;
}

function divisionScore(profile: JurisdictionProfile, divisionId: LeagueDivisionId): number {
  const score = scoreJurisdiction(profile);
  if (divisionId === "growth") return score.growth;
  if (divisionId === "safety") return score.safety ?? 0;
  if (divisionId === "data-complete") return (directoryEntryFor(profile.id)?.dataCompleteness ?? 0) * 100;
  return score.overall;
}

function previousRankMap(profiles: JurisdictionProfile[]) {
  const sorted = [...profiles].sort((a, b) => (previousRankSeed[a.id] ?? 999) - (previousRankSeed[b.id] ?? 999));
  return new Map(sorted.map((profile, index) => [profile.id, previousRankSeed[profile.id] ? index + 1 : null]));
}

function topCategory(score: ReturnType<typeof scoreJurisdiction>) {
  const values = [
    ["Prosperity", score.prosperity],
    ["Growth", score.growth],
    ["Safety", score.safety ?? 0],
    ["Health", score.health ?? 0]
  ] as const;
  return [...values].sort((a, b) => b[1] - a[1])[0][0];
}

function weakCategory(profile: JurisdictionProfile, score: ReturnType<typeof scoreJurisdiction>) {
  if (profile.affordability.value === null) return "Affordability data";
  const values = [
    ["Prosperity", score.prosperity],
    ["Growth", score.growth],
    ["Safety", score.safety ?? 0],
    ["Health", score.health ?? 0]
  ] as const;
  return [...values].sort((a, b) => a[1] - b[1])[0][0];
}

function dataConfidence(completeness: number): LeagueStanding["dataConfidence"] {
  if (completeness >= 0.75) return "high";
  if (completeness >= 0.4) return "medium";
  return "low";
}

function fallbackEntry(profile: JurisdictionProfile): JurisdictionDirectoryEntry {
  return {
    id: profile.id,
    name: profile.name,
    abbreviation: profile.abbreviation,
    country: profile.country,
    kind: profile.kind,
    colors: profile.colors,
    peerGroups: [],
    dataStatus: "profiled",
    dataCompleteness: 0,
    suggestedRivals: []
  };
}

export const registeredJurisdictionCount = jurisdictionDirectory.length;
