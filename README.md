# Seekiee

**Job searching is a full-time job. Seekiee is the operations team you do it with.**

Seekiee turns a scattered job hunt — fifty open tabs, a stale spreadsheet, a CV you keep re-tailoring by hand — into one structured pipeline that runs inside the AI assistant you already use. Paste a job posting; get a scored evaluation, a CV tailored to that exact listing, and a tracker entry. Decide with evidence, not vibes.

Built and maintained by [**Darkiee**](https://darkiee.com), an AI & technology studio.

<p>
  <a href="https://seekiee-docs.darkiee.com"><img src="https://img.shields.io/badge/Docs-seekiee--docs.darkiee.com-FF8D28?style=flat" alt="Documentation"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="TRADEMARK.md"><img src="https://img.shields.io/badge/Trademark-Policy-blue.svg" alt="Trademark Policy"></a>
  <a href="https://seekiee.darkiee.com"><img src="https://img.shields.io/badge/Web_App-early_access-8B5CF6?style=flat" alt="Web app early access"></a>
</p>

## The idea

Most job-search tools optimize for *volume*: more applications, faster. Seekiee optimizes for *judgment*. Every posting you feed it gets scored 0–5 across role fit, CV match, level strategy, compensation, culture signals, and posting legitimacy — and when something scores below 4.0, Seekiee tells you not to apply. The goal is five applications worth a recruiter's attention, not fifty they'll skim and reject.

Three principles shape everything in this repo:

1. **You stay in control.** Seekiee evaluates, drafts, and prepares — it never sends anything. Every application is reviewed and submitted by you.
2. **Your data stays yours.** CV, profile, history, and reports live as plain files on your machine. A strict [data contract](DATA_CONTRACT.md) separates your files from system files, so updates never touch your data.
3. **Bring your own AI.** Seekiee ships prompts and structure, not a model. It runs as a skill inside Claude Code, Gemini CLI, OpenCode, Codex, Qwen, or Copilot CLI — whichever you already pay for. Switch models any time; Seekiee doesn't care.

## Two ways to run it

| | **This repo — open-source CLI** | **Hosted web app** |
|---|---|---|
| Where | Your terminal, inside your AI CLI | [seekiee.darkiee.com](https://seekiee.darkiee.com) |
| Cost | Free forever (MIT) | Early access (waitlist), subscription later |
| AI | Your own CLI subscription | Provided by the platform |
| Data | Stays on your machine | Managed for you |
| Best for | Terminal-comfortable users who want full control | Everyone else |

The web app's source is proprietary and not part of this repository. Everything below documents the CLI.

## What the CLI does

- **Evaluate** — paste a URL or job text → structured report with a 0–5 score, gap analysis against your actual CV lines, comp research, and a legitimacy check that flags ghost postings
- **Tailor** — generate an ATS-clean PDF CV adjusted to the specific listing, citing real items from your CV (it never invents experience)
- **Scan** — poll Greenhouse, Lever, and Ashby boards for new postings matching your target roles, with zero AI cost (plain API calls)
- **Track** — one markdown tracker as the source of truth, with dedup, status normalization, and integrity checks built in
- **Compare** — rank several evaluated offers head-to-head when you have to choose
- **Prepare** — interview prep guides per company, a STAR-story bank that grows with every evaluation, negotiation scripts
- **Reach out** — LinkedIn contact strategy and message drafts for the roles you actually want
- **Learn** — rejection-pattern analysis that sharpens your targeting over time
- **Batch** — evaluate a backlog of postings in parallel with headless workers
- **Dashboard** — an optional Go TUI to browse and filter your pipeline in the terminal

## Quick start

```bash
git clone https://github.com/05-deepak-patidar/seekiee-public.git
cd seekiee-public && npm install
npx playwright install chromium    # needed for PDF generation
npm run doctor                     # verifies your setup

claude    # or: gemini / opencode / codex
```

Then just talk to it:

```
/seekiee                  → menu of everything it can do
/seekiee <paste a URL>    → evaluate + tailored CV + tracker entry, in one pass
/seekiee scan             → check your portals for new postings
```

First run, Seekiee walks you through onboarding: your CV, your target roles, your dealbreakers. Expect the first few evaluations to be rough — it hasn't learned you yet. Correct it ("that score is too high, I'd never relocate") and it updates your profile files so the next one is sharper.

**The whole system is editable by talking to it.** Want different role archetypes, another language, different scoring weights, more companies in the scanner? Ask your AI assistant to change it — it edits the same files it reads. Full documentation at [seekiee-docs.darkiee.com](https://seekiee-docs.darkiee.com).

## Ethics, stated plainly

Seekiee will not mass-apply, will not submit anything without your review, and will actively talk you out of weak applications. Recruiters' time and your time both matter. If you want a spray-and-pray bot, this is the wrong tool.

## Contributing

Issues and PRs welcome — open an [issue](https://github.com/05-deepak-patidar/seekiee-public/issues) first to discuss the change. See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [GOVERNANCE.md](GOVERNANCE.md). Security reports: see [SECURITY.md](SECURITY.md).

## Disclaimer

By using this software, you acknowledge:

1. **You control your data.** When running the CLI, your CV and personal data stay on your machine and go directly to the AI provider you choose. The hosted web app processes only what you submit, to provide the service.
2. **You control the AI.** Default prompts instruct the AI not to auto-submit applications, but models can behave unpredictably. Always review AI-generated content before submitting.
3. **You comply with third-party ToS.** Use Seekiee in accordance with the Terms of Service of the portals you interact with. Do not use it to spam employers or overwhelm ATS systems.
4. **No guarantees.** Evaluations are recommendations, not truth. The authors are not liable for employment outcomes or any other consequences.

See [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) for full details. Provided under the [MIT License](LICENSE) "as is", without warranty of any kind.

## License & Trademark

The code is licensed under [MIT](LICENSE) © Darkiee. The **Seekiee** and **Darkiee** names, logos, and visual identity are brand assets governed by the [Trademark Policy](TRADEMARK.md) — permissive for community use, reserved for commercial product naming and endorsement.

## Connect

[![Website](https://img.shields.io/badge/darkiee.com-000?style=flat&logo=safari&logoColor=white)](https://darkiee.com)
[![Docs](https://img.shields.io/badge/Docs-FF8D28?style=flat&logo=readthedocs&logoColor=white)](https://seekiee-docs.darkiee.com)
[![Newsletter](https://img.shields.io/badge/Newsletter-insights.darkiee.com-8B5CF6?style=flat&logo=substack&logoColor=white)](https://insights.darkiee.com/)
[![Email](https://img.shields.io/badge/Email-EA4335?style=flat&logo=gmail&logoColor=white)](mailto:hello@darkiee.com)
