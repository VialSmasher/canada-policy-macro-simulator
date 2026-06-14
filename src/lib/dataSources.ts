import type { MacroBaseline } from "./types";

const STATCAN_WDS = "https://www150.statcan.gc.ca/t1/wds/rest";
const BOC_VALET = "https://www.bankofcanada.ca/valet/observations";

const vectorCandidates = {
  headlineCpiIndex: [41690973, 41690914, 41693271],
  realGdpIndex: [2063744, 38000064, 3902221],
  capexProxy: [3830155, 3830156, 3830157],
  employmentProxy: [2062811, 2062812, 2062813]
};

export function fallbackBaseline(notes: string[] = []): MacroBaseline {
  return {
    realGdpGrowth: 1.6,
    headlineCpi: 2.7,
    policyRate: 4.75,
    capexGrowth: 1.2,
    employmentGrowth: 1.0,
    consumptionShare: 0.56,
    investmentShare: 0.23,
    governmentShare: 0.22,
    netExportsShare: -0.01,
    regionalInvestmentMultipliers: {
      Canada: 1,
      Alberta: 1.32,
      Ontario: 0.94,
      Quebec: 0.91,
      "British Columbia": 1.04,
      Saskatchewan: 1.21,
      Atlantic: 0.86
    },
    sourceQuality: "fallback",
    sourceNotes: [
      ...notes,
      "Fallback priors are conservative historical anchors used only when live public sources fail.",
      "National expenditure shares are normalized model shares for scenario comparison."
    ],
    observedAtUtc: new Date().toISOString()
  };
}

export async function buildBaseline(signal?: AbortSignal, timeoutMs = 7000): Promise<MacroBaseline> {
  const notes: string[] = [];
  const fallback = fallbackBaseline(notes);
  const timeout = createTimeoutSignal(signal, timeoutMs);

  const [headlineCpi, realGdpGrowth, capexGrowth, employmentGrowth, policyRate] = await Promise.all([
    fetchStatCanGrowth(vectorCandidates.headlineCpiIndex, 12, "headline CPI", notes, timeout.signal),
    fetchStatCanGrowth(vectorCandidates.realGdpIndex, 12, "real GDP", notes, timeout.signal),
    fetchStatCanGrowth(vectorCandidates.capexProxy, 4, "capex", notes, timeout.signal),
    fetchStatCanGrowth(vectorCandidates.employmentProxy, 12, "employment", notes, timeout.signal),
    fetchBocPolicyRate(notes, timeout.signal)
  ]);
  timeout.clear();

  const liveCount = [headlineCpi, realGdpGrowth, capexGrowth, employmentGrowth, policyRate].filter(
    (value) => value !== null
  ).length;

  return {
    ...fallback,
    realGdpGrowth: realGdpGrowth ?? fallback.realGdpGrowth,
    headlineCpi: headlineCpi ?? fallback.headlineCpi,
    policyRate: policyRate ?? fallback.policyRate,
    capexGrowth: capexGrowth ?? fallback.capexGrowth,
    employmentGrowth: employmentGrowth ?? fallback.employmentGrowth,
    sourceQuality: liveCount === 5 ? "live" : liveCount > 0 ? "mixed" : "fallback",
    sourceNotes: notes.length > 0 ? notes : ["All target indicators resolved from live public sources."],
    observedAtUtc: new Date().toISOString()
  };
}

function createTimeoutSignal(parent: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort("baseline refresh timed out"), timeoutMs);
  const abort = () => controller.abort(parent?.reason ?? "baseline refresh aborted");
  if (parent?.aborted) abort();
  parent?.addEventListener("abort", abort, { once: true });
  return {
    signal: controller.signal,
    clear: () => {
      globalThis.clearTimeout(timeoutId);
      parent?.removeEventListener("abort", abort);
    }
  };
}

async function fetchStatCanGrowth(
  vectorIds: number[],
  periods: number,
  label: string,
  notes: string[],
  signal?: AbortSignal
): Promise<number | null> {
  for (const vectorId of vectorIds) {
    const url = new URL(`${STATCAN_WDS}/getDataFromVectorByReferencePeriodRange`);
    url.searchParams.set("vectorIds", `"${vectorId}"`);
    url.searchParams.set("startRefPeriod", "2018-01-01");
    url.searchParams.set("endReferencePeriod", "2035-12-31");

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const values = extractNumericValues(await response.json());
      if (values.length > periods) {
        const oldValue = values[values.length - periods - 1];
        const newValue = values[values.length - 1];
        if (oldValue !== 0 && Number.isFinite(oldValue) && Number.isFinite(newValue)) {
          notes.push(`${label} fetched from StatCan vector ${vectorId}.`);
          return (newValue / oldValue - 1) * 100;
        }
      }
    } catch (error) {
      notes.push(`${label} StatCan vector ${vectorId} unavailable: ${String(error).slice(0, 110)}.`);
    }
  }
  notes.push(`${label} fell back after all StatCan vector candidates failed.`);
  return null;
}

async function fetchBocPolicyRate(notes: string[], signal?: AbortSignal): Promise<number | null> {
  for (const series of ["V39079", "V80691311", "V122530"]) {
    try {
      const response = await fetch(`${BOC_VALET}/${series}/json`, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const values = (payload.observations ?? [])
        .map((observation: Record<string, { v?: string }>) => Number(observation[series]?.v))
        .filter((value: number) => Number.isFinite(value));
      if (values.length > 0) {
        notes.push(`policy rate fetched from Bank of Canada Valet series ${series}.`);
        return values[values.length - 1];
      }
    } catch (error) {
      notes.push(`Bank of Canada series ${series} unavailable: ${String(error).slice(0, 110)}.`);
    }
  }
  notes.push("policy rate fell back after Bank of Canada candidates failed.");
  return null;
}

function extractNumericValues(node: unknown): number[] {
  const values: number[] = [];
  const walk = (item: unknown) => {
    if (Array.isArray(item)) {
      item.forEach(walk);
      return;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if ("value" in record) {
        const value = Number(record.value);
        if (Number.isFinite(value)) values.push(value);
      }
      Object.values(record).forEach(walk);
    }
  };
  walk(node);
  return values;
}
