# FollowUpBussiness — Global Agent Instructions

## Language and lightweight MVP mode

Operational instructions, agent prompts, and project skills are written in English to reduce context cost. User-facing replies and canonical artifacts (context packages, handoffs, Security reports, and DoF reports) must be written in Spanish. Preserve identifiers, commands, code, contract terms, and source-language quotations.

Deliver safe, verifiable stories with the least necessary context. This lightweight workflow overrides more detailed templates.

## Context loading

In `Development → QA → Security → DoF`, only the Orchestrator initially reads the full story and applicable source sections, located first by ID, endpoint, or symbol. It summarizes criteria, decisions, and paths in the context package; never copy sources or per-file hashes.

Each phase receives a clean context containing only the package path, current `Candidate-ID`, immediately previous handoff, phase scope, and expected state. It must not receive chat history or reread the story, contract, or ADR. Open a primary source only for an ambiguity, new surface, or contradiction; record the reason, path, and section.

Outside the orchestrated workflow, read the story, the application's local `AGENTS.MD`, and the related diff/tests. Consult contracts, context, ADRs, or technical documentation only through a concrete reference. Use `rg` before opening large files.

## Minimal artifacts

Per story allow only: one context package; one Dev handoff; one QA handoff; one final Security report when applicable; and one DoF report. Security preflight is a short package/report section, never a separate artifact. Record an early block in the current package.

For the same candidate, replace current state. Add only a delta when candidate, scope, contract, sensitive data, or threat changes. Git preserves history. Artifacts contain IDs, decisions, paths, summarized results, findings, and pending work—no logs, copied code/sources, or historical narrative.

Suggested limits: package 900 words; Dev/QA/Security handoffs 300 words each; DoF 150 words. Link evidence instead of copying it and explain any necessary exception in one line.

## Candidate and gates

`Candidate-ID` is the target commit, or before commit `HEAD + short diff digest`. Compute it once after Development changes code. Do not create per-file hash manifests. QA, Security, and DoF compare the ID plus a quick `git status --porcelain` or commit signature.

The package holds one current Candidate-ID; replace the previous value and record only the delta. A gate checks only: previous artifact exists, story/state permits transition, and Candidate-ID matches. Missing descriptive metadata is a warning when those three facts are clear; the Orchestrator may fix it without a new gate or session.

## Proportional verification

- Development runs focused tests and direct regression. Before its first handoff, run one local CI-equivalent validation when shared composition changes: context/beans, security, configuration, migrations, transactions, serialization, shared fixtures, dependencies, or build. Use quiet `clean verify` for Backend and the Frontend/Mobile CI equivalent. QA and Security reuse it.
- QA independently validates affected criteria, one relevant negative case, and direct regression; expand only when the diff or a failure warrants it.
- Security applies only to authentication/authorization, tenant isolation, personal/location data, secrets, public exposure, files, payments, or infrastructure. Otherwise record `NOT_APPLICABLE` in one sentence.
- Use preflight only for a genuinely ambiguous security/contract decision before implementation; define at most five controls. Do not repeat it during remediation unless risk expands.
- Final Security reuses QA and reproduces only an abuse case capable of changing its decision.
- Run DoF once on the final candidate. Verify states, candidate, findings, applicable validation, and `git diff --check`; do not reread sources or rerun suites. Wait for mandatory CI only when no local equivalent exists.

After `CHANGES_REQUIRED`: affected Dev → affected QA. Reopen Security only if sensitive surface, threat/control, or decisive evidence changes; test/docs/metadata-only changes are `NOT_APPLICABLE` in one sentence. Never run DoF between remediations.

## Phase budgets and security invariants

Generic chats only orchestrate and invoke a specialized role with `fork_turns: "none"`; specialized sessions execute their role without nesting it. Batch reads/tests, use quiet commands, and open detailed reports only on failure.

- QA: about 10 tool calls and 2 test commands.
- Security: 8 calls and 1 abuse reproduction.
- DoF: 6 calls; no tests or source reads.
- Test-only remediation: 12 calls and 2 test commands.
- Per story: one initial run per role and at most one `Dev → QA` correction; stop before session 8 and consolidate cause, closure condition, and command.

Each phase opens only package, previous handoff, diff, and affected code/tests. Another source requires a recorded ambiguity, contradiction, or new risk. QA, Security, DoF, and test-only remediation do not use Graphify.

Before Development, stories involving authorization, tenant, roles, audit, migrations, or transactions define up to five invariants: actor/resource, success, denial, conflict, and failure/rollback. Missing public semantics blocks implementation. For every rejection/no-op define response, writes/revocations, events/audit, and credentials/sessions. Enumerate reachable ports. Free text requires a per-sink policy: omit, marker, or approved category.

Development keeps control→test mapping in memory and verifies the absence of every forbidden effect before handoff. QA covers the complete affected surface and consolidates findings; stop early only for Critical/High. Revalidation covers the fix, not unrelated criteria. Test-only changes do not reopen production, architecture, or contracts unless the test fails. A new Security finding must identify a previously uncovered threat and an observable closure condition.

## Repository and non-negotiable rules

- `backend/`: Java/Spring Boot; `frontend/`: React/TypeScript; `mobile/`: Flutter; `infrastructure/` and `docker-compose.yml`: shared infrastructure.
- Never invent business rules. Preserve traceability and tenant isolation. Never expose secrets or personal data in code, logs, or evidence.
- Create an ADR only for a real architecture decision. Do not modify out of scope or overwrite others' changes. No agent approves its own work.

## Frontend visual reference

During Frontend Development only, look first for the exact `docs/frontendMockups/<HU-ID>.html`. If present, use it as visual reference. Otherwise inspect existing HTML mockups for patterns and optionally create that file as a static proposal. A mockup does not define business rules or replace acceptance criteria, contracts, or accessibility.

## Workflow states

1. Development: `READY_FOR_HANDOFF` or `BLOCKED`.
2. Independent QA: `PASS`, `CHANGES_REQUIRED`, or `BLOCKED`.
3. Security when applicable: `PASS`, `CHANGES_REQUIRED`, `BLOCKED`, or `NOT_APPLICABLE`; preflight: `ADVISORY`.
4. DoF: `PASS` or `BLOCKED`.

Do not start a phase unless the previous state permits it. QA/Security `CHANGES_REQUIRED` or `BLOCKED` prevents DoF. Chat text does not replace the canonical artifact, though the Orchestrator may transcribe a read-only reviewer's verdict verbatim.

## Git and Graphify

Use one branch per story and separate commits per application when applicable. Agents do not commit unless explicitly requested. DoF ends at its verdict; commit, push, PR, merge, and release CI are later Release operations.

Use Graphify only for explicit `/graphify` or broad unknown-scope architecture/dependency/impact questions. Never use it for routine phases, focused QA/Security/DoF, Git, or Release. When needed, run exactly one `graphify query`, `graphify path`, or `graphify explain`. Read `GRAPH_REPORT.md` only for broad architecture review or insufficient query output. Production Development may update the graph once at the end; test/docs-only changes do not require it.
