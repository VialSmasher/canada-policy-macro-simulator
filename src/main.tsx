import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Building2,
  Download,
  Factory,
  Gauge,
  Landmark,
  Minus,
  Pickaxe,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  TrendingDown,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import { buildBaseline, fallbackBaseline } from "./lib/dataSources";
import { profileFor, teachingScenarios, type TeachingScenario } from "./lib/education";
import {
  gdpCadEquivalent,
  gdpPerCapitaCadEquivalent,
  directoryEntryFor,
  jurisdictions,
  jurisdictionDirectory,
  metricRegistry,
  richProfileFor,
  scoreJurisdiction,
  suggestedRivalsFor,
  type JurisdictionDirectoryEntry,
  type JurisdictionMetric,
  type JurisdictionProfile
} from "./lib/jurisdictions";
import {
  buildLeagueStandings,
  leagueDivisions,
  registeredJurisdictionCount,
  type FormSignal,
  type LeagueDivisionId,
  type LeagueStanding
} from "./lib/league";
import { policyLabPolicies, type EvidenceGrade, type OutcomeDirection, type PolicyLabPolicy, type PolicyStatus } from "./lib/policyLab";
import { runPolicySimulation, runStressAudit } from "./lib/svar";
import type { MacroBaseline, PolicyScenario, Province, SimulationRow, StressComparison } from "./lib/types";
import "./styles.css";

const provinces: Province[] = ["Canada", "Alberta", "Ontario", "Quebec", "British Columbia", "Saskatchewan", "Atlantic"];

const defaultScenario: PolicyScenario = {
  province: "Alberta",
  rateShockBps: 100,
  corporateTaxDeltaPp: -2,
  infrastructureSpendDeltaPct: 15,
  energyPriceDeltaPct: 10,
  consumptionTaxDeltaPp: 0,
  horizonMonths: 24
};

function App() {
  const [activeView, setActiveView] = useState<"scoreboard" | "matchup" | "policy" | "simulator">("policy");
  const [matchupPair, setMatchupPair] = useState({ leftId: "alberta", rightId: "texas" });
  const [baseline, setBaseline] = useState<MacroBaseline>(fallbackBaseline(["Live baseline has not loaded yet."]));
  const [scenario, setScenario] = useState<PolicyScenario>(defaultScenario);
  const [selectedScenarioId, setSelectedScenarioId] = useState("ab-pipeline");
  const [loadingBaseline, setLoadingBaseline] = useState(true);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  const result = useMemo(() => runPolicySimulation(scenario, baseline, true), [scenario, baseline]);
  const neutralScenario = useMemo<PolicyScenario>(
    () => ({
      province: scenario.province,
      rateShockBps: 0,
      corporateTaxDeltaPp: 0,
      infrastructureSpendDeltaPct: 0,
      energyPriceDeltaPct: 0,
      consumptionTaxDeltaPp: 0,
      horizonMonths: scenario.horizonMonths
    }),
    [scenario.province, scenario.horizonMonths]
  );
  const neutralResult = useMemo(() => runPolicySimulation(neutralScenario, baseline, true), [neutralScenario, baseline]);
  const stress = useMemo(() => runStressAudit(baseline), [baseline]);
  const economy = useMemo(() => profileFor(scenario.province), [scenario.province]);
  const selectedScenario = useMemo(
    () => teachingScenarios.find((item) => item.id === selectedScenarioId),
    [selectedScenarioId]
  );
  const impact = useMemo(
    () => estimateImpact(result.rows, neutralResult.rows, economy.nominalGdpBillion, selectedScenario),
    [result.rows, neutralResult.rows, economy.nominalGdpBillion, selectedScenario]
  );

  useEffect(() => {
    const controller = new AbortController();
    void refreshBaseline(controller.signal);
    return () => controller.abort();
  }, []);

  async function refreshBaseline(signal?: AbortSignal) {
    setLoadingBaseline(true);
    setBaselineError(null);
    try {
      setBaseline(await buildBaseline(signal));
    } catch (error) {
      setBaselineError(String(error));
      setBaseline(fallbackBaseline([`Live baseline refresh failed: ${String(error).slice(0, 130)}.`]));
    } finally {
      setLoadingBaseline(false);
    }
  }

  function updateScenario<K extends keyof PolicyScenario>(key: K, value: PolicyScenario[K]) {
    setSelectedScenarioId("custom");
    setScenario((current) => ({ ...current, [key]: value }));
  }

  function applyTeachingScenario(item: TeachingScenario) {
    setSelectedScenarioId(item.id);
    setScenario(item.scenario);
  }

  function openMatchup(leftId: string, rightId: string) {
    setMatchupPair({ leftId, rightId });
    setActiveView("matchup");
  }

  function exportCurrentView() {
    if (activeView === "policy") {
      downloadJson("policy-league-evidence.json", {
        exportedAt: new Date().toISOString(),
        policies: policyLabPolicies,
        profiledJurisdictions: jurisdictions,
        directorySize: jurisdictionDirectory.length
      });
      return;
    }

    downloadJson("simulation-result.json", result);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">
            <Landmark size={16} />
            Canada + US framework
          </div>
          <h1 className="app-title">
            <span className="desktop-title">Policy League</span>
            <span className="mobile-title">Policy Lab</span>
          </h1>
        </div>
        <div className={`topbar-actions ${activeView === "simulator" ? "" : "single"}`.trim()}>
          {activeView === "simulator" ? (
            <button className="ghost-button" onClick={() => void refreshBaseline()} disabled={loadingBaseline}>
              <RefreshCw size={17} className={loadingBaseline ? "spin" : ""} />
              <span className="desktop-label">Refresh baseline</span>
              <span className="mobile-label">Refresh</span>
            </button>
          ) : null}
          <button className="primary-button" onClick={exportCurrentView}>
            <Download size={17} />
            <span className="desktop-label">{activeView === "policy" ? "Export evidence" : "Export run"}</span>
            <span className="mobile-label">Export</span>
          </button>
        </div>
      </header>

      <div className="view-switch">
        <button className={activeView === "policy" ? "active" : ""} onClick={() => setActiveView("policy")}>
          Policy Lab
        </button>
        <button className={activeView === "scoreboard" ? "active" : ""} onClick={() => setActiveView("scoreboard")}>
          Scoreboard
        </button>
        <button className={activeView === "matchup" ? "active" : ""} onClick={() => setActiveView("matchup")}>
          Matchup
        </button>
        <button className={activeView === "simulator" ? "active" : ""} onClick={() => setActiveView("simulator")}>
          Sandbox
        </button>
      </div>

      {activeView === "scoreboard" ? (
        <JurisdictionScoreboard onCompare={openMatchup} />
      ) : activeView === "matchup" ? (
        <MatchupMode
          leftId={matchupPair.leftId}
          rightId={matchupPair.rightId}
          onLeftChange={(leftId) => setMatchupPair((current) => ({ ...current, leftId }))}
          onRightChange={(rightId) => setMatchupPair((current) => ({ ...current, rightId }))}
          onPairChange={(leftId, rightId) => setMatchupPair({ leftId, rightId })}
        />
      ) : activeView === "policy" ? (
        <PolicyLab />
      ) : (
        <>
          <section className="story-band">
            <EconomySnapshot economy={economy} impact={impact} />
            <ScenarioCards selectedScenarioId={selectedScenarioId} onSelect={applyTeachingScenario} />
          </section>

          <section className="workspace">
            <aside className="control-rail">
              <div className="panel-title">
                <Gauge size={18} />
                Scenario controls
              </div>
              <label className="field">
                <span>Province / region</span>
                <select value={scenario.province} onChange={(event) => updateScenario("province", event.target.value as Province)}>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>
              <Slider label="Policy rate shock" value={scenario.rateShockBps} min={-400} max={900} step={25} suffix="bps" onChange={(value) => updateScenario("rateShockBps", value)} />
              <Slider label="Corporate tax delta" value={scenario.corporateTaxDeltaPp} min={-15} max={10} step={1} suffix="pp" onChange={(value) => updateScenario("corporateTaxDeltaPp", value)} />
              <Slider label="Infrastructure spend" value={scenario.infrastructureSpendDeltaPct} min={-50} max={150} step={5} suffix="%" onChange={(value) => updateScenario("infrastructureSpendDeltaPct", value)} />
              <Slider label="Energy price shock" value={scenario.energyPriceDeltaPct} min={-75} max={125} step={5} suffix="%" onChange={(value) => updateScenario("energyPriceDeltaPct", value)} />
              <Slider label="Consumption tax delta" value={scenario.consumptionTaxDeltaPp} min={-5} max={8} step={1} suffix="pp" onChange={(value) => updateScenario("consumptionTaxDeltaPp", value)} />
              <Slider label="Horizon" value={scenario.horizonMonths} min={6} max={60} step={1} suffix="months" onChange={(value) => updateScenario("horizonMonths", value)} />
            </aside>

            <section className="analysis-area">
              <div className="metrics-grid">
                <Metric label="GDP dollar swing" value={`${moneySigned(impact.peakGdpDeltaBillion)}B`} Icon={Activity} />
                <Metric label="Revenue signal" value={`${moneySigned(impact.revenueDeltaBillion)}B`} Icon={Landmark} />
                <Metric label="Retail spillover" value={`${moneySigned(impact.retailDeltaBillion)}B`} Icon={Store} />
                <Metric label="Game score" value={`${impact.gameScore}/100`} Icon={Sparkles} />
              </div>

              <div className="two-column story-panels">
                <CausalPanel selectedScenario={selectedScenario} economy={economy} impact={impact} />
                <Scorecard impact={impact} />
              </div>

              <div className="metrics-grid compact-metrics">
                <Metric label="GDP range" value={`${fmt(result.metrics.minGdpGrowth)} to ${fmt(result.metrics.maxGdpGrowth)}%`} Icon={Activity} />
                <Metric label="CPI range" value={`${fmt(result.metrics.minInflation)} to ${fmt(result.metrics.maxInflation)}%`} Icon={BarChart3} />
                <Metric label="Identity gap" value={result.metrics.maxIdentityGap.toExponential(1)} Icon={ShieldCheck} />
                <Metric label="Stability score" value={fmt(result.metrics.stabilityScore)} Icon={Gauge} />
              </div>

              <div className="chart-band">
                <LineChart
                  rows={result.rows}
                  series={[
                    { key: "Y", label: "GDP growth", color: "#12695f" },
                    { key: "headlineCpi", label: "CPI", color: "#aa3f21" },
                    { key: "policyRate", label: "Policy rate", color: "#3d5a99" },
                    { key: "capexGrowth", label: "CapEx", color: "#80562a" }
                  ]}
                />
              </div>

              <div className="two-column">
                <BaselinePanel baseline={baseline} loading={loadingBaseline} error={baselineError} />
                <StressPanel stress={stress} />
              </div>

              <DataTable rows={result.rows} />
            </section>
          </section>
        </>
      )}
    </main>
  );
}

