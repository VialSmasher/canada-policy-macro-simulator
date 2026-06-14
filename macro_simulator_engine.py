"""Interactive Canadian municipal and macroeconomic policy simulator.

Run modes:
    python macro_simulator_engine.py --stress
    python macro_simulator_engine.py --simulate --province Alberta --rate-shock-bps 100
    streamlit run macro_simulator_engine.py

The engine attempts live public data ingestion first and falls back to
documented historical priors when a source is unavailable. Runtime artifacts:
    - baseline_data_log.json
    - simulation_diagnostics.log
    - stress_test_outputs.json
    - dev_evolution_report.md
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import statistics
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

try:
    import numpy as np
except ImportError as exc:  # pragma: no cover - hard fail for engine math
    raise SystemExit("numpy is required for the simulator engine") from exc

try:
    import requests
except ImportError:  # pragma: no cover - handled by data fallbacks
    requests = None  # type: ignore[assignment]

try:
    from scipy.optimize import minimize
except ImportError:  # pragma: no cover - graceful reconciliation fallback
    minimize = None  # type: ignore[assignment]


ROOT = Path(__file__).resolve().parent
DIAGNOSTIC_LOG = ROOT / "simulation_diagnostics.log"
BASELINE_LOG = ROOT / "baseline_data_log.json"
STRESS_LOG = ROOT / "stress_test_outputs.json"
REPORT_PATH = ROOT / "dev_evolution_report.md"

STATCAN_WDS = "https://www150.statcan.gc.ca/t1/wds/rest/"
BANK_OF_CANADA_VALET = "https://www.bankofcanada.ca/valet/observations"


def configure_logging() -> None:
    logging.basicConfig(
        filename=DIAGNOSTIC_LOG,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )


@dataclass(frozen=True)
class MacroBaseline:
    real_gdp_growth: float
    headline_cpi: float
    policy_rate: float
    capex_growth: float
    employment_growth: float
    consumption_share: float
    investment_share: float
    government_share: float
    net_exports_share: float
    regional_investment_multipliers: Dict[str, float]
    source_quality: str
    source_notes: List[str]
    observed_at_utc: str


@dataclass(frozen=True)
class PolicyScenario:
    province: str = "Canada"
    rate_shock_bps: float = 0.0
    corporate_tax_delta_pp: float = 0.0
    infrastructure_spend_delta_pct: float = 0.0
    energy_price_delta_pct: float = 0.0
    consumption_tax_delta_pp: float = 0.0
    horizon_months: int = 24


@dataclass
class SimulationMetrics:
    min_gdp_growth: float
    max_gdp_growth: float
    min_inflation: float
    max_inflation: float
    max_identity_gap: float
    convergence_failures: int
    stability_score: float


class DataIngestor:
    """Fetches live Canadian macro baselines with transparent fallback behavior."""

    # Candidate StatCan vector ids are intentionally configurable and tried in
    # order because StatCan occasionally rekeys tables and vector metadata.
    STATCAN_VECTOR_CANDIDATES: Dict[str, List[int]] = {
        "headline_cpi_index": [41690973, 41690914, 41693271],
        "real_gdp_index": [2063744, 38000064, 3902221],
        "capex_proxy": [3830155, 3830156, 3830157],
        "employment_proxy": [2062811, 2062812, 2062813],
    }

    BOC_SERIES = {
        "policy_rate": ["V39079", "V80691311", "V122530"],
    }

    def __init__(self, timeout_seconds: float = 8.0) -> None:
        self.timeout_seconds = timeout_seconds
        self.notes: List[str] = []

    def build_baseline(self) -> MacroBaseline:
        observed_at = datetime.now(timezone.utc).isoformat()
        live_values: Dict[str, Optional[float]] = {
            "headline_cpi": self._fetch_statcan_growth("headline_cpi_index", periods=12),
            "real_gdp_growth": self._fetch_statcan_growth("real_gdp_index", periods=12),
            "capex_growth": self._fetch_statcan_growth("capex_proxy", periods=4),
            "employment_growth": self._fetch_statcan_growth("employment_proxy", periods=12),
            "policy_rate": self._fetch_boc_latest(self.BOC_SERIES["policy_rate"]),
        }

        fallback = self._fallback_baseline(observed_at)
        values = {
            key: live_values[key] if live_values[key] is not None else getattr(fallback, key)
            for key in ["real_gdp_growth", "headline_cpi", "policy_rate", "capex_growth", "employment_growth"]
        }

        live_count = sum(value is not None for value in live_values.values())
        quality = "live" if live_count == len(live_values) else "mixed" if live_count else "fallback"
        baseline = MacroBaseline(
            real_gdp_growth=float(values["real_gdp_growth"]),
            headline_cpi=float(values["headline_cpi"]),
            policy_rate=float(values["policy_rate"]),
            capex_growth=float(values["capex_growth"]),
            employment_growth=float(values["employment_growth"]),
            consumption_share=fallback.consumption_share,
            investment_share=fallback.investment_share,
            government_share=fallback.government_share,
            net_exports_share=fallback.net_exports_share,
            regional_investment_multipliers=self._regional_multipliers(),
            source_quality=quality,
            source_notes=self.notes + fallback.source_notes,
            observed_at_utc=observed_at,
        )
        BASELINE_LOG.write_text(json.dumps(asdict(baseline), indent=2), encoding="utf-8")
        logging.info("Baseline built with source_quality=%s", quality)
        return baseline

    def _request_statcan(self, resource: str, params: Dict[str, str]) -> Optional[Any]:
        if requests is None:
            self._note("requests unavailable; StatCan WDS skipped")
            return None
        url = f"{STATCAN_WDS}{resource}"
        try:
            response = requests.get(url, params=params, timeout=self.timeout_seconds)
            response.raise_for_status()
            return response.json()
        except Exception as exc:  # noqa: BLE001 - logged fallback path
            self._note(f"StatCan WDS {resource} failed: {exc}")
            logging.exception("StatCan WDS request failed for %s", resource)
            return None

    def _fetch_statcan_growth(self, label: str, periods: int) -> Optional[float]:
        for vector_id in self.STATCAN_VECTOR_CANDIDATES[label]:
            params = {
                "vectorIds": f'"{vector_id}"',
                "startRefPeriod": "2018-01-01",
                "endReferencePeriod": "2035-12-31",
            }
            data = self._request_statcan("getDataFromVectorByReferencePeriodRange", params)
            series = self._extract_numeric_values(data)
            if len(series) > periods:
                old, new = series[-periods - 1], series[-1]
                if old and math.isfinite(old) and math.isfinite(new):
                    growth = (new / old - 1.0) * 100.0
                    self._note(f"{label} fetched from StatCan vector {vector_id}")
                    return growth
        self._note(f"{label} fell back after all StatCan vector candidates failed")
        return None

    def _fetch_boc_latest(self, series_candidates: Iterable[str]) -> Optional[float]:
        if requests is None:
            self._note("requests unavailable; Bank of Canada Valet skipped")
            return None
        for series in series_candidates:
            url = f"{BANK_OF_CANADA_VALET}/{series}/json"
            try:
                response = requests.get(url, timeout=self.timeout_seconds)
                response.raise_for_status()
                observations = response.json().get("observations", [])
                values = [
                    float(obs[series]["v"])
                    for obs in observations
                    if series in obs and obs[series].get("v") not in (None, "")
                ]
                if values:
                    self._note(f"policy_rate fetched from Bank of Canada Valet series {series}")
                    return values[-1]
            except Exception as exc:  # noqa: BLE001 - logged fallback path
                self._note(f"Bank of Canada series {series} failed: {exc}")
                logging.exception("Bank of Canada request failed for %s", series)
        return None

    @staticmethod
    def _extract_numeric_values(data: Any) -> List[float]:
        values: List[float] = []

        def walk(node: Any) -> None:
            if isinstance(node, dict):
                if "value" in node:
                    try:
                        values.append(float(node["value"]))
                    except (TypeError, ValueError):
                        pass
                for child in node.values():
                    walk(child)
            elif isinstance(node, list):
                for child in node:
                    walk(child)

        walk(data)
        return [value for value in values if math.isfinite(value)]

    @staticmethod
    def _regional_multipliers() -> Dict[str, float]:
        return {
            "Canada": 1.00,
            "Alberta": 1.32,
            "Ontario": 0.94,
            "Quebec": 0.91,
            "British Columbia": 1.04,
            "Saskatchewan": 1.21,
            "Manitoba": 0.98,
            "Atlantic": 0.86,
            "Territories": 1.15,
        }

    @staticmethod
    def _fallback_baseline(observed_at: str) -> MacroBaseline:
        return MacroBaseline(
            real_gdp_growth=1.6,
            headline_cpi=2.7,
            policy_rate=4.75,
            capex_growth=1.2,
            employment_growth=1.0,
            consumption_share=0.56,
            investment_share=0.23,
            government_share=0.22,
            net_exports_share=-0.01,
            regional_investment_multipliers=DataIngestor._regional_multipliers(),
            source_quality="fallback",
            source_notes=[
                "Fallback priors are conservative historical anchors used only when live public sources fail.",
                "National expenditure shares are normalized model shares, not a replacement for StatCan accounts.",
            ],
            observed_at_utc=observed_at,
        )

    def _note(self, message: str) -> None:
        self.notes.append(message)
        logging.info(message)


class ProvincialEngine:
    name = "Canada"
    capex_elasticity = 1.0
    energy_elasticity = 0.18
    corporate_tax_elasticity = 0.08
    debt_sensitivity = 1.0
    mortgage_transmission = 1.0
    retail_consumption_response = 1.0

    def scenario_vector(self, scenario: PolicyScenario) -> np.ndarray:
        rate_pp = scenario.rate_shock_bps / 100.0
        tax_pp = scenario.corporate_tax_delta_pp
        infra = scenario.infrastructure_spend_delta_pct
        energy = scenario.energy_price_delta_pct
        consumption_tax = scenario.consumption_tax_delta_pp
        return np.array(
            [
                rate_pp,
                -0.34 * rate_pp * self.capex_elasticity - 0.06 * tax_pp * self.corporate_tax_elasticity + 0.04 * infra,
                -0.05 * rate_pp * self.debt_sensitivity + 0.018 * infra,
                0.05 * energy * self.energy_elasticity + 0.08 * consumption_tax + 0.03 * rate_pp,
                -0.22 * rate_pp * self.retail_consumption_response - 0.04 * consumption_tax,
                -0.28 * rate_pp * self.mortgage_transmission + 0.02 * infra - 0.05 * tax_pp,
                0.08 * infra,
                0.02 * energy - 0.01 * rate_pp,
                0.0,
            ],
            dtype=float,
        )


class AlbertaEngine(ProvincialEngine):
    name = "Alberta"
    capex_elasticity = 1.55
    energy_elasticity = 0.42
    corporate_tax_elasticity = 1.40
    debt_sensitivity = 0.82
    mortgage_transmission = 0.80
    retail_consumption_response = 0.86


class OntarioQuebecEngine(ProvincialEngine):
    name = "Ontario/Quebec"
    capex_elasticity = 0.86
    energy_elasticity = 0.11
    corporate_tax_elasticity = 0.76
    debt_sensitivity = 1.46
    mortgage_transmission = 1.52
    retail_consumption_response = 1.34


class SVARSimulator:
    """Reduced-form SVAR with Cholesky contemporaneous restrictions."""

    variables = ["policy_rate", "capex", "employment", "cpi", "C", "I", "G", "NX", "Y"]

    def __init__(self, baseline: MacroBaseline, final_mode: bool = True) -> None:
        self.baseline = baseline
        self.final_mode = final_mode
        self.reconciliation_failures = 0
        self.identity_gaps: List[float] = []

    def run(self, scenario: PolicyScenario) -> List[Dict[str, float]]:
        engine = self._engine_for(scenario.province)
        horizon = max(1, min(int(scenario.horizon_months), 60))
        state = self._initial_state()
        transition = self._transition_matrix()
        contemporaneous = self._cholesky_restriction()
        shock = engine.scenario_vector(scenario)
        rows: List[Dict[str, float]] = []

        for month in range(1, horizon + 1):
            decay = math.exp(-0.11 * (month - 1))
            impulse = contemporaneous @ (shock * decay)
            drift = np.array(
                [
                    0.00,
                    self.baseline.capex_growth / 1200.0,
                    self.baseline.employment_growth / 1200.0,
                    (self.baseline.headline_cpi - 2.0) / 1200.0,
                    0.012,
                    0.010,
                    0.006,
                    0.000,
                    self.baseline.real_gdp_growth / 1200.0,
                ]
            )
            state = transition @ state + impulse + drift
            if self.final_mode:
                state = self._stabilize(state)
                state = self._reconcile_identity(state)
            gap = abs(state[8] - (state[4] + state[5] + state[6] + state[7]))
            self.identity_gaps.append(float(gap))
            rows.append(self._row(month, state, scenario.province))
        return rows

    def _initial_state(self) -> np.ndarray:
        y = self.baseline.real_gdp_growth
        c = y * self.baseline.consumption_share
        i = y * self.baseline.investment_share
        g = y * self.baseline.government_share
        nx = y * self.baseline.net_exports_share
        return np.array(
            [
                self.baseline.policy_rate,
                self.baseline.capex_growth,
                self.baseline.employment_growth,
                self.baseline.headline_cpi,
                c,
                i,
                g,
                nx,
                c + i + g + nx,
            ],
            dtype=float,
        )

    @staticmethod
    def _transition_matrix() -> np.ndarray:
        matrix = np.eye(9)
        matrix[1, 0] = -0.055  # policy rate -> capex
        matrix[2, 1] = 0.032  # capex -> employment
        matrix[3, 1] = 0.018  # capex -> CPI supply channel
        matrix[3, 2] = 0.030  # employment -> demand-pull CPI
        matrix[4, 0] = -0.020
        matrix[4, 2] = 0.045
        matrix[5, 0] = -0.060
        matrix[5, 1] = 0.085
        matrix[6, 8] = 0.003
        matrix[7, 3] = -0.006
        matrix[8, 4] = 0.52
        matrix[8, 5] = 0.28
        matrix[8, 6] = 0.15
        matrix[8, 7] = 0.05
        matrix *= 0.985
        np.fill_diagonal(matrix, [0.996, 0.965, 0.972, 0.982, 0.970, 0.958, 0.975, 0.950, 0.966])
        return matrix

    @staticmethod
    def _cholesky_restriction() -> np.ndarray:
        covariance = np.array(
            [
                [1.00, -0.34, -0.08, 0.03, -0.18, -0.30, 0.00, -0.02, -0.12],
                [-0.34, 1.00, 0.30, 0.14, 0.22, 0.54, 0.04, 0.06, 0.44],
                [-0.08, 0.30, 1.00, 0.26, 0.48, 0.22, 0.03, 0.04, 0.42],
                [0.03, 0.14, 0.26, 1.00, 0.20, 0.12, 0.04, -0.12, 0.15],
                [-0.18, 0.22, 0.48, 0.20, 1.00, 0.32, 0.12, -0.03, 0.74],
                [-0.30, 0.54, 0.22, 0.12, 0.32, 1.00, 0.08, 0.02, 0.62],
                [0.00, 0.04, 0.03, 0.04, 0.12, 0.08, 1.00, -0.01, 0.24],
                [-0.02, 0.06, 0.04, -0.12, -0.03, 0.02, -0.01, 1.00, 0.10],
                [-0.12, 0.44, 0.42, 0.15, 0.74, 0.62, 0.24, 0.10, 1.00],
            ],
            dtype=float,
        )
        covariance += np.eye(9) * 0.12
        return np.linalg.cholesky(covariance)

    def _stabilize(self, state: np.ndarray) -> np.ndarray:
        bounded = np.array(state, dtype=float)
        bounded[0] = float(np.clip(bounded[0], -0.50, 18.00))
        bounded[1] = float(np.clip(bounded[1], -14.00, 14.00))
        bounded[2] = float(np.clip(bounded[2], -8.00, 8.00))
        bounded[3] = float(np.clip(bounded[3], -1.00, 14.00))
        bounded[4:9] = np.clip(bounded[4:9], -15.00, 15.00)
        return bounded

    def _reconcile_identity(self, state: np.ndarray) -> np.ndarray:
        target = np.array(state[4:9], dtype=float)
        previous = target.copy()

        def objective(x: np.ndarray) -> float:
            weights = np.array([1.00, 1.20, 0.80, 1.35, 1.50])
            return float(np.sum(weights * (x - target) ** 2))

        def identity(x: np.ndarray) -> float:
            return float(x[4] - (x[0] + x[1] + x[2] + x[3]))

        if minimize is not None:
            result = minimize(
                objective,
                previous,
                method="SLSQP",
                bounds=[(-15, 15), (-15, 15), (-15, 15), (-15, 15), (-15, 15)],
                constraints={"type": "eq", "fun": identity},
                options={"maxiter": 160, "ftol": 1e-10, "disp": False},
            )
            if result.success and np.all(np.isfinite(result.x)):
                state[4:9] = result.x
                return state
            self.reconciliation_failures += 1
            logging.warning("SLSQP reconciliation failed: %s", getattr(result, "message", "unknown"))

        # Deterministic fallback: preserve Y and distribute the gap across
        # expenditure components according to their model shares.
        components = state[4:8]
        y = state[8]
        gap = y - float(np.sum(components))
        shares = np.array([0.56, 0.23, 0.22, -0.01], dtype=float)
        shares = shares / float(np.sum(np.abs(shares)))
        state[4:8] = components + gap * shares
        state[4:8] = np.clip(state[4:8], -15.00, 15.00)
        state[8] = float(np.sum(state[4:8]))
        return state

    @staticmethod
    def _engine_for(province: str) -> ProvincialEngine:
        normalized = province.lower()
        if "alberta" in normalized:
            return AlbertaEngine()
        if "ontario" in normalized or "quebec" in normalized or "québec" in normalized:
            return OntarioQuebecEngine()
        return ProvincialEngine()

    def _row(self, month: int, state: np.ndarray, province: str) -> Dict[str, float]:
        return {
            "month": float(month),
            "province": province,
            "policy_rate": round(float(state[0]), 4),
            "capex_growth": round(float(state[1]), 4),
            "employment_growth": round(float(state[2]), 4),
            "headline_cpi": round(float(state[3]), 4),
            "C": round(float(state[4]), 4),
            "I": round(float(state[5]), 4),
            "G": round(float(state[6]), 4),
            "NX": round(float(state[7]), 4),
            "Y": round(float(state[8]), 4),
            "identity_gap": round(float(abs(state[8] - (state[4] + state[5] + state[6] + state[7]))), 10),
        }


def summarize(rows: List[Dict[str, float]], failures: int) -> SimulationMetrics:
    gdp = [row["Y"] for row in rows]
    cpi = [row["headline_cpi"] for row in rows]
    gaps = [row["identity_gap"] for row in rows]
    finite_penalty = 0 if all(math.isfinite(value) for row in rows for value in row.values() if isinstance(value, float)) else 100
    volatility = statistics.pstdev(gdp) + statistics.pstdev(cpi)
    stability = max(0.0, 100.0 - volatility * 3.5 - failures * 12.0 - finite_penalty - max(gaps) * 100.0)
    return SimulationMetrics(
        min_gdp_growth=round(min(gdp), 4),
        max_gdp_growth=round(max(gdp), 4),
        min_inflation=round(min(cpi), 4),
        max_inflation=round(max(cpi), 4),
        max_identity_gap=round(max(gaps), 10),
        convergence_failures=failures,
        stability_score=round(stability, 2),
    )


def run_policy_simulation(scenario: PolicyScenario, baseline: Optional[MacroBaseline] = None) -> Dict[str, Any]:
    configure_logging()
    baseline = baseline or DataIngestor().build_baseline()
    simulator = SVARSimulator(baseline, final_mode=True)
    rows = simulator.run(scenario)
    metrics = summarize(rows, simulator.reconciliation_failures)
    return {"baseline": asdict(baseline), "scenario": asdict(scenario), "metrics": asdict(metrics), "rows": rows}


def run_stress_audit() -> Dict[str, Any]:
    configure_logging()
    baseline = DataIngestor().build_baseline()
    scenarios = [
        PolicyScenario("Alberta", rate_shock_bps=800, corporate_tax_delta_pp=-12, infrastructure_spend_delta_pct=-35, energy_price_delta_pct=-50),
        PolicyScenario("Ontario", rate_shock_bps=800, corporate_tax_delta_pp=-12, infrastructure_spend_delta_pct=-25, consumption_tax_delta_pp=4),
        PolicyScenario("Quebec", rate_shock_bps=-300, corporate_tax_delta_pp=5, infrastructure_spend_delta_pct=80, energy_price_delta_pct=35),
        PolicyScenario("Canada", rate_shock_bps=450, corporate_tax_delta_pp=0, infrastructure_spend_delta_pct=120, energy_price_delta_pct=100),
    ]
    comparisons: List[Dict[str, Any]] = []
    for scenario in scenarios:
        draft = SVARSimulator(baseline, final_mode=False)
        draft_rows = draft.run(scenario)
        final = SVARSimulator(baseline, final_mode=True)
        final_rows = final.run(scenario)
        comparisons.append(
            {
                "scenario": asdict(scenario),
                "draft_1": asdict(summarize(draft_rows, draft.reconciliation_failures)),
                "final": asdict(summarize(final_rows, final.reconciliation_failures)),
                "draft_1_tail": draft_rows[-3:],
                "final_tail": final_rows[-3:],
            }
        )

    payload = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "baseline_source_quality": baseline.source_quality,
        "baseline": asdict(baseline),
        "comparisons": comparisons,
    }
    STRESS_LOG.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    write_evolution_report(payload)
    logging.info("Stress audit complete with %d scenarios", len(comparisons))
    return payload


def write_evolution_report(payload: Dict[str, Any]) -> None:
    rows = []
    for item in payload["comparisons"]:
        scenario = item["scenario"]
        draft = item["draft_1"]
        final = item["final"]
        rows.append(
            "| {province} | {rate:+.0f} | {draft_gap:.6f} | {final_gap:.6f} | {draft_score:.2f} | {final_score:.2f} | {failures} |".format(
                province=scenario["province"],
                rate=scenario["rate_shock_bps"],
                draft_gap=draft["max_identity_gap"],
                final_gap=final["max_identity_gap"],
                draft_score=draft["stability_score"],
                final_score=final["stability_score"],
                failures=final["convergence_failures"],
            )
        )

    report = f"""# Development Evolution Report

