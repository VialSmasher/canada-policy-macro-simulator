export type PolicyStatus = "scaled" | "pilot" | "restricted" | "benchmark";
export type EvidenceGrade = "strong" | "moderate" | "early" | "weak";
export type OutcomeDirection = "better" | "worse" | "mixed" | "unknown" | "risk";

export interface PolicyOutcome {
  metric: string;
  adopterSignal: string;
  peerQuestion: string;
  direction: OutcomeDirection;
  grade: EvidenceGrade;
  note: string;
}

export interface PolicyJurisdiction {
  id: string;
  name: string;
  region: string;
  status: PolicyStatus;
  adoption: string;
  posture: string;
  safeguards: string[];
  signals: PolicyOutcome[];
}

export interface PolicyLabSource {
  label: string;
  url: string;
}

export interface PolicyLabPolicy {
  id: string;
  title: string;
  category: string;
  summary: string;
  decisionUse: string;
  testableClaim: string;
  primaryMetric: string;
  policyQuestion: string;
  jurisdictions: PolicyJurisdiction[];
  outcomes: PolicyOutcome[];
  evidenceSteps: string[];
  sources: PolicyLabSource[];
}

export const policyLabPolicies: PolicyLabPolicy[] = [
  {
    id: "drone-first-responder",
    title: "Drone First Responder",
    category: "Public safety technology",
    summary:
      "Prepositioned or docked drones are dispatched to selected emergency calls so command staff and responding officers can see the scene before patrol arrives.",
    decisionUse:
      "A mayor, council, or police board can compare whether DFR improves response, safety, and resource allocation enough to justify privacy, cost, and governance risk.",
    testableClaim: "Drones improve high-priority emergency response without increasing surveillance abuse or public-trust costs.",
    primaryMetric: "Priority-call response and resolution quality",
    policyQuestion: "Are DFR adopters outperforming similar non-adopters after launch?",
    jurisdictions: [
      {
        id: "las-vegas-dfr",
        name: "Las Vegas Metro",
        region: "Nevada",
        status: "scaled",
        adoption: "2024 launch, rapid 2025-2026 expansion",
        posture: "Large DFR network with skyports and command-center integration.",
        safeguards: ["Active response use case", "Encrypted US-based data storage", "FAA Part 107 pilots"],
        signals: [
          {
            metric: "Deployment volume",
            adopterSignal: "10,000+ missions reported for 2025; 20,000 anticipated in 2026",
            peerQuestion: "Did higher mission volume reduce priority response time or simply increase surveillance capacity?",
            direction: "mixed",
            grade: "early",
            note: "Operational scale is visible, but audited outcome attribution is still needed."
          },
          {
            metric: "Privacy and oversight",
            adopterSignal: "Public concern over warrantless aerial response and program expansion",
            peerQuestion: "Do restricted jurisdictions avoid privacy complaints without losing response performance?",
            direction: "risk",
            grade: "moderate",
            note: "Governance risk should be scored beside operational benefit."
          }
        ]
      },
      {
        id: "sparks-dfr",
        name: "Sparks",
        region: "Nevada",
        status: "pilot",
        adoption: "2025 docked-drone launch",
        posture: "Docked drone for critical 911 calls, search and rescue, disaster response, and incident support.",
        safeguards: ["FAA Part 107 operators", "Department policy", "Privacy protocols"],
        signals: [
          {
            metric: "Response time",
            adopterSignal: "Program target is critical-call response in less than 2 minutes",
            peerQuestion: "Does the target hold across real dispatch records?",
            direction: "better",
            grade: "weak",
            note: "Promising operational design, but target data is not the same as audited performance."
          },
          {
            metric: "Resource allocation",
            adopterSignal: "Program cites similar uses showing up to 30% reduction in response to violent calls by canceling stale calls",
            peerQuestion: "Which call types are canceled, and are false cancellations tracked?",
            direction: "mixed",
            grade: "weak",
            note: "This is a claim to test, not a settled outcome."
          }
        ]
      },
      {
        id: "chula-vista-dfr",
        name: "Chula Vista",
        region: "California",
        status: "benchmark",
        adoption: "Mature DFR benchmark",
        posture: "Early DFR model often cited by later adopters.",
        safeguards: ["Public dashboard model", "DFR operating policy", "Emergency response use case"],
        signals: [
          {
            metric: "First on scene",
            adopterSignal: "Reported drones arriving before officers more than 70% of the time in cited program materials",
            peerQuestion: "Did earlier arrival reduce harm, force, or unnecessary patrol dispatches?",
            direction: "better",
            grade: "moderate",
            note: "Response advantage is plausible; outcome advantage still needs controlled comparison."
          }
        ]
      },
      {
        id: "berkeley-dfr",
        name: "Berkeley",
        region: "California",
        status: "restricted",
        adoption: "Debated or restricted posture",
        posture: "Privacy and constitutional-risk concerns are central to the local debate.",
        safeguards: ["Civil liberties review", "Procurement restrictions debated", "Public oversight emphasis"],
        signals: [
          {
            metric: "Civil liberties risk",
            adopterSignal: "Local review materials emphasize privacy, constitutional, and mission-creep concerns",
            peerQuestion: "Does restriction preserve trust while maintaining public-safety outcomes through alternatives?",
            direction: "risk",
            grade: "early",
            note: "Restriction is a policy choice too; it should be compared against operational outcomes."
          }
        ]
      }
    ],
    outcomes: [
      {
        metric: "Priority response time",
        adopterSignal: "DFR programs claim drones can arrive in roughly 2 minutes or less for selected calls",
        peerQuestion: "Compare priority-call response before and after launch against matched non-DFR cities.",
        direction: "better",
        grade: "moderate",
        note: "Best first metric because dispatch timestamps are usually available."
      },
      {
        metric: "Use-of-force and officer injury",
        adopterSignal: "DFR advocates argue early situational awareness can improve de-escalation.",
        peerQuestion: "Did use-of-force incidents per high-risk call fall relative to peers?",
        direction: "unknown",
        grade: "weak",
        note: "Needs incident-level police data, not just program claims."
      },
      {
        metric: "Cancelled or downgraded calls",
        adopterSignal: "Some programs claim drones help determine when calls are stale or lower risk.",
        peerQuestion: "Were cancellations accurate, and did they free patrol capacity without missing active harm?",
        direction: "mixed",
        grade: "weak",
        note: "This can be valuable, but only if false-negative risk is tracked."
      },
      {
        metric: "Privacy complaints and legal exposure",
        adopterSignal: "Civil liberties groups warn DFR can expand aerial surveillance under emergency-response logic.",
        peerQuestion: "Do safeguards reduce complaints, lawsuits, and retention misuse compared with unrestricted programs?",
        direction: "risk",
        grade: "moderate",
        note: "The policy score must count governance outcomes, not just response speed."
      }
    ],
    evidenceSteps: [
      "Record exact adoption date, coverage area, call types, retention rules, and oversight body.",
      "Pull monthly outcomes for at least 24 months before and after launch.",
      "Match each adopter to peer jurisdictions by population, density, crime trend, staffing, and call volume.",
      "Separate operational outputs from public outcomes: flights are not the same as lower harm.",
      "Publish a confidence label so decision-makers can see what is measured, claimed, or still unknown."
    ],
    sources: [
      { label: "LVMPD UAS / DFR program", url: "https://www.lvmpd.com/about/bureaus/homeland-security/small-unmanned-aerial-systems" },
      { label: "Sparks DFR launch", url: "https://www.cityofsparks.us/_T41_R602.php" },
      { label: "OJP DFR implementation overview", url: "https://www.ojp.gov/library/publications/drone-first-responder-practical-insights-law-enforcement-implementation" },
      { label: "MITRE DFR report", url: "https://www.mitre.org/sites/default/files/2023-08/PR-23-2677-DFR-Drone-First-Responder-Programs.pdf" },
      { label: "Nevada Independent oversight reporting", url: "https://thenevadaindependent.com/article/vegas-police-are-filling-the-sky-with-camera-equipped-drones-residents-have-little-input" }
    ]
  }
];