type ImpactEstimate = {
  finalGdpDeltaBillion: number;
  peakGdpDeltaBillion: number;
  directInvestmentBillion: number;
  revenueDeltaBillion: number;
  retailDeltaBillion: number;
  confidence: number;
  growthScore: number;
  affordabilityScore: number;
  fiscalScore: number;
  resilienceScore: number;
  gameScore: number;
};

const policyTargetIds = ["alberta", "nevada", "texas", "california", "ontario", "quebec", "florida"];

type PolicyVerdict = {
  label: string;
  tone: "copy" | "study" | "avoid";
  score: number;
  rationale: string;
  nextSteps: { title: string; body: string }[];
};

function buildPolicyVerdict(policy: PolicyLabPolicy, target: JurisdictionDirectoryEntry): PolicyVerdict {
  const strongerSignals = policy.outcomes.filter((item) => item.grade === "moderate" || item.grade === "strong").length;
  const riskSignals = policy.outcomes.filter((item) => item.direction === "risk" || item.direction === "worse").length;
  const positiveSignals = policy.outcomes.filter((item) => item.direction === "better").length;
  const regionalExamples = policy.jurisdictions.filter((item) => item.region === target.name || item.name.includes(target.name));
  const hasLocalExample = regionalExamples.length > 0;
  const dataBonus = Math.round(target.dataCompleteness * 12);
  const evidenceScore = Math.round((strongerSignals / Math.max(policy.outcomes.length, 1)) * 22);
  const postureScore = hasLocalExample ? 24 : target.kind === "state" ? 10 : 6;
  const directionScore = positiveSignals * 10 - riskSignals * 7;
  const score = clampScore(38 + evidenceScore + postureScore + directionScore + dataBonus);
  const label = score >= 74 && riskSignals <= 1 ? "Copy with guardrails" : score >= 46 ? "Study before copying" : "Build evidence first";
  const tone: PolicyVerdict["tone"] = label.startsWith("Copy") ? "copy" : label.startsWith("Build") ? "avoid" : "study";
  const localText = hasLocalExample
    ? `${target.name} already has a nearby evidence trail through ${regionalExamples.map((item) => item.name).join(" and ")}.`
    : `${target.name} does not have a direct local benchmark in this file yet.`;
  const rationale =
    `${localText} The useful move is to separate operational wins from public outcomes before calling the policy a win.`;

  return {
    label,
    tone,
    score,
    rationale,
    nextSteps: [
      {
        title: "Pick the peer set",
        body: `Match ${target.abbreviation} against places with similar population, call volume, staffing, density, and baseline trend before judging the policy.`
      },
      {
        title: "Demand outcome data",
        body: "Track response time, use-of-force, complaints, cost per incident, and false-negative risk before ranking the program."
      },
      {
        title: "Write the guardrails",
        body: "Define retention limits, allowed call types, public reporting, audit access, and sunset review before scaling."
      }
    ]
  };
}

