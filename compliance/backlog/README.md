# Compliance Backlog

This folder holds the **a posteriori** regulatory compliance findings produced by
the Markdit compliance agents. It is the single source of truth for outstanding
regulatory remediation work.

## How it works

The compliance agents (read-only on product code) audit the specs, plan, tasks,
and implementation and write their findings here:

| Slash command | Agent | Output file |
| --- | --- | --- |
| `/markdit.compliance.eu` | `markdit.compliance.eu` | `eu-compliance-backlog.md` |
| `/markdit.compliance.na` | `markdit.compliance.na` | `na-compliance-backlog.md` |
| `/markdit.compliance.audit` | `markdit.compliance.audit` | `consolidated-backlog.md` |

Run them from GitHub Copilot Chat after `/speckit.tasks` or `/speckit.implement`.
Findings follow [`TEMPLATE.md`](./TEMPLATE.md).

## Release gate

Per the project constitution (Principle VI — Regulatory Compliance Gate),
**no release may ship with an open `CRITICAL` finding.** The orchestrator
(`/markdit.compliance.audit`) reports a `READY` or `BLOCKED` verdict.

## Severity

- `CRITICAL` — release blocker (e.g., unlawful data processing, missing consent
  before data leaves the device, a primary flow inaccessible).
- `HIGH` — must fix before broad distribution.
- `MEDIUM` — should fix; schedule soon.
- `LOW` — minor / nice to have.

## Turning findings into work items

To track findings as GitHub issues, use `/speckit.taskstoissues` or
`gh issue create` for the desired finding IDs. Agents do not create issues
automatically.
