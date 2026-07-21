import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { approvalStatus, readPlan, writePlan } from "file:///C:/Users/lty/Downloads/Dreative/dist/shared/planGovernance.js";
import { validateCriticArtifact } from "file:///C:/Users/lty/Downloads/Dreative/dist/shared/critic.js";
import { hashFiles, sourceFiles } from "file:///C:/Users/lty/Downloads/Dreative/dist/shared/projectIdentity.js";
import { sealEvidenceRun, sha256 } from "file:///C:/Users/lty/Downloads/Dreative/dist/shared/evidenceRuns.js";
import { appendWorkflowEvent } from "file:///C:/Users/lty/Downloads/Dreative/dist/shared/workflowTrace.js";

const root = process.cwd();
const input = JSON.parse(fs.readFileSync(path.join(root, ".dreative", "critic-input-final.json"), "utf8"));
const report = JSON.parse(fs.readFileSync(path.join(root, ".dreative", "critic-agent-report.json"), "utf8"));
const artifact = { version: 1, input, report };
const validationErrors = validateCriticArtifact(artifact);
if (validationErrors.length) {
  throw new Error(`Independent critic artifact is invalid:\n${validationErrors.join("\n")}`);
}

const plan = readPlan(root);
const approval = approvalStatus(plan);
if (!approval.approved) throw new Error("The current contract is not approved.");
const verification = JSON.parse(fs.readFileSync(path.join(root, ".dreative", "verify.json"), "utf8"));
const trustedVerification = JSON.parse(
  fs.readFileSync(
    path.join(root, ".dreative", "runs", verification.runId, "trusted-verification.json"),
    "utf8",
  ),
);

const runId = `critic-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const nonce = crypto.randomBytes(24).toString("hex");
const runDir = path.join(root, ".dreative", "runs", runId);
fs.mkdirSync(runDir, { recursive: true });
const inputPath = path.join(runDir, "critic-input.json");
const outputPath = path.join(runDir, "critic-report.json");
fs.writeFileSync(inputPath, `${JSON.stringify(input, null, 2)}\n`);
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

const reportBytes = fs.readFileSync(outputPath);
const findings = report.findings ?? [];
const scoreKeys = [
  "ambitionFidelity",
  "conceptFidelity",
  "authorship",
  "temporalDevelopment",
  "treatmentPerceptibility",
  "mobileComposition",
  "interactionPurpose",
  "mediaIntegrity",
];
const scoreFailures = scoreKeys.filter(
  (key) => typeof report.scores?.[key] !== "number" || report.scores[key] < 7,
);
if (typeof report.scores?.staticFeeling !== "number" || report.scores.staticFeeling > 3) {
  scoreFailures.push("staticFeeling");
}
const blockers = findings.filter((item) => item.severity === "BLOCKER" && item.blocksCompletion);
const majors = findings.filter((item) => item.severity === "MAJOR" && item.blocksCompletion);
const startedAt = report.contextIsolation.independentReadingRecordedAt;
const finishedAt = report.reviewedAt;
const reportArtifact = {
  id: "critic-report",
  type: "critic-report",
  path: path.relative(root, outputPath).replaceAll("\\", "/"),
  sha256: sha256(reportBytes),
  bytes: reportBytes.length,
};
const manifest = {
  schemaVersion: 2,
  runId,
  nonce,
  runnerIdentity: sha256("codex-collaboration:/root/final_independent_critic"),
  processId: null,
  providerId: "codex-collaboration-subagent",
  providerClass: "host-isolated",
  assuranceLevel: "local",
  startedAt,
  finishedAt,
  approvedPlanHash: approval.currentHash,
  sourceHash: hashFiles(root, sourceFiles(root)),
  buildHash: verification.buildIdentity.productionBuildHash,
  verificationRunId: verification.runId,
  inputArtifactHashes: {
    criticInput: sha256(fs.readFileSync(inputPath)),
    ...Object.fromEntries(
      input.evidence
        .filter((item) => item.artifactPath)
        .map((item) => [item.id, sha256(fs.readFileSync(path.resolve(root, item.artifactPath)))]),
    ),
  },
  reportHash: sha256(JSON.stringify(report)),
  artifact: reportArtifact,
  computedResult: {
    pass:
      ["PASS", "PASS AFTER REVISION"].includes(report.verdict)
      && blockers.length === 0
      && majors.length === 0
      && scoreFailures.length === 0,
    criticVerdictAdvisoryOnly: false,
    blockers: blockers.length,
    majorFindings: majors.length,
    scoreFailures,
  },
};

fs.writeFileSync(path.join(runDir, "trusted-critic.json"), `${JSON.stringify(manifest, null, 2)}\n`);
sealEvidenceRun(root, "critic", runId, nonce, manifest);
fs.writeFileSync(path.join(root, ".dreative", "critic.json"), `${JSON.stringify(artifact, null, 2)}\n`);

plan.execution.evidenceState = {
  ...plan.execution.evidenceState,
  verificationRunId: verification.runId,
  verificationStatus: "current",
  criticRunId: runId,
  criticStatus: "current",
  certificationStatus: "stale",
};
if (plan.execution.run) plan.execution.run.criticRunId = runId;
plan.execution.lastUpdatedAt = finishedAt;
writePlan(root, plan);
appendWorkflowEvent(root, {
  type: "critic-completed",
  assuranceLevel: "local",
  data: {
    runId,
    providerId: "codex-collaboration-subagent",
    providerClass: "host-isolated",
    verificationRunId: verification.runId,
    computedPass: manifest.computedResult.pass,
  },
});
console.log(JSON.stringify({ runId, computedResult: manifest.computedResult }, null, 2));