function PolicyLab() {
  const [selectedPolicyId, setSelectedPolicyId] = useState(policyLabPolicies[0]?.id ?? "");
  const targetOptions = policyTargetIds.map((id) => directoryEntryFor(id)).filter((entry): entry is JurisdictionDirectoryEntry => Boolean(entry));
  const [selectedTargetId, setSelectedTargetId] = useState(targetOptions[0]?.id ?? "alberta");
  const selectedPolicy = policyLabPolicies.find((policy) => policy.id === selectedPolicyId) ?? policyLabPolicies[0];
  const selectedTarget = targetOptions.find((item) => item.id === selectedTargetId) ?? targetOptions[0];
  const scaledCount = selectedPolicy.jurisdictions.filter((item) => item.status === "scaled" || item.status === "benchmark").length;
  const restrictedCount = selectedPolicy.jurisdictions.filter((item) => item.status === "restricted").length;
  const strongerSignals = selectedPolicy.outcomes.filter((item) => item.grade === "moderate" || item.grade === "strong").length;
  const verdict = buildPolicyVerdict(selectedPolicy, selectedTarget);

  return (
    <section className="policy-shell">
      <div className="policy-hero decision-hero">
        <div className="policy-hero-copy">
          <div className="panel-title">
            <ShieldCheck size={18} />
            Policy lab
          </div>
          <h2>Which policy should your jurisdiction copy next?</h2>
          <p>
            Compare adopters, restricted peers, and benchmark jurisdictions before turning a promising idea into a public commitment.
          </p>
        </div>
        <div className={`policy-verdict-card ${verdict.tone}`}>
          <span>Verdict for {selectedTarget.name}</span>
          <strong>{verdict.label}</strong>
          <p>{verdict.rationale}</p>
          <div className="policy-score-line">
            <b>{verdict.score}/100</b>
            <div className="policy-score-track">
              <i style={{ width: `${verdict.score}%` }} />
            </div>
          </div>
        </div>
      </div>

      <section className="policy-control-strip">
        <div className="policy-target-picker">
          <div className="panel-title">
            <Search size={18} />
            Test fit for
          </div>
          <div className="policy-target-options">
            {targetOptions.map((target) => (
              <button
                className={selectedTarget.id === target.id ? "active" : ""}
                key={target.id}
                onClick={() => setSelectedTargetId(target.id)}
                style={{ "--team-primary": target.colors.primary } as React.CSSProperties}
              >
                <FlagMark item={target} className="policy-target-flag" />
                <span>
                  <strong>{target.name}</strong>
                  <small>{target.country} / {target.dataStatus}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="policy-lens-grid">
          <MiniStat label="Policy" value={selectedPolicy.title} detail={selectedPolicy.category} />
          <MiniStat label="Tracked" value={String(selectedPolicy.jurisdictions.length)} detail={`${scaledCount} adopter or benchmark`} />
          <MiniStat label="Evidence" value={`${strongerSignals}/${selectedPolicy.outcomes.length}`} detail="moderate+ signals" />
        </div>
      </section>

      <div className="policy-layout">
        <aside className="policy-list-panel">
          <div className="panel-title">
            <Trophy size={18} />
            Policy families
          </div>
          {policyLabPolicies.map((policy) => (
            <button
              className={selectedPolicy.id === policy.id ? "active" : ""}
              key={policy.id}
              onClick={() => setSelectedPolicyId(policy.id)}
            >
              <strong>{policy.title}</strong>
              <span>{policy.category}</span>
            </button>
          ))}
          <div className="policy-note">
            Next candidates: zoning reform, safe streets, tax incentives, opioid response, and permitting reform.
          </div>
        </aside>

        <section className="policy-detail-panel">
          <div className="policy-detail-header">
            <div>
              <div className="panel-title">
                <Activity size={18} />
                Evidence file
              </div>
              <h2>{selectedPolicy.title}</h2>
              <p>{selectedPolicy.summary}</p>
            </div>
            <div className="policy-decision-card">
              <span>Decision use</span>
              <strong>{selectedPolicy.primaryMetric}</strong>
              <small>{selectedPolicy.decisionUse}</small>
            </div>
          </div>

          <div className="policy-question-band">
            <div>
              <span>Testable claim</span>
              <strong>{selectedPolicy.testableClaim}</strong>
            </div>
            <div>
              <span>Comparison question</span>
              <strong>{selectedPolicy.policyQuestion}</strong>
            </div>
            <div>
              <span>Restricted peers</span>
              <strong>{restrictedCount}</strong>
            </div>
          </div>

          <div className="policy-action-grid">
            {verdict.nextSteps.map((step, index) => (
              <article className="policy-action-card" key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="policy-grid">
            {selectedPolicy.jurisdictions.map((item) => (
              <article className={`policy-jurisdiction-card ${item.status}`} key={item.id}>
                <div className="policy-card-header">
                  <div>
                    <PolicyStatusBadge status={item.status} />
                    <h3>{item.name}</h3>
                    <span>{item.region}</span>
                  </div>
                  <b>{item.adoption}</b>
                </div>
                <p>{item.posture}</p>
                <div className="policy-safeguards">
                  {item.safeguards.slice(0, 3).map((safeguard) => (
                    <span key={safeguard}>{safeguard}</span>
                  ))}
                </div>
                <div className="policy-signal-list">
                  {item.signals.map((signal) => (
                    <div key={`${item.id}-${signal.metric}`}>
                      <strong>{signal.metric}</strong>
                      <span>{signal.adopterSignal}</span>
                      <div>
                        <DirectionPill direction={signal.direction} />
                        <GradePill grade={signal.grade} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <section className="policy-outcome-panel">
            <div className="panel-title">
              <BarChart3 size={18} />
              Outcome board
            </div>
            <div className="policy-outcome-table">
              {selectedPolicy.outcomes.map((outcome) => (
                <div className="policy-outcome-row" key={outcome.metric}>
                  <div>
                    <span>Metric</span>
                    <strong>{outcome.metric}</strong>
                  </div>
                  <div>
                    <span>Adopter signal</span>
                    <strong>{outcome.adopterSignal}</strong>
                  </div>
                  <div>
                    <span>Peer test</span>
                    <strong>{outcome.peerQuestion}</strong>
                  </div>
                  <div className="policy-outcome-tags">
                    <DirectionPill direction={outcome.direction} />
                    <GradePill grade={outcome.grade} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>

      <div className="policy-bottom-grid">
        <section className="policy-method-panel">
          <div className="panel-title">
            <Sparkles size={18} />
            What would make this decision-grade?
          </div>
          <div className="policy-method-list">
            {selectedPolicy.evidenceSteps.map((step, index) => (
              <div key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="policy-method-panel">
          <div className="panel-title">
            <AlertTriangle size={18} />
            Source ledger
          </div>
          <div className="policy-source-list">
            {selectedPolicy.sources.map((source) => (
              <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
                {source.label}
              </a>
            ))}
          </div>
          <p className="policy-note">
            The current labels are intentionally cautious. Program claims should become sortable evidence only after audited dispatch,
            complaint, cost, and incident datasets are connected.
          </p>
        </section>
      </div>
    </section>
  );
}

function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  return <span className={`policy-status ${status}`}>{statusLabel(status)}</span>;
}

function DirectionPill({ direction }: { direction: OutcomeDirection }) {
  return <span className={`policy-pill direction ${direction}`}>{directionLabel(direction)}</span>;
}

function GradePill({ grade }: { grade: EvidenceGrade }) {
  return <span className={`policy-pill grade ${grade}`}>{grade} evidence</span>;
}

function statusLabel(status: PolicyStatus) {
  if (status === "scaled") return "scaled adopter";
  if (status === "pilot") return "pilot";
  if (status === "restricted") return "restricted";
  return "benchmark";
}

function directionLabel(direction: OutcomeDirection) {
  if (direction === "better") return "positive";
  if (direction === "worse") return "negative";
  if (direction === "risk") return "risk";
  return direction;
}

function JurisdictionScoreboard({ onCompare }: { onCompare: (leftId: string, rightId: string) => void }) {
  const [selectedId, setSelectedId] = useState("alberta");
  const [divisionId, setDivisionId] = useState<LeagueDivisionId>("overall");
  const standings = useMemo(() => buildLeagueStandings(divisionId), [divisionId]);
  const selectedStanding = standings.find((item) => item.profile.id === selectedId) ?? standings[0] ?? buildLeagueStandings("overall")[0];
  const selected = selectedStanding.profile;
  const selectedScore = selectedStanding.score;
  const selectedMetrics = metricRegistry(selected);
  const leader = standings[0] ?? selectedStanding;
  const closestRival = standings.find((item) => item.profile.id === selectedStanding.closestRivalId) ?? leader;
  const averageScore = Math.round(standings.reduce((sum, item) => sum + item.score.overall, 0) / Math.max(standings.length, 1));
  const biggestMover = standings
    .filter((item) => item.movement !== null)
    .sort((a, b) => Math.abs(b.movement ?? 0) - Math.abs(a.movement ?? 0))[0];

  return (
    <section className="scoreboard-shell">
      <div className="league-hero">
        <div>
          <div className="panel-title">
            <BarChart3 size={18} />
            League table
          </div>
          <h2>Rank, movement, rivalries, and the path to climb</h2>
          <p>
            Sports standings are compelling because they show pressure: who is rising, who is falling, who is chasing the leader, and what
            weakness is holding each team back. This table uses that grammar for jurisdictions.
          </p>
        </div>
        <div className="league-summary">
          <MiniStat label="Roster" value={String(registeredJurisdictionCount)} detail="registered places" />
          <MiniStat label="Avg score" value={String(averageScore)} detail="prototype index" />
          <MiniStat label="Biggest move" value={movementText(biggestMover?.movement ?? null)} detail={biggestMover?.entry.name ?? "seeded form"} />
        </div>
      </div>

      <section className="division-strip">
        {leagueDivisions.map((division) => (
          <button
            className={divisionId === division.id ? "active" : ""}
            key={division.id}
            title={division.description}
            onClick={() => {
              setDivisionId(division.id);
              const next = buildLeagueStandings(division.id)[0];
              if (next) setSelectedId(next.profile.id);
            }}
          >
            {division.label}
          </button>
        ))}
      </section>

      <div className="league-layout">
        <section className="league-table-panel">
          <div className="panel-title">
            <Trophy size={18} />
            {leagueDivisions.find((item) => item.id === divisionId)?.label ?? "Overall"} standings
          </div>
          <div className="league-table-scroll">
            <table className="league-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Place</th>
                  <th>Score</th>
                  <th>Move</th>
                  <th>Gap</th>
                  <th>Form</th>
                  <th>Strength</th>
                  <th>Weakness</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing) => (
                  <tr
                    className={selectedId === standing.profile.id ? "active" : ""}
                    key={standing.profile.id}
                    style={{ "--team-primary": standing.profile.colors.primary } as React.CSSProperties}
                    onClick={() => setSelectedId(standing.profile.id)}
                  >
                    <td>#{standing.currentRank}</td>
                    <td className="standing-place-cell">
                      <FlagMark item={standing.profile} className="table-team" />
                      <span className="standing-copy">
                        <strong>{standing.profile.name}</strong>
                        <small>{standing.profile.nickname}</small>
                      </span>
                      <span className="mobile-standing-meta">
                        <MovementBadge movement={standing.movement} />
                        <span>{standing.gapToLeader === 0 ? "Leader" : `${standing.gapToLeader} back`}</span>
                        <DataBadge confidence={standing.dataConfidence} completeness={standing.entry.dataCompleteness} />
                      </span>
                    </td>
                    <td>
                      <b>{standing.score.overall}</b>
                    </td>
                    <td>
                      <MovementBadge movement={standing.movement} />
                    </td>
                    <td>{standing.gapToLeader === 0 ? "-" : `-${standing.gapToLeader}`}</td>
                    <td>
                      <FormDots form={standing.form} />
                    </td>
                    <td>{standing.topStrength}</td>
                    <td>{standing.biggestWeakness}</td>
                    <td>
                      <DataBadge confidence={standing.dataConfidence} completeness={standing.entry.dataCompleteness} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="league-side-panel">
          <div className="panel-title">
            <Sparkles size={18} />
            Path to climb
          </div>
          <h2>{selected.name}</h2>
          <p>
            {selectedStanding.gapToLeader === 0
              ? `${selected.name} leads this division. The job is defending the lead with better source coverage.`
              : `${selected.name} trails ${leader.profile.name} by ${selectedStanding.gapToLeader} points in this division.`}
          </p>
          <div className="climb-list">
            <div>
              <span>Top strength</span>
              <strong>{selectedStanding.topStrength}</strong>
            </div>
            <div>
              <span>Biggest drag</span>
              <strong>{selectedStanding.biggestWeakness}</strong>
            </div>
            <div>
              <span>Closest rival</span>
              <strong>{closestRival.profile.name}</strong>
            </div>
          </div>
          <div className="compare-actions">
            <button className="primary-button" onClick={() => onCompare(selected.id, leader.profile.id)} disabled={selected.id === leader.profile.id}>
              <ArrowRightLeft size={16} />
              Compare with leader
            </button>
            <button className="ghost-button" onClick={() => onCompare(selected.id, closestRival.profile.id)} disabled={selected.id === closestRival.profile.id}>
              <ArrowRightLeft size={16} />
              Compare with rival
            </button>
          </div>
          <div className="league-note">
            Movement and form are seeded prototype signals until historical data adapters are connected.
          </div>
        </section>
      </div>

      <section className="comparison-panel selected-team-panel">
          <div className="panel-title">
            <ShieldCheck size={18} />
            Selected team page
          </div>
          <div
            className="team-header"
            style={{ "--team-primary": selected.colors.primary, "--team-secondary": selected.colors.secondary, "--team-accent": selected.colors.accent } as React.CSSProperties}
          >
            <FlagMark item={selected} className="team-mark" />
            <div className="team-title">
              <span>
                #{selectedStanding.currentRank} · {selected.kind} in {selected.country}
              </span>
              <h2>{selected.name}</h2>
              <p>{selected.nickname}</p>
            </div>
            <div className="score-pill">{selectedScore.overall}/100</div>
          </div>

          <div className="team-snapshot-grid">
            <MiniStat label="GDP" value={`${currency(gdpCadEquivalent(selected))}B`} detail="CAD equivalent" />
            <MiniStat label="GDP / person" value={numberCompact(gdpPerCapitaCadEquivalent(selected))} detail="CAD equivalent" />
            <MiniStat label="Population" value={`${fmt(selected.populationMillions)}M`} detail="residents" />
            <MiniStat label="Gap" value={selectedStanding.gapToLeader === 0 ? "Leader" : `-${selectedStanding.gapToLeader}`} detail="to division leader" />
          </div>

          <div className="comparison-metrics">
            {selectedMetrics.slice(0, 6).map((metric) => (
              <CompareMetric
                key={metric.key}
                label={metric.label}
                value={metric.displayValue}
                detail={`${metric.year} · ${metric.source}`}
                quality={metric.quality}
              />
            ))}
          </div>

          <div className="two-column team-detail-grid">
            <article className="stats-card">
              <div className="panel-title">
                <Gauge size={18} />
                Ratings
              </div>
              <ScoreBar label="Prosperity" value={selectedScore.prosperity} />
              <ScoreBar label="Growth" value={selectedScore.growth} />
              <ScoreBar label="Safety" value={selectedScore.safety ?? 0} />
              <ScoreBar label="Health" value={selectedScore.health ?? 0} />
            </article>

            <article className="stats-card">
              <div className="panel-title">
                <TrendingUp size={18} />
                Trending
              </div>
              <div className="trend-list">
                {selected.trends.map((trend) => (
                  <div className={`trend-item ${trend.direction}`} key={trend.label}>
                    <TrendIcon direction={trend.direction} />
                    <div>
                      <strong>{trend.label}</strong>
                      <span>{trend.value}</span>
                      <small>{trend.note}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="scouting-grid">
            <ScoutingList title="Strengths" items={selected.scoutingReport.strengths} />
            <ScoutingList title="Weak spots" items={selected.scoutingReport.weakSpots} />
            <ScoutingList title="Policy levers" items={selected.scoutingReport.policyLevers} />
          </div>

          <section className="stat-sheet">
            <div className="panel-title">
              <BarChart3 size={18} />
              Full stat sheet
            </div>
            <div className="stat-sheet-grid">
              {selectedMetrics.map((metric) => (
                <div className="stat-sheet-row" key={metric.key}>
                  <span>{metric.category}</span>
                  <strong>{metric.label}</strong>
                  <b>{metric.displayValue}</b>
                  <small className={`quality-dot ${metric.quality}`}>{metric.quality}</small>
                </div>
              ))}
            </div>
          </section>
        <section className="method-panel">
          <div className="panel-title">
            <AlertTriangle size={18} />
            Accuracy protocol
          </div>
          <div className="protocol-list">
            <ProtocolItem label="Comparable" text="Same-family statistic, same unit, or a defensible normalized conversion." />
            <ProtocolItem label="Directional" text="Useful signal, but method differs across borders. Good for context, not a clean ranking." />
            <ProtocolItem label="Limited" text="Placeholder, stale series, or pending harmonization. Penalized in the composite score." />
          </div>
          <div className="source-ledger">
            <strong>Selected sources</strong>
            {selectedMetrics.slice(0, 8).map((metric) => (
              <div key={metric.key}>
                <span>{metric.label}</span>
                <small>{metric.source}</small>
              </div>
            ))}
          </div>
        </section>
      </section>
    </section>
  );
}

function MovementBadge({ movement }: { movement: number | null }) {
  const label = movementText(movement);
  const direction = movement === null || movement === 0 ? "flat" : movement > 0 ? "up" : "down";
  return <span className={`movement-badge ${direction}`}>{label}</span>;
}

function movementText(movement: number | null) {
  if (movement === null) return "NEW";
  if (movement === 0) return "-";
  return movement > 0 ? `+${movement}` : String(movement);
}

function FormDots({ form }: { form: FormSignal[] }) {
  return (
    <span className="form-dots" aria-label={`Form ${form.join(", ")}`}>
      {form.map((signal, index) => (
        <i className={signal} key={`${signal}-${index}`} />
      ))}
    </span>
  );
}

function DataBadge({ confidence, completeness }: { confidence: LeagueStanding["dataConfidence"]; completeness: number }) {
  return (
    <span className={`data-badge ${confidence}`}>
      {confidence} · {Math.round(completeness * 100)}%
    </span>
  );
}

type FlagItem = {
  id: string;
  name: string;
  abbreviation: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

function FlagMark({ item, className = "" }: { item: FlagItem; className?: string }) {
  return (
    <span
      aria-label={`${item.name} flag`}
      className={`flag-mark flag-${item.id} ${className}`.trim()}
      style={
        {
          "--team-primary": item.colors.primary,
          "--team-secondary": item.colors.secondary,
          "--team-accent": item.colors.accent
        } as React.CSSProperties
      }
      title={`${item.name} flag`}
    >
      <span>{item.abbreviation}</span>
    </span>
  );
}

type Competitor = {
  entry: JurisdictionDirectoryEntry;
  profile?: JurisdictionProfile;
  score?: ReturnType<typeof scoreJurisdiction>;
};

type MatchupRow = {
  category: string;
  label: string;
  leftValue: string;
  rightValue: string;
  leftNumber: number | null;
  rightNumber: number | null;
  higherBetter: boolean;
  comparable: boolean;
  note: string;
  winner: "left" | "right" | "tie" | "pending" | "context";
};

const featuredMatchups = [
  ["alberta", "texas", "Energy showdown"],
  ["alberta", "california", "Growth vs scale"],
  ["ontario", "california", "Mega-economies"],
  ["ontario", "texas", "Industry vs growth"],
  ["quebec", "washington", "Power and tech"],
  ["florida", "british-columbia", "Migration and housing"]
] as const;

function MatchupMode({
  leftId,
  rightId,
  onLeftChange,
  onRightChange,
  onPairChange
}: {
  leftId: string;
  rightId: string;
  onLeftChange: (id: string) => void;
  onRightChange: (id: string) => void;
  onPairChange: (leftId: string, rightId: string) => void;
}) {
  const left = buildCompetitor(leftId);
  const right = buildCompetitor(rightId);
  const rows = buildMatchupRows(left, right);
  const leftWins = rows.filter((row) => row.winner === "left").length;
  const rightWins = rows.filter((row) => row.winner === "right").length;
  const contextRows = rows.filter((row) => row.winner === "context" || row.winner === "pending").length;
  const suggested = suggestedRivalsFor(left.entry.id).slice(0, 6);
  const path = buildPathToWin(left, right);

  return (
    <section className="matchup-shell">
      <div className="matchup-hero">
        <div>
          <div className="panel-title">
            <ArrowRightLeft size={18} />
            Matchup mode
          </div>
          <h2>Pick two jurisdictions and see who wins each category</h2>
          <p>
            Keep the full roster searchable, but only show the fight you asked for. Fully profiled places get scores; registered places stay
            selectable and clearly marked as data-pending.
          </p>
        </div>
        <div className="matchup-summary">
          <MiniStat label={`${left.entry.abbreviation} wins`} value={String(leftWins)} detail={left.entry.name} />
          <MiniStat label={`${right.entry.abbreviation} wins`} value={String(rightWins)} detail={right.entry.name} />
          <MiniStat label="Context rows" value={String(contextRows)} detail="pending or not apples-to-apples" />
        </div>
      </div>

      <section className="matchup-toolbar">
        <JurisdictionPicker title="Your jurisdiction" selectedId={left.entry.id} onSelect={onLeftChange} />
        <button
          className="swap-button"
          onClick={() => {
            onPairChange(right.entry.id, left.entry.id);
          }}
          aria-label="Swap jurisdictions"
        >
          <ArrowRightLeft size={19} />
        </button>
        <JurisdictionPicker title="Opponent" selectedId={right.entry.id} onSelect={onRightChange} />
      </section>

      <section className="quick-matchups">
        <div>
          <div className="panel-title">
            <Trophy size={18} />
            Featured matchups
          </div>
          <div className="quick-chip-row">
            {featuredMatchups.map(([home, away, label]) => (
              <button
                className="quick-chip"
                key={`${home}-${away}`}
                onClick={() => {
                  onPairChange(home, away);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="panel-title">
            <Search size={18} />
            Suggested rivals for {left.entry.name}
          </div>
          <div className="quick-chip-row">
            {suggested.map((entry) => (
              <button className="quick-chip" key={entry.id} onClick={() => onRightChange(entry.id)}>
                {entry.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="matchup-board">
        <MatchupTeamCard competitor={left} />
        <section className="versus-panel">
          <span>VS</span>
          <strong>
            {leftWins === rightWins ? "Even matchup" : leftWins > rightWins ? `${left.entry.name} leads` : `${right.entry.name} leads`}
          </strong>
          <small>
            {rows.length - contextRows} scored rows / {contextRows} context rows
          </small>
        </section>
        <MatchupTeamCard competitor={right} align="right" />
      </div>

      <section className="matchup-table-panel">
        <div className="panel-title">
          <BarChart3 size={18} />
          Tale of the tape
        </div>
        <div className="matchup-table">
          {rows.map((row) => (
            <div className={`matchup-row ${row.winner}`} key={`${row.category}-${row.label}`}>
              <div>
                <span>{row.category}</span>
                <strong>{row.leftValue}</strong>
              </div>
              <div className="matchup-row-center">
                <b>{row.label}</b>
                <small>{row.note}</small>
                <i>{winnerLabel(row, left.entry, right.entry)}</i>
              </div>
              <div>
                <span>{row.category}</span>
                <strong>{row.rightValue}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="path-panel">
        <div className="panel-title">
          <Sparkles size={18} />
          Path to win for {left.entry.name}
        </div>
        <div className="path-list">
          {path.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function JurisdictionPicker({
  title,
  selectedId,
  onSelect
}: {
  title: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = directoryEntryFor(selectedId) ?? jurisdictionDirectory[0];
  const featuredIds = new Set(["alberta", "texas", "california", "ontario", "florida", "quebec"]);
  const filtered = jurisdictionDirectory
    .filter((entry) => {
      const haystack = `${entry.name} ${entry.abbreviation} ${entry.country} ${entry.peerGroups.join(" ")}`.toLowerCase();
      return query.trim() ? haystack.includes(query.trim().toLowerCase()) : featuredIds.has(entry.id);
    })
    .slice(0, 12);
  const hiddenCount = query.trim() ? Math.max(0, jurisdictionDirectory.length - filtered.length) : jurisdictionDirectory.length - filtered.length;

  return (
    <article className="picker-panel">
      <div className="panel-title">
        <Search size={18} />
        {title}
      </div>
      <div className="selected-line" style={{ "--team-primary": selected.colors.primary } as React.CSSProperties}>
        <FlagMark item={selected} className="selected-flag" />
        <div>
          <strong>{selected.name}</strong>
          <small>
            {selected.dataStatus === "profiled" ? "profiled" : "registered"} / {Math.round(selected.dataCompleteness * 100)}% data
          </small>
        </div>
      </div>
      <label className="search-field">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search states, provinces, peer groups..." />
      </label>
      <div className="picker-results">
        {filtered.map((entry) => (
          <button
            className={selectedId === entry.id ? "active" : ""}
            key={entry.id}
            style={{ "--team-primary": entry.colors.primary } as React.CSSProperties}
            onClick={() => onSelect(entry.id)}
          >
            <FlagMark item={entry} className="picker-flag" />
            <div>
              <strong>{entry.name}</strong>
              <small>
                {entry.country} / {entry.dataStatus}
              </small>
            </div>
          </button>
        ))}
      </div>
      <p className="picker-note">
        {query.trim() ? `Showing ${filtered.length} matches. Refine search to pull any registered place.` : `Featured list shown. ${hiddenCount} more places are searchable.`}
      </p>
    </article>
  );
}

function MatchupTeamCard({ competitor, align = "left" }: { competitor: Competitor; align?: "left" | "right" }) {
  const { entry, profile, score } = competitor;
  return (
    <article className={`matchup-team-card ${align}`} style={{ "--team-primary": entry.colors.primary, "--team-secondary": entry.colors.secondary, "--team-accent": entry.colors.accent } as React.CSSProperties}>
      <div className="matchup-team-header">
        <FlagMark item={entry} className="matchup-flag" />
        <div>
          <h2>{entry.name}</h2>
          <p>
            {entry.kind} / {entry.country}
          </p>
        </div>
        <b>{score ? `${score.overall}` : "TBD"}</b>
      </div>
      {profile ? (
        <>
          <div className="matchup-mini-grid">
            <MiniStat label="GDP" value={`${currency(gdpCadEquivalent(profile))}B`} detail="CAD equivalent" />
            <MiniStat label="GDP/person" value={numberCompact(gdpPerCapitaCadEquivalent(profile))} detail="CAD equivalent" />
            <MiniStat label="Growth" value={profile.realGrowthPct === null ? "TBD" : `${fmt(profile.realGrowthPct)}%`} detail="real GDP" />
          </div>
          <ScoreBar label="Prosperity" value={score?.prosperity ?? 0} />
          <ScoreBar label="Growth" value={score?.growth ?? 0} />
          <ScoreBar label="Safety" value={score?.safety ?? 0} />
          <ScoreBar label="Health" value={score?.health ?? 0} />
        </>
      ) : (
        <div className="registered-callout">
          <strong>Registered, not fully profiled yet</strong>
          <span>
            This place is pullable for matchup planning. The next data pass needs GDP, safety, health, affordability, and fiscal source adapters.
          </span>
          <div>
            {entry.peerGroups.slice(0, 4).map((group) => (
              <i key={group}>{group}</i>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function buildCompetitor(id: string): Competitor {
  const entry = directoryEntryFor(id) ?? jurisdictionDirectory[0];
  const profile = richProfileFor(entry.id);
  return {
    entry,
    profile,
    score: profile ? scoreJurisdiction(profile) : undefined
  };
}

function buildMatchupRows(left: Competitor, right: Competitor): MatchupRow[] {
  const leftScore = left.score;
  const rightScore = right.score;
  const baseRows: MatchupRow[] = [
    scoreRow("Composite", "Overall score", leftScore?.overall ?? null, rightScore?.overall ?? null, "prototype index", true, true),
    scoreRow("Rating", "Prosperity", leftScore?.prosperity ?? null, rightScore?.prosperity ?? null, "GDP/person score", true, true),
    scoreRow("Rating", "Growth", leftScore?.growth ?? null, rightScore?.growth ?? null, "real GDP preferred", true, Boolean(left.profile?.realGrowthPct !== null && right.profile?.realGrowthPct !== null)),
    scoreRow("Rating", "Safety", leftScore?.safety ?? null, rightScore?.safety ?? null, "crime method must match", true, safetyComparable(left.profile, right.profile)),
    scoreRow("Rating", "Health", leftScore?.health ?? null, rightScore?.health ?? null, "overdose rate proxy", true, metricComparable(left.profile?.overdoseDeaths, right.profile?.overdoseDeaths)),
    valueRow("Economy", "GDP", left.profile ? gdpCadEquivalent(left.profile) : null, right.profile ? gdpCadEquivalent(right.profile) : null, "B CAD eq.", true, true),
    valueRow("Economy", "GDP/person", left.profile ? gdpPerCapitaCadEquivalent(left.profile) : null, right.profile ? gdpPerCapitaCadEquivalent(right.profile) : null, "CAD eq.", true, true),
    metricRow("Safety", "Violent crime", left.profile?.violentCrime, right.profile?.violentCrime, false),
    metricRow("Safety", "Property crime", left.profile?.propertyCrime, right.profile?.propertyCrime, false),
    metricRow("Health", "Overdose deaths", left.profile?.overdoseDeaths, right.profile?.overdoseDeaths, false)
  ];
  return baseRows;
}

function scoreRow(
  category: string,
  label: string,
  left: number | null,
  right: number | null,
  note: string,
  higherBetter: boolean,
  comparable: boolean
): MatchupRow {
  return {
    category,
    label,
    leftValue: left === null ? "TBD" : String(left),
    rightValue: right === null ? "TBD" : String(right),
    leftNumber: left,
    rightNumber: right,
    higherBetter,
    comparable,
    note,
    winner: winnerFor(left, right, higherBetter, comparable)
  };
}

function valueRow(
  category: string,
  label: string,
  left: number | null,
  right: number | null,
  unit: string,
  higherBetter: boolean,
  comparable: boolean
): MatchupRow {
  return {
    category,
    label,
    leftValue: left === null ? "TBD" : `${numberCompact(left)} ${unit}`.trim(),
    rightValue: right === null ? "TBD" : `${numberCompact(right)} ${unit}`.trim(),
    leftNumber: left,
    rightNumber: right,
    higherBetter,
    comparable,
    note: comparable ? "apples-to-apples enough for MVP" : "context only until harmonized",
    winner: winnerFor(left, right, higherBetter, comparable)
  };
}

function metricRow(
  category: string,
  label: string,
  left: JurisdictionMetric | undefined,
  right: JurisdictionMetric | undefined,
  higherBetter: boolean
): MatchupRow {
  const comparable = metricComparable(left, right);
  const leftNumber = left?.value ?? null;
  const rightNumber = right?.value ?? null;
  return {
    category,
    label,
    leftValue: left ? metricValue(left) : "TBD",
    rightValue: right ? metricValue(right) : "TBD",
    leftNumber,
    rightNumber,
    higherBetter,
    comparable,
    note: comparable ? "same unit and source family" : "context only until harmonized",
    winner: winnerFor(leftNumber, rightNumber, higherBetter, comparable)
  };
}

function winnerFor(left: number | null, right: number | null, higherBetter: boolean, comparable: boolean): MatchupRow["winner"] {
  if (left === null || right === null) return "pending";
  if (!comparable) return "context";
  if (left === right) return "tie";
  return higherBetter ? (left > right ? "left" : "right") : left < right ? "left" : "right";
}

function winnerLabel(row: MatchupRow, left: JurisdictionDirectoryEntry, right: JurisdictionDirectoryEntry) {
  if (row.winner === "left") return `${left.abbreviation} wins`;
  if (row.winner === "right") return `${right.abbreviation} wins`;
  if (row.winner === "tie") return "Tie";
  if (row.winner === "context") return "Context only";
  return "Pending data";
}

function metricComparable(left?: JurisdictionMetric, right?: JurisdictionMetric) {
  if (!left || !right || left.value === null || right.value === null) return false;
  return left.quality === "comparable" && right.quality === "comparable" && left.unit === right.unit;
}

function safetyComparable(left?: JurisdictionProfile, right?: JurisdictionProfile) {
  return metricComparable(left?.violentCrime, right?.violentCrime) && metricComparable(left?.propertyCrime, right?.propertyCrime);
}

function buildPathToWin(left: Competitor, right: Competitor) {
  if (!left.profile) {
    return [
      {
        title: "Complete the data card first",
        body: `${left.entry.name} is registered, but not profiled. Pull GDP, GDP/person, growth, crime, overdose, affordability, and fiscal data before ranking it seriously.`
      },
      {
        title: "Choose a profiled rival for a live benchmark",
        body: `Suggested rivals are already registered, so the app can show who ${left.entry.name} should be compared against once the source adapters are filled.`
      }
    ];
  }
  if (!right.profile) {
    return [
      {
        title: "Opponent data is the blocker",
        body: `${right.entry.name} is registered but not profiled yet. The honest comparison is a scouting matchup until the opponent data is loaded.`
      },
      {
        title: "Use peer groups to prioritize intake",
        body: `Because ${right.entry.name} is tagged as ${right.entry.peerGroups.slice(0, 3).join(", ")}, start with GDP, growth, safety, and affordability metrics for that peer cluster.`
      }
    ];
  }

  const leftScore = scoreJurisdiction(left.profile);
  const rightScore = scoreJurisdiction(right.profile);
  const gaps = [
    { title: "Prosperity gap", gap: rightScore.prosperity - leftScore.prosperity, lever: "raise GDP per person through productivity, investment, and higher-value employment." },
    { title: "Growth gap", gap: rightScore.growth - leftScore.growth, lever: "improve real growth momentum without creating inflation or fiscal fragility." },
    { title: "Safety gap", gap: (rightScore.safety ?? 0) - (leftScore.safety ?? 0), lever: "reduce violent/property crime and harmonize safety data so the win is defensible." },
    { title: "Health gap", gap: (rightScore.health ?? 0) - (leftScore.health ?? 0), lever: "reduce overdose deaths and add broader health-outcome indicators." }
  ]
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  if (gaps.length === 0) {
    return [
      {
        title: "Defend the lead",
        body: `${left.entry.name} is ahead on the profiled scoring categories. The next job is validating weak data rows so the lead survives scrutiny.`
      },
      {
        title: "Do not let the model hide risk",
        body: "Add affordability, fiscal capacity, education, and permitting speed before treating this as a regulator-grade ranking."
      }
    ];
  }

  return gaps.slice(0, 3).map((item) => ({
    title: item.title,
    body: `${left.entry.name} trails by ${item.gap} points. Fastest path: ${item.lever}`
  }));
}

function MiniStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function TrendIcon({ direction }: { direction: "up" | "flat" | "down" | "unknown" }) {
  if (direction === "up") return <TrendingUp size={18} />;
  if (direction === "down") return <TrendingDown size={18} />;
  return <Minus size={18} />;
}

function ScoutingList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="scouting-card">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function ProtocolItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="protocol-item">
      <strong>{label}</strong>
      <span>{text}</span>
    </div>
  );
}

function CompareMetric({
  label,
  value,
  detail,
  quality
}: {
  label: string;
  value: string;
  detail: string;
  quality: "comparable" | "directional" | "limited";
}) {
  return (
    <article className="compare-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      <i className={`quality-dot ${quality}`}>{quality}</i>
    </article>
  );
}

function EconomySnapshot({ economy, impact }: { economy: ReturnType<typeof profileFor>; impact: ImpactEstimate }) {
  return (
    <section className="economy-snapshot">
      <div className="panel-title">
        <Building2 size={18} />
        Economy at a glance
      </div>
      <div className="snapshot-main">
        <div>
          <span>{economy.province} GDP</span>
          <strong>{currency(economy.nominalGdpBillion)}B</strong>
          <small>2024 current dollars</small>
        </div>
        <div>
          <span>Real growth</span>
          <strong>{fmt(economy.realGrowth2024)}%</strong>
          <small>latest annual provincial account</small>
        </div>
        <div>
          <span>Scenario swing</span>
          <strong className={impact.peakGdpDeltaBillion >= 0 ? "positive" : "negative"}>{moneySigned(impact.peakGdpDeltaBillion)}B</strong>
          <small>model-implied GDP difference</small>
        </div>
      </div>
      <div className="texture-list">
        {economy.texture.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function ScenarioCards({
  selectedScenarioId,
  onSelect
}: {
  selectedScenarioId: string;
  onSelect: (scenario: TeachingScenario) => void;
}) {
  return (
    <section className="scenario-deck">
      <div className="panel-title">
        <Pickaxe size={18} />
        Choose a real-world move
      </div>
      <div className="scenario-card-grid">
        {teachingScenarios.map((item) => (
          <button
            className={`scenario-card ${selectedScenarioId === item.id ? "active" : ""}`}
            key={item.id}
            onClick={() => onSelect(item)}
          >
            <strong>{item.shortTitle}</strong>
            <span>{item.summary}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CausalPanel({
  selectedScenario,
  economy,
  impact
}: {
  selectedScenario?: TeachingScenario;
  economy: ReturnType<typeof profileFor>;
  impact: ImpactEstimate;
}) {
  const title = selectedScenario?.title ?? "Custom policy mix";
  const channels =
    selectedScenario?.channels ??
    [
      "Your manual slider mix changes borrowing costs, investment, prices, and expenditure components.",
      "The model translates those shocks into a 24-month path and reconciles GDP back to spending identity.",
      "Use the advanced levers to test whether growth comes with inflation, fiscal pressure, or investment drag."
    ];
  const risks =
    selectedScenario?.risks ??
    [
      "Manual scenarios can combine assumptions that would be politically or operationally hard to execute.",
      "Large shocks show direction and tradeoffs, not a precise forecast."
    ];

  return (
    <article className="info-panel causal-panel">
      <div className="panel-title">
        <Factory size={18} />
        What happens next
      </div>
      <h2>{title}</h2>
      <p>
        In a {currency(economy.nominalGdpBillion)}B economy, this setup implies a peak GDP swing of{" "}
        <b className={impact.peakGdpDeltaBillion >= 0 ? "positive" : "negative"}>{moneySigned(impact.peakGdpDeltaBillion)}B</b>.
      </p>
      <ol className="chain-list">
        {channels.map((channel) => (
          <li key={channel}>{channel}</li>
        ))}
      </ol>
      <div className="risk-box">
        <strong>Watch-outs</strong>
        <ul>
          {risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Scorecard({ impact }: { impact: ImpactEstimate }) {
  return (
    <article className="info-panel score-panel">
      <div className="panel-title">
        <Sparkles size={18} />
        Age of Alberta scorecard
      </div>
      <div className="score-hero">
        <strong>{impact.gameScore}</strong>
        <span>/100</span>
      </div>
      <ScoreBar label="Growth" value={impact.growthScore} />
      <ScoreBar label="Affordability" value={impact.affordabilityScore} />
      <ScoreBar label="Fiscal room" value={impact.fiscalScore} />
      <ScoreBar label="Resilience" value={impact.resilienceScore} />
      <div className="impact-ledger">
        <span>Direct investment</span>
        <b>{currency(impact.directInvestmentBillion)}B</b>
        <span>Government revenue signal</span>
        <b>{moneySigned(impact.revenueDeltaBillion)}B</b>
        <span>Main-street spillover</span>
        <b>{moneySigned(impact.retailDeltaBillion)}B</b>
      </div>
    </article>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <div className="score-track">
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <b>{value}</b>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field slider-field">
      <span>
        {label}
        <b>
          {value}
          {suffix}
        </b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value, Icon }: { label: string; value: string; Icon: LucideIcon }) {
  return (
    <article className="metric">
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function LineChart({
  rows,
  series
}: {
  rows: SimulationRow[];
  series: { key: keyof SimulationRow; label: string; color: string }[];
}) {
  const width = 980;
  const height = 340;
  const padding = { top: 26, right: 28, bottom: 34, left: 54 };
  const values = series.flatMap((item) => rows.map((row) => Number(row[item.key])));
  const min = Math.min(...values, -1);
  const max = Math.max(...values, 1);
  const x = (index: number) => padding.left + (index / Math.max(rows.length - 1, 1)) * (width - padding.left - padding.right);
  const y = (value: number) => padding.top + ((max - value) / Math.max(max - min, 0.01)) * (height - padding.top - padding.bottom);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <h2>24-month transmission path</h2>
        <div className="legend">
          {series.map((item) => (
            <span key={String(item.key)}>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Simulation line chart">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const lineY = padding.top + tick * (height - padding.top - padding.bottom);
          return <line key={tick} x1={padding.left} x2={width - padding.right} y1={lineY} y2={lineY} className="grid-line" />;
        })}
        <line x1={padding.left} x2={width - padding.right} y1={y(0)} y2={y(0)} className="zero-line" />
        {series.map((item) => {
          const points = rows.map((row, index) => `${x(index)},${y(Number(row[item.key]))}`).join(" ");
          return <polyline key={String(item.key)} points={points} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" />;
        })}
        <text x={padding.left} y={height - 8} className="axis-label">
          Month 1
        </text>
        <text x={width - padding.right - 74} y={height - 8} className="axis-label">
          Month {rows.length}
        </text>
      </svg>
    </div>
  );
}

function BaselinePanel({ baseline, loading, error }: { baseline: MacroBaseline; loading: boolean; error: string | null }) {
  return (
    <article className="info-panel">
      <div className="panel-title">
        <ShieldCheck size={18} />
        Baseline
      </div>
      <div className="baseline-grid">
        <span>Quality</span>
        <strong className={`quality ${baseline.sourceQuality}`}>{loading ? "loading" : baseline.sourceQuality}</strong>
        <span>Real GDP</span>
        <strong>{fmt(baseline.realGdpGrowth)}%</strong>
        <span>CPI</span>
        <strong>{fmt(baseline.headlineCpi)}%</strong>
        <span>Policy rate</span>
        <strong>{fmt(baseline.policyRate)}%</strong>
      </div>
      {error ? (
        <p className="warning">
          <AlertTriangle size={16} />
          {error}
        </p>
      ) : null}
      <ul className="notes-list">
        {baseline.sourceNotes.slice(0, 5).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
}

function StressPanel({ stress }: { stress: StressComparison[] }) {
  return (
    <article className="info-panel">
      <div className="panel-title">
        <Activity size={18} />
        Stress audit
      </div>
      <table className="compact-table">
        <thead>
          <tr>
            <th>Case</th>
            <th>Draft gap</th>
            <th>Final gap</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {stress.map((item) => (
            <tr key={`${item.scenario.province}-${item.scenario.rateShockBps}`}>
              <td>{item.scenario.province}</td>
              <td>{item.draft1.maxIdentityGap.toFixed(3)}</td>
              <td>{item.final.maxIdentityGap.toExponential(1)}</td>
              <td>{fmt(item.final.stabilityScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="ghost-button full" onClick={() => downloadJson("stress-test-outputs.json", stress)}>
        <Download size={16} />
        Export audit
      </button>
    </article>
  );
}

function DataTable({ rows }: { rows: SimulationRow[] }) {
  return (
    <section className="table-panel">
      <div className="panel-title">
        <BarChart3 size={18} />
        Monthly reconciled panel
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {["Month", "Rate", "CapEx", "Employment", "CPI", "C", "I", "G", "NX", "Y", "Gap"].map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{fmt(row.policyRate)}</td>
                <td>{fmt(row.capexGrowth)}</td>
                <td>{fmt(row.employmentGrowth)}</td>
                <td>{fmt(row.headlineCpi)}</td>
                <td>{fmt(row.C)}</td>
                <td>{fmt(row.I)}</td>
                <td>{fmt(row.G)}</td>
                <td>{fmt(row.NX)}</td>
                <td>{fmt(row.Y)}</td>
                <td>{row.identityGap.toExponential(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value);
}

function currency(value: number) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(value);
}

function moneySigned(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${currency(value)}`;
}

function numberCompact(value: number) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function metricValue(metric: JurisdictionMetric) {
  if (metric.value === null) return "TBD";
  return `${fmt(metric.value)} ${metric.unit}`;
}

function estimateImpact(
  rows: SimulationRow[],
  neutralRows: SimulationRow[],
  nominalGdpBillion: number,
  selectedScenario?: TeachingScenario
): ImpactEstimate {
  const deltas = rows.map((row, index) => row.Y - (neutralRows[index]?.Y ?? 0));
  const finalGrowthDelta = deltas[deltas.length - 1] ?? 0;
  const peakGrowthDelta = deltas.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
  const directInvestmentBillion = selectedScenario?.directInvestmentBillion ?? Math.max(0, peakGrowthDelta * nominalGdpBillion * 0.01 * 0.25);
  const finalGdpDeltaBillion = nominalGdpBillion * (finalGrowthDelta / 100);
  const peakGdpDeltaBillion = nominalGdpBillion * (peakGrowthDelta / 100);
  const revenueDeltaBillion =
    Math.max(0, directInvestmentBillion * (selectedScenario?.governmentTakeRate ?? 0.09)) + Math.max(0, peakGdpDeltaBillion) * 0.075;
  const retailDeltaBillion =
    Math.max(0, directInvestmentBillion * (selectedScenario?.retailSpilloverRate ?? 0.16)) + Math.max(0, peakGdpDeltaBillion) * 0.05;
  const cpiPeak = Math.max(...rows.map((row) => row.headlineCpi));
  const cpiPenalty = Math.max(0, cpiPeak - 3) * 8;
  const identityPenalty = Math.max(...rows.map((row) => row.identityGap)) * 100;
  const confidence = selectedScenario?.confidenceEffect ?? 50;
  const growthScore = clampScore(50 + peakGrowthDelta * 4 + directInvestmentBillion * 0.6);
  const affordabilityScore = clampScore(78 - cpiPenalty - Math.max(0, rows[rows.length - 1]?.policyRate ?? 0) * 1.2);
  const fiscalScore = clampScore(48 + revenueDeltaBillion * 2 - Math.max(0, -finalGdpDeltaBillion) * 0.9);
  const resilienceScore = clampScore(confidence - identityPenalty - Math.max(0, cpiPeak - 5) * 4);
  const gameScore = Math.round((growthScore + affordabilityScore + fiscalScore + resilienceScore) / 4);

  return {
    finalGdpDeltaBillion: round(finalGdpDeltaBillion, 2),
    peakGdpDeltaBillion: round(peakGdpDeltaBillion, 2),
    directInvestmentBillion: round(directInvestmentBillion, 2),
    revenueDeltaBillion: round(revenueDeltaBillion, 2),
    retailDeltaBillion: round(retailDeltaBillion, 2),
    confidence,
    growthScore,
    affordabilityScore,
    fiscalScore,
    resilienceScore,
    gameScore
  };
}

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

createRoot(document.getElementById("root")!).render(<App />);
