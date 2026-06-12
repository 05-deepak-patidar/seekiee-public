---
name: seekiee
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
arguments: mode # Claude Code specific
user-invocable: true
argument-hint: "[scan | deep | pdf | evaluate | compare | apply | batch | tracker | pipeline | outreach | training | project | interview-prep | update]"
license: MIT
---

# seekiee -- Router

## Mode Routing

Determine the mode from `$mode`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `evaluate` | `evaluate` |
| `compare` | `compare` |
| `outreach` | `outreach` |
| `deep` | `deep` |
| `interview-prep` | `interview-prep` |
| `pdf` | `pdf` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `scan` | `scan` |
| `batch` | `batch` |
| `patterns` | `patterns` |
| `followup` | `followup` |
| `update` | `update` |

**Auto-pipeline detection:** If `$mode` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

If `$mode` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
seekiee -- Command Center

Available commands:
  /seekiee {JD}      → AUTO-PIPELINE: evaluate + report + PDF + tracker (paste text or URL)
  /seekiee pipeline  → Process pending URLs from inbox (data/pipeline.md)
  /seekiee evaluate    → Evaluation only A-F (no auto PDF)
  /seekiee compare   → Compare and rank multiple offers
  /seekiee outreach  → LinkedIn power move: find contacts + draft message
  /seekiee deep      → Deep research prompt about company
  /seekiee interview-prep → Generate company-specific interview prep doc
  /seekiee pdf       → PDF only, ATS-optimized CV
  /seekiee training  → Evaluate course/cert against North Star
  /seekiee project   → Evaluate portfolio project idea
  /seekiee tracker   → Application status overview
  /seekiee apply     → Live application assistant (reads form + generates answers)
  /seekiee scan      → Scan portals and discover new offers
  /seekiee batch     → Batch processing with parallel workers
  /seekiee patterns  → Analyze rejection patterns and improve targeting
  /seekiee followup  → Follow-up cadence tracker: flag overdue, generate drafts
  /seekiee update    → Update seekiee system files with diff preview + compat check

Inbox: add URLs to data/pipeline.md → /seekiee pipeline
Or paste a JD directly to run the full pipeline.
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + their mode file:
Read `modes/_shared.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `evaluate`, `compare`, `pdf`, `outreach`, `apply`, `pipeline`, `scan`, `batch`

### Standalone modes (only their mode file):
Read `modes/{mode}.md`

Applies to: `tracker`, `deep`, `interview-prep`, `training`, `project`, `patterns`, `followup`

### Modes delegated to subagent:
For `scan`, `apply` (with Playwright), and `pipeline` (3+ URLs): launch as Agent with the content of `_shared.md` + `modes/{mode}.md` injected into the subagent prompt.

```
Agent(
  subagent_type="general-purpose",
  prompt="[content of modes/_shared.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="seekiee {mode}"
)
```

Execute the instructions from the loaded mode file.
