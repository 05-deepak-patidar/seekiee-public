# Seekiee

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Українська](README.ua.md) | [Русский](README.ru.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <a href="https://seekiee.darkiee.com"><img src="docs/hero-banner.jpg" alt="Seekiee — AI Job Search Command Center by Darkiee" width="800"></a>
</p>

<p align="center">
  <strong>Companies use AI to filter candidates.<br>Seekiee gives candidates AI to <em>choose</em> companies.</strong><br>
  <em>Your AI-powered job search command center — by <a href="https://darkiee.com">Darkiee</a>.</em>
</p>

<p align="center">
  <a href="https://seekiee.darkiee.com"><img src="https://img.shields.io/badge/Request_early_access-FF8D28?style=for-the-badge&logoColor=white" alt="Request early access"></a>
  <a href="https://discord.gg/8pRpHETxa4"><img src="https://img.shields.io/badge/Join_the_community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white" alt="Claude Code">
  <img src="https://img.shields.io/badge/OpenCode-111827?style=flat&logo=terminal&logoColor=white" alt="OpenCode">
  <img src="https://img.shields.io/badge/Gemini_CLI-4285F4?style=flat&logo=google&logoColor=white" alt="Gemini CLI">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT">
  <a href="TRADEMARK.md"><img src="https://img.shields.io/badge/Trademark-Policy-blue.svg" alt="Trademark Policy"></a>
  <a href="https://seekiee-docs.darkiee.com"><img src="https://img.shields.io/badge/Docs-seekiee--docs.darkiee.com-FF8D28?style=flat" alt="Docs"></a>
</p>

---

<p align="center">
  <img src="docs/demo.gif" alt="Seekiee Demo" width="800">
</p>

<p align="center"><strong>Battle-tested across 740+ job listings · 100+ tailored CVs · a real senior-role search</strong></p>

## What Is Seekiee

**Seekiee** is an AI job search command center by [**Darkiee**](https://darkiee.com), an AI & technology studio. It turns the messy, manual grind of job hunting into a single AI-powered pipeline that:

- **Evaluates offers** with a structured A–G scoring system across 10 weighted dimensions — role fit, comp, culture, growth, and posting legitimacy
- **Generates tailored CVs** — ATS-optimized PDFs customized to each job description, not a one-size-fits-all resume
- **Scans portals** automatically (Greenhouse, Ashby, Lever, and 45+ company pages) at zero LLM cost
- **Batches at scale** — evaluate 10+ offers in parallel with sub-agents
- **Tracks everything** in one source of truth with built-in integrity checks

> **Seekiee is a filter, not a firehose.** It exists to help you find the few offers genuinely worth your time out of hundreds — and it actively recommends *against* applying to anything scoring below 4.0/5. Your time matters. So does the recruiter's. You always review before anything is sent.

Seekiee is agentic: it navigates career pages with Playwright, reasons about your CV against each job description (not keyword matching), and adapts your resume per listing. This repository is the **open-source CLI engine** — run it as a skill inside Claude Code, Gemini CLI, or OpenCode. Prefer a polished web experience? Darkiee runs a managed web app (see [Open-Source Engine vs. Hosted App](#open-source-engine-vs-hosted-app)).

> **The first evaluations won't be perfect — and that's by design.** The system doesn't know you yet. Feed it your CV, your career story, your proof points, your dealbreakers. The more you nurture it, the sharper it gets. Think of it as onboarding a new recruiter: a week to learn you, then invaluable.

## Open-Source Engine vs. Hosted App

Seekiee is **open core**:

- **This repo — the CLI engine (free, MIT, no UI):** the full evaluation rubric, CV generation, portal scanner, batch processing, and pipeline tracking, run from your terminal inside the AI CLI you already use. Your data stays on your machine.
- **The hosted web app (paid, by Darkiee):** a managed, no-install web experience at **[seekiee.darkiee.com](https://seekiee.darkiee.com)**, currently in **limited early access**. Request access, join the waitlist, and you'll get an email when your account is approved. The web app's source is proprietary and not part of this repository.

Everything below documents the open-source CLI engine.

## Features

| Feature                  | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-Pipeline**        | Paste a URL, get a full evaluation + tailored PDF + tracker entry                                                                        |
| **A–G Evaluation**       | Role summary, CV match, level strategy, comp research, personalization, interview prep (STAR+R), posting legitimacy                      |
| **Interview Story Bank** | Accumulates STAR+Reflection stories across evaluations — 5–10 master stories that answer any behavioral question                         |
| **Negotiation Scripts**  | Salary negotiation frameworks, geographic-discount pushback, competing-offer leverage                                                    |
| **ATS PDF Generation**   | Keyword-matched CVs with a clean, recruiter-ready design                                                                                 |
| **Portal Scanner**       | 45+ companies pre-configured + custom queries across Ashby, Greenhouse, Lever, Wellfound — zero LLM cost                                 |
| **Batch Processing**     | Parallel evaluation with headless workers                                                                                                |
| **Terminal Dashboard**   | A Go-powered TUI to browse, filter, and sort your pipeline                                                                               |
| **Human-in-the-Loop**    | Seekiee evaluates and recommends; you decide and act. It never submits an application — you always have the final call                   |
| **Pipeline Integrity**   | Automated merge, dedup, status normalization, health checks                                                                              |

## Get Started

Run Seekiee as a skill inside the AI CLI you already use:

```bash
git clone https://github.com/05-deepak-patidar/seekiee-public.git && cd seekiee-public
claude   # or: gemini / opencode
# → Run /seekiee to start
```

> Want a no-install web experience instead? Request early access to the hosted app at [seekiee.darkiee.com](https://seekiee.darkiee.com).

---

## Quick Start (CLI / local dev)

```bash
# 1. Clone and install
git clone https://github.com/05-deepak-patidar/seekiee-public.git
cd seekiee-public && npm install
npx playwright install chromium   # Required for PDF generation

# 2. Check setup
npm run doctor                     # Validates all prerequisites

# 3. Configure
cp config/profile.example.yml config/profile.yml   # Edit with your details
cp templates/portals.example.yml portals.yml       # Customize companies

# 4. Add your CV
# Create cv.md in the project root with your CV in markdown

# 5. Personalize with your AI CLI
claude   # Open Claude Code in this directory

# Then ask it to adapt the system to you:
# "Change the archetypes to backend engineering roles"
# "Add these 5 companies to portals.yml"
# "Update my profile with this CV I'm pasting"

# 6. Start using
# Paste a job URL or run /seekiee
```

> **Seekiee is designed to be customized by the AI itself.** Modes, archetypes, scoring weights, negotiation scripts — just ask. It reads the same files it uses, so it knows exactly what to edit.

Full documentation: **[seekiee-docs.darkiee.com](https://seekiee-docs.darkiee.com)**.

## Usage

Seekiee is a single slash command with multiple modes:

```
/seekiee                → Show all available commands
/seekiee {paste a JD}   → Full auto-pipeline (evaluate + PDF + tracker)
/seekiee scan           → Scan portals for new offers
/seekiee pdf            → Generate ATS-optimized CV
/seekiee batch          → Batch evaluate multiple offers
/seekiee tracker        → View application status
/seekiee apply          → Fill application forms with AI
/seekiee pipeline       → Process pending URLs
/seekiee outreach       → LinkedIn outreach message
/seekiee deep           → Deep company research
/seekiee training       → Evaluate a course/cert
/seekiee project        → Evaluate a portfolio project
```

Or just paste a job URL or description directly — Seekiee auto-detects it and runs the full pipeline.

## How It Works

```
You paste a job URL or description
        │
        ▼
┌──────────────────┐
│  Archetype       │  Classifies the role against your target archetypes
│  Detection       │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  A-G Evaluation  │  Match, gaps, comp research, STAR stories, legitimacy
│  (reads cv.md)   │
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Report  PDF  Tracker
  .md   .pdf   .tsv
```

## Pre-configured Portals

The scanner ships with **45+ companies** and **19 search queries** across major job boards. Copy `templates/portals.example.yml` to `portals.yml` and add your own:

**AI Labs:** Anthropic, OpenAI, Mistral, Cohere, LangChain, Pinecone
**Voice AI:** ElevenLabs, PolyAI, Parloa, Hume AI, Deepgram, Vapi, Bland AI
**AI Platforms:** Retool, Airtable, Vercel, Temporal, Glean, Arize AI
**Contact Center:** Ada, LivePerson, Sierra, Decagon, Talkdesk, Genesys
**Enterprise:** Salesforce, Twilio, Gong, Dialpad
**LLMOps:** Langfuse, Weights & Biases, Lindy, Cognigy, Speechmatics
**Automation:** n8n, Zapier, Make.com
**European:** Factorial, Attio, Tinybird, Clarity AI, Travelperk

**Job boards searched:** Ashby, Greenhouse, Lever, Wellfound, Workable, RemoteFront

By default `node scan.mjs` (a.k.a. `npm run scan`) trusts what each ATS feed returns. Some companies leave stale postings in their public API even after the role is closed. Pass `--verify` to launch Playwright after the API pass and drop expired postings before they hit the pipeline:

```bash
node scan.mjs --verify          # zero-token discovery + Playwright liveness check
```

## Dashboard TUI

The built-in terminal dashboard lets you browse your pipeline visually:

```bash
cd dashboard
go build -o career-dashboard .
./career-dashboard --path ..
```

Features: 6 filter tabs, 4 sort modes, grouped/flat view, lazy-loaded previews, inline status changes.

## Tech Stack

- **Agent**: AI CLI (Claude Code / Gemini / OpenCode) with custom skills and modes
- **PDF**: Playwright + HTML template
- **Scanner**: Greenhouse / Ashby / Lever APIs + optional Playwright liveness check
- **Dashboard**: Go + Bubble Tea + Lipgloss (Seekiee dark theme)
- **Data**: Markdown tables + YAML config + TSV batch files

## About Darkiee

**Seekiee** is built by [**Darkiee**](https://darkiee.com) — an AI & technology studio building tools that put powerful automation in people's hands. Seekiee is our flagship: your AI-powered job search command center.

Learn more → [darkiee.com](https://darkiee.com)

## Disclaimer

By using this software, you acknowledge:

1. **You control your data.** When self-hosting or running the CLI, your CV and personal data stay on your machine and go directly to the AI provider you choose. The hosted Darkiee instance processes only what you submit, to provide the service.
2. **You control the AI.** Default prompts instruct the AI not to auto-submit applications, but models can behave unpredictably. Always review AI-generated content before submitting.
3. **You comply with third-party ToS.** Use Seekiee in accordance with the Terms of Service of the portals you interact with. Do not use it to spam employers or overwhelm ATS systems.
4. **No guarantees.** Evaluations are recommendations, not truth. The authors are not liable for employment outcomes or any other consequences.

See [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) for full details. Provided under the [MIT License](LICENSE) "as is", without warranty of any kind.

## License & Trademark

The code is licensed under [MIT](LICENSE). The **Seekiee** and **Darkiee** names, logos, and visual identity are brand assets governed by the [Trademark Policy](TRADEMARK.md) — permissive for community use, reserved for commercial product naming and endorsement.

## Credits

Seekiee's engine builds on the open-source [career-ops](https://github.com/santifer/career-ops) project, used under the MIT License. See [`NOTICE`](NOTICE) for full attribution.

## Let's Connect

[![Website](https://img.shields.io/badge/darkiee.com-000?style=for-the-badge&logo=safari&logoColor=white)](https://darkiee.com)
[![Docs](https://img.shields.io/badge/Docs-FF8D28?style=for-the-badge&logo=readthedocs&logoColor=white)](https://seekiee-docs.darkiee.com)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/8pRpHETxa4)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hello@darkiee.com)