Generated: {payload["generated_at_utc"]}

## Baseline Acquisition

Baseline quality: `{payload["baseline_source_quality"]}`.

The engine first attempts public live ingestion from Statistics Canada's Web Data Service and the Bank of Canada Valet API. When an endpoint times out, changes vector metadata, or returns an incomplete observation set, the exception is logged to `simulation_diagnostics.log` and the missing field is replaced with a conservative historical prior. The exact mixed/live/fallback path is recorded in `baseline_data_log.json`.

## What Draft 1 Got Wrong

Draft 1 used the same SVAR transmission ordering but skipped the stabilization and quadratic reconciliation layer. Under extreme rate shocks and tax shocks it produced avoidable accounting identity gaps because `Y` and the expenditure components evolved as independent state variables. In high-volatility cases, the unconstrained recursion could also push inflation and component growth outside plausible institutional stress-test bands.

## Final Structural Decisions

The final build keeps the Cholesky identification order:

`Policy Rate -> CapEx Fixed Investment -> Employment Multipliers -> Demand-Pull/Supply-Side CPI Inflation -> Expenditure Components -> GDP`

It adds three corrections:

1. Province-specific engines for Alberta and Ontario/Quebec transmission channels.
2. A bounded state stabilizer to prevent nonsensical explosive paths during stress tests.
3. A quadratic `scipy.optimize.minimize` reconciliation loop that minimizes revisions to `C`, `I`, `G`, `NX`, and `Y` while enforcing `Y = C + I + G + (X - M)` each month. If SciPy is unavailable or SLSQP fails, a deterministic share-based reconciler preserves execution flow and logs the event.

