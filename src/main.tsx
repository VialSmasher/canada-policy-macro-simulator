import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Download,
  Factory,
  Gauge,
  Landmark,
  Pickaxe,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  type LucideIcon
} from "lucide-react";
import { buildBaseline, fallbackBaseline } from "./lib/dataSources";
import { profileFor, teachingScenarios, type TeachingScenario } from "./lib/education";
import {
  gdpCadEquivalent,
  gdpPerCapitaCadEquivalent,
  jurisdictions,
  scoreJurisdiction,
  type JurisdictionProfile
} from "./lib/jurisdictions";
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
  const [activeView, setActiveView] = useState<"scoreboard" | "simulator">("scoreboard");
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">
            <Landmark size={16} />
            Canada framework
          </div>
          <h1>Municipal & Macroeconomic Policy Simulator</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={() => void refreshBaseline()} disabled={loadingBaseline}>
            <RefreshCw size={17} className={loadingBaseline ? "spin" : ""} />
            Refresh baseline
          </button>
          <button className="primary-button" onClick={() => downloadJson("simulation-result.json", result)}>
            <Download size={17} />
            Export run
          </button>
        </div>
      </header>

      <div className="view-switch">
        <button className={activeView === "scoreboard" ? "active" : ""} onClick={() => setActiveView("scoreboard")}>
          Scoreboard
        </button>
        <button className={activeView === "simulator" ? "active" : ""} onClick={() => setActiveView("simulator")}>
          Simulator
        </button>
      </div>

      {activeView === "scoreboard" ? (
        <JurisdictionScoreboard />
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

function JurisdictionScoreboard() {
  const [selectedId, setSelectedId] = useState("alberta");
  const selected = jurisdictions.find((item) => item.id === selectedId) ?? jurisdictions[0];
  const ranked = [...jurisdictions].sort((a, b) => scoreJurisdiction(b).overall - scoreJurisdiction(a).overall);
  const selectedScore = scoreJurisdiction(selected);

  return (
    <section className="scoreboard-shell">
      <div className="scoreboard-hero">
        <div>
          <div className="panel-title">
            <BarChart3 size={18} />
            Jurisdiction scoreboard
          </div>
          <h2>Compare provinces and states like teams</h2>
          <p>
            This first pass ranks economic scale, prosperity, growth, safety, and health signals. It deliberately marks weak comparisons
            instead of pretending every dataset is measured the same way.
          </p>
        </div>
        <div className="protocol-card">
          <strong>Data protocol</strong>
          <span>Comparable: same-family metric</span>
          <span>Directional: useful, but different method</span>
          <span>Limited: placeholder until harmonized</span>
        </div>
      </div>

      <div className="scoreboard-grid">
        <section className="ranking-panel">
          {ranked.map((item, index) => {
            const score = scoreJurisdiction(item);
            return (
              <button className={`rank-card ${selectedId === item.id ? "active" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}>
                <span className="rank-number">#{index + 1}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.kind} · {item.country}
                  </small>
                </div>
                <b>{score.overall}</b>
              </button>
            );
          })}
        </section>

        <section className="comparison-panel">
          <div className="comparison-header">
            <div>
              <h2>{selected.name}</h2>
              <p>
                {selected.kind} in {selected.country}
              </p>
            </div>
            <div className="score-pill">{selectedScore.overall}/100</div>
          </div>

          <div className="comparison-metrics">
            <CompareMetric label="GDP" value={`${currency(gdpCadEquivalent(selected))}B CAD eq.`} detail={`${currency(selected.gdpBillionLocal)}B ${selected.currency}`} quality="comparable" />
            <CompareMetric label="GDP / person" value={`${numberCompact(gdpPerCapitaCadEquivalent(selected))} CAD eq.`} detail={`${numberCompact(selected.gdpPerCapitaLocal)} ${selected.currency}`} quality="comparable" />
            <CompareMetric label="Growth" value={selected.realGrowthPct === null ? "Needs live series" : `${fmt(selected.realGrowthPct)}%`} detail={selected.nominalGrowthPct === null ? "real GDP preferred" : `${fmt(selected.nominalGrowthPct)}% nominal`} quality={selected.realGrowthPct === null ? "limited" : "comparable"} />
            <CompareMetric label="Violent crime" value={metricValue(selected.violentCrime)} detail={selected.violentCrime.source} quality={selected.violentCrime.quality} />
            <CompareMetric label="Property crime" value={metricValue(selected.propertyCrime)} detail={selected.propertyCrime.source} quality={selected.propertyCrime.quality} />
            <CompareMetric label="Overdose deaths" value={metricValue(selected.overdoseDeaths)} detail={selected.overdoseDeaths.source} quality={selected.overdoseDeaths.quality} />
          </div>

          <div className="score-breakdown">
            <ScoreBar label="Prosperity" value={selectedScore.prosperity} />
            <ScoreBar label="Growth" value={selectedScore.growth} />
            <ScoreBar label="Safety" value={selectedScore.safety ?? 0} />
            <ScoreBar label="Health" value={selectedScore.health ?? 0} />
          </div>

          <div className="model-fit">
            <strong>What matters here</strong>
            <div>
              {selected.modelFit.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="comparison-table-panel">
        <div className="panel-title">
          <ShieldCheck size={18} />
          Cross-border table
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Place</th>
                <th>Score</th>
                <th>GDP CAD eq.</th>
                <th>GDP/person CAD eq.</th>
                <th>Growth</th>
                <th>Violent crime</th>
                <th>Property crime</th>
                <th>Overdose deaths</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((item) => {
                const score = scoreJurisdiction(item);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{score.overall}</td>
                    <td>{currency(gdpCadEquivalent(item))}B</td>
                    <td>{numberCompact(gdpPerCapitaCadEquivalent(item))}</td>
                    <td>{item.realGrowthPct === null ? "TBD" : `${fmt(item.realGrowthPct)}%`}</td>
                    <td>{metricValue(item.violentCrime)}</td>
                    <td>{metricValue(item.propertyCrime)}</td>
                    <td>{metricValue(item.overdoseDeaths)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
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
  link.click();
  URL.revokeObjectURL(url);
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

function metricValue(metric: JurisdictionProfile["violentCrime"]) {
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
