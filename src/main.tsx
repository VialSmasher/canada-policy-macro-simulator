import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Gauge,
  Landmark,
  RefreshCw,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { buildBaseline, fallbackBaseline } from "./lib/dataSources";
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
  const [baseline, setBaseline] = useState<MacroBaseline>(fallbackBaseline(["Live baseline has not loaded yet."]));
  const [scenario, setScenario] = useState<PolicyScenario>(defaultScenario);
  const [loadingBaseline, setLoadingBaseline] = useState(true);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  const result = useMemo(() => runPolicySimulation(scenario, baseline, true), [scenario, baseline]);
  const stress = useMemo(() => runStressAudit(baseline), [baseline]);

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
    setScenario((current) => ({ ...current, [key]: value }));
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
          <Slider
            label="Policy rate shock"
            value={scenario.rateShockBps}
            min={-400}
            max={900}
            step={25}
            suffix="bps"
            onChange={(value) => updateScenario("rateShockBps", value)}
          />
          <Slider
            label="Corporate tax delta"
            value={scenario.corporateTaxDeltaPp}
            min={-15}
            max={10}
            step={1}
            suffix="pp"
            onChange={(value) => updateScenario("corporateTaxDeltaPp", value)}
          />
          <Slider
            label="Infrastructure spend"
            value={scenario.infrastructureSpendDeltaPct}
            min={-50}
            max={150}
            step={5}
            suffix="%"
            onChange={(value) => updateScenario("infrastructureSpendDeltaPct", value)}
          />
          <Slider
            label="Energy price shock"
            value={scenario.energyPriceDeltaPct}
            min={-75}
            max={125}
            step={5}
            suffix="%"
            onChange={(value) => updateScenario("energyPriceDeltaPct", value)}
          />
          <Slider
            label="Consumption tax delta"
            value={scenario.consumptionTaxDeltaPp}
            min={-5}
            max={8}
            step={1}
            suffix="pp"
            onChange={(value) => updateScenario("consumptionTaxDeltaPp", value)}
          />
          <Slider
            label="Horizon"
            value={scenario.horizonMonths}
            min={6}
            max={60}
            step={1}
            suffix="months"
            onChange={(value) => updateScenario("horizonMonths", value)}
          />
        </aside>

        <section className="analysis-area">
          <div className="metrics-grid">
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
    </main>
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

createRoot(document.getElementById("root")!).render(<App />);