## Comparative Performance Matrix

| Scenario | Rate shock bps | Draft max identity gap | Final max identity gap | Draft stability | Final stability | Final convergence failures |
|---|---:|---:|---:|---:|---:|---:|
{chr(10).join(rows)}

## Runtime Artifacts

- `macro_simulator_engine.py`: executable engine, CLI, Streamlit wrapper, ingestion, SVAR, reconciliation, and audit harness.
- `baseline_data_log.json`: baseline values and source notes from the latest run.
- `simulation_diagnostics.log`: source exceptions, fallback decisions, and optimizer warnings.
- `stress_test_outputs.json`: full Draft 1 vs final scenario outputs.
"""
    REPORT_PATH.write_text(report, encoding="utf-8")


def run_streamlit() -> None:
    try:
        import streamlit as st
    except ImportError as exc:
        raise SystemExit("Streamlit is optional. Install it or run --simulate/--stress from the CLI.") from exc

    st.set_page_config(page_title="Canada Policy Simulator", layout="wide")
    st.title("Canada Municipal & Macroeconomic Policy Simulator")
    province = st.sidebar.selectbox("Province/region", ["Canada", "Alberta", "Ontario", "Quebec", "British Columbia", "Saskatchewan", "Atlantic"])
    rate = st.sidebar.slider("Policy rate shock (bps)", -400, 900, 0, 25)
    tax = st.sidebar.slider("Corporate tax delta (percentage points)", -15, 10, 0, 1)
    infra = st.sidebar.slider("Infrastructure spend delta (%)", -50, 150, 0, 5)
    energy = st.sidebar.slider("Energy price delta (%)", -75, 125, 0, 5)
    consumption_tax = st.sidebar.slider("Consumption tax delta (percentage points)", -5, 8, 0, 1)
    horizon = st.sidebar.slider("Horizon (months)", 6, 60, 24, 1)

    scenario = PolicyScenario(province, rate, tax, infra, energy, consumption_tax, horizon)
    result = run_policy_simulation(scenario)
    rows = result["rows"]
    st.caption(f"Baseline source quality: {result['baseline']['source_quality']}")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Min GDP growth", result["metrics"]["min_gdp_growth"])
    c2.metric("Max CPI", result["metrics"]["max_inflation"])
    c3.metric("Max identity gap", result["metrics"]["max_identity_gap"])
    c4.metric("Stability score", result["metrics"]["stability_score"])
    st.line_chart({key: [row[key] for row in rows] for key in ["Y", "headline_cpi", "policy_rate", "capex_growth"]})
    st.dataframe(rows, use_container_width=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Canadian SVAR policy simulator")
    parser.add_argument("--stress", action="store_true", help="Run the internal audit and write comparison artifacts")
    parser.add_argument("--simulate", action="store_true", help="Run one CLI simulation and print JSON")
    parser.add_argument("--province", default="Canada")
    parser.add_argument("--rate-shock-bps", type=float, default=0.0)
    parser.add_argument("--corporate-tax-delta-pp", type=float, default=0.0)
    parser.add_argument("--infrastructure-spend-delta-pct", type=float, default=0.0)
    parser.add_argument("--energy-price-delta-pct", type=float, default=0.0)
    parser.add_argument("--consumption-tax-delta-pp", type=float, default=0.0)
    parser.add_argument("--horizon-months", type=int, default=24)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.stress:
        print(json.dumps(run_stress_audit()["comparisons"], indent=2))
        return
    if args.simulate:
        scenario = PolicyScenario(
            province=args.province,
            rate_shock_bps=args.rate_shock_bps,
            corporate_tax_delta_pp=args.corporate_tax_delta_pp,
            infrastructure_spend_delta_pct=args.infrastructure_spend_delta_pct,
            energy_price_delta_pct=args.energy_price_delta_pct,
            consumption_tax_delta_pp=args.consumption_tax_delta_pp,
            horizon_months=args.horizon_months,
        )
        print(json.dumps(run_policy_simulation(scenario), indent=2))
        return
    run_streamlit()


if __name__ == "__main__":
    main()
