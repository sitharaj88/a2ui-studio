# A2UI Studio

**Experiment with [A2UI](https://a2ui.org) — Google's open protocol for agent-driven interfaces — right inside VS Code.**

[![Install from VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Install%20from%20Marketplace-0E8385?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=sitharaj.a2ui-studio)
[![Version](https://img.shields.io/badge/version-1.1.0-7CC242)](https://marketplace.visualstudio.com/items?itemName=sitharaj.a2ui-studio)
[![License](https://img.shields.io/badge/license-Apache--2.0-E9A23B)](LICENSE)

Describe any UI in plain language and watch an AI agent stream live **A2UI v0.9.1** protocol messages that render as beautiful, fully interactive surfaces: forms, wizards, dashboards, product cards — with real data binding, validation, and action round-trips back to the agent.

Built for **Claude Opus 5 and Claude Sonnet 5**: Opus designs, Sonnet reacts. Adaptive thinking, effort control, prompt caching, streamed reasoning and live cost tracking are wired in through the official Anthropic SDK — and GitHub Copilot, OpenAI, Gemini and Ollama still work exactly as before.

## 📦 Install

Install from the **[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=sitharaj.a2ui-studio)**, or inside VS Code open the Extensions view and search **“A2UI Studio”**. From the command line:

```bash
code --install-extension sitharaj.a2ui-studio
```

Then run **`A2UI: Open Playground`** from the command palette and click an instant demo — no API key needed to start.

## ✨ Features

- **Live A2UI renderer** — a complete client implementation of the A2UI v0.9.1 basic catalog (`Card`, `Row`/`Column`/`List` with templated children, `Tabs`, `Modal`, `TextField`, `ChoicePicker`, `Slider`, `DateTimeInput`, `CheckBox`, `Button`, media…), styled with a **Material 3 / Fluent design system** — floating-label fields, button ripple, segmented pickers, sliding tabs, elevation and state layers, in both light and dark themes.
- **Studio Extended Catalog** — 12 modern components on top of the basic set so agents can build real apps: **Pages** (multi-page navigation the agent can drive), **Stepper** wizards, **Hero** headers, **StatCard** KPIs, **Chart** (bar/line/donut, pure SVG), **Table**, **Timeline**, **Accordion**, **Rating**, **ProgressBar**, **Avatar**, **Badge**.
- **Claude 5 agent** — a designer/builder split on the official Anthropic SDK: **Claude Opus 5** creates new surfaces at full effort, **Claude Sonnet 5** answers button actions and repairs invalid messages at lower effort. Adaptive thinking with a live **reasoning stream** in the chat, `effort` control per turn type, **prompt caching** on the system prompt and conversation prefix, server-side **refusal fallback**, typed error messages, and a dashboard card with tokens, cache hit rate and estimated cost. See [Claude 5 agent](#-claude-5-agent).
- **Any AI provider**:
  - **Anthropic Claude** — Opus 5, Sonnet 5, Haiku 4.5 (API key in VS Code secret storage, or `ANTHROPIC_API_KEY`)
  - **Z.ai GLM** — GLM-5.3 and GLM-5.3-Flash on the **GLM Coding Plan** (or the general API), with the model's reasoning streamed into the chat. See [GLM Coding Plan](#-glm-coding-plan).
  - **GitHub Copilot** via the VS Code Language Model API — zero configuration if you have Copilot
  - **OpenAI**, **Google Gemini** — bring your own API key
  - **Ollama** — fully local, no key needed
- **Live model picker** — the model dropdown lists what's actually available: Copilot chat models, your Anthropic/OpenAI/Gemini account models, or locally pulled Ollama models (with curated fallbacks and a custom-ID option).
- **Dashboard** — session stats, message-stream anatomy, provider status, recent activity and quick-start demos in a dedicated view; a chat pane tracks every prompt, action and agent turn.
- **Progressive streaming** — surfaces render incrementally as JSONL messages arrive, exactly as the protocol intends.
- **Two-way data binding** — type in a bound `TextField` and watch every dependent binding (and the Data Model inspector) update live.
- **Action round-trips** — click a rendered `Button` and the action event + current data model are sent back to the agent, which responds with new A2UI messages.
- **Inspectors** — live views of the raw message stream (with validation errors), each surface's data model, and the action log.
- **Instant demos** — prerecorded example streams (including a three-page **Analytics app**) render with no AI setup at all, so you can feel the protocol in seconds.
- **Live preview editor** — open any `*.a2ui.json(l)` file with the **A2UI Live Preview** editor (right-click → Open With) and watch your edits re-render as you type.
- **Component inspector** — toggle Inspect on the canvas, click any component to see its JSON definition and live data bindings; hover a stream message to flash the components it created.
- **Model arena** — one prompt, two providers side by side, with message/validity/latency stats.
- **Session replay** — scrub through the session's message stream like a debugger.
- **Editable data models** — edit any surface's data model JSON in the Data tab and watch bindings react.
- **Prompt library** — save your favorite prompts; they persist across sessions and appear in the gallery and composer chips.
- **Surface export** — export any rendered surface as a standalone HTML snapshot, or the whole session as replayable `.a2ui.jsonl`.
- **Custom catalogs** — point `a2ui.config.json` at your design system's catalog; the agent generates against it, and unknown components render as labeled placeholders.
- **Copilot Agent integration** — generate A2UI JSONL in Agent mode, then use the `a2uiPreviewSurface` tool to open the result in the Studio interface.
- **Remote A2A agents (experimental)** — connect to a real A2UI-capable A2A endpoint instead of simulating one.
- **Auto-repair loop with a surface linter** — per-message validation plus cross-message checks (dangling child ids, missing `root`, duplicate ids, updates to surfaces never created, `Card` with multiple children) are reported back to the model for one corrective turn (the spec's prompt-generate-validate loop).

## 📖 Prompt cookbook

**[PROMPTS.md](PROMPTS.md)** has copy-paste prompts for video players and playlists, validated forms, dashboards with templated lists, quizzes, a text adventure, enterprise approval flows, arena-worthy challenges, and round-trip follow-ups — each designed to exercise a specific part of the A2UI protocol. It also lists verified sample video URLs *with audio* (many popular "sample video" sites ship silent files).

## 🧠 Claude 5 agent

The studio treats a UI session as two kinds of turns and routes each to the model best suited for it:

| Turn | Default model | Default effort | Why |
| --- | --- | --- | --- |
| **Design** — a new prompt in the chat | `claude-opus-5` | `high` | Layout, hierarchy, seeded data and theme are creative work; Opus 5 produces the richest surfaces. |
| **Action / repair** — a button round-trip or an auto-repair turn | `claude-sonnet-5` | `medium` | Reacting to a click or fixing a dangling id is precise, scoped work; Sonnet 5 is fast and cheap at it. |

Everything is tunable in **Settings → Claude 5 agent** (or per profile in `a2ui.config.json`): design effort (`low` → `max`), the action model (or "same as design model"), action effort, whether to stream reasoning, and the refusal fallback.

What the Claude provider does on every request:

- **Adaptive thinking** with `display: "summarized"` — the model's reasoning summary streams into the chat as a collapsible *Reasoning* block, so you can see how it planned the surface.
- **`output_config.effort`** per turn type; no sampling parameters (Claude 5 models reject `temperature`).
- **Prompt caching** breakpoints on the system prompt and the latest user turn, so multi-turn sessions pay for the protocol tutorial once. The dashboard shows the cache hit rate.
- **Refusal handling** — a `stop_reason: "refusal"` becomes a clear chat error with the category; with the fallback enabled, the API re-runs the request on Anthropic's recommended fallback model in the same call and the chat tells you which model answered.
- **Typed errors** — bad key, rate limit, unknown model, unreachable gateway each get a specific, actionable message.
- **Usage and cost** — input/output/cache tokens and an estimated USD cost per session, on the dashboard.

Legacy Claude models (Haiku 4.5, Sonnet 4.x, Claude 3.x) are detected by id and get the classic request shape (temperature, no thinking/effort), so gateways and older accounts keep working. The **Model arena** has a one-click **Opus 5 vs Sonnet 5** preset.

## ⚡ GLM Coding Plan

Z.ai's **GLM Coding Plan** subscription works out of the box: pick **Z.ai GLM (Coding Plan)** as the provider and store your plan key with `A2UI: Set AI Provider API Key`.

| Setting | Default | Notes |
| --- | --- | --- |
| `a2ui.zai.plan` | `coding` | `coding` → `https://api.z.ai/api/coding/paas/v4`, `general` → `https://api.z.ai/api/paas/v4`. Coding Plan keys only work on the coding endpoint and general keys only on the general one, so match the plan to your key. |
| `a2ui.zai.reasoningEffort` | `high` | GLM-5.x always thinks; this sets the depth (`low`, `high`, `max`). |
| `a2ui.baseUrls.zai` | *(empty)* | Override for the China-region endpoint (`https://open.bigmodel.cn/api/coding/paas/v4`) or a proxy. |

Models: `glm-5.3` (flagship), `glm-5.3-flash` (fast, multimodal), plus `[1m]` variants that unlock the 1M-token context window. The live model list is fetched from your endpoint when a key is stored. GLM's `reasoning_content` streams into the chat as the same *Reasoning* block Claude uses, and token usage lands on the dashboard.

## 🚀 Getting started

1. Run **`A2UI: Open Playground`** from the command palette (or the A2UI icon in the activity bar).
2. Click an **Instant demo** card — no setup needed — or pick a provider in the header:
   - **Claude**: run **`A2UI: Set AI Provider API Key`** (or launch VS Code with `ANTHROPIC_API_KEY` set). Opus 5 designs, Sonnet 5 handles actions by default.
   - **GitHub Copilot**: works out of the box if the Copilot extension is signed in.
   - **GLM (Z.ai)**: run **`A2UI: Set AI Provider API Key`** with your Coding Plan key; set `a2ui.zai.plan` to `general` if you use a pay-as-you-go key instead.
   - **OpenAI / Gemini**: run **`A2UI: Set AI Provider API Key`** first.
   - **Ollama**: have `ollama serve` running locally.
3. Describe a UI — *“a coffee order form with size, milk options and a pay button”* — and press Enter.
4. Interact with the generated surface. Button actions go back to the agent, which updates the UI in response.

In Copilot Agent mode, ask the agent to generate valid A2UI JSONL and invoke
`a2uiPreviewSurface` to open it in the Studio. The Studio interface itself is
unchanged: Dashboard, Playground, Arena, Gallery and Settings remain available
from the A2UI activity bar or the `A2UI: Open Playground` command.

## 🏢 Team configuration: `a2ui.config.json`

Commit an `a2ui.config.json` (or `.a2ui/config.json`) to your workspace to share provider setups with your whole team — schema-validated, hot-reloaded, and selectable from the studio header:

```json
{
  "$schema": "https://raw.githubusercontent.com/sitharaj88/a2ui-studio/main/schemas/a2ui.config.schema.json",
  "defaultProfile": "claude",
  "autoRepair": true,
  "systemPromptAppend": "Always use #0F62FE as primaryColor. Formal tone.",
  "profiles": [
    { "name": "copilot", "provider": "copilot", "description": "No API key needed" },
    { "name": "claude", "provider": "anthropic", "model": "claude-opus-5", "effort": "high", "actionModel": "claude-sonnet-5", "actionEffort": "medium", "maxTokens": 16000 },
    { "name": "claude-fast", "provider": "anthropic", "model": "claude-sonnet-5", "effort": "medium", "actionModel": "" },
    { "name": "glm", "provider": "zai", "model": "glm-5.3", "plan": "coding", "reasoningEffort": "high" },
    { "name": "gateway", "provider": "openai", "model": "gpt-4o", "baseUrl": "https://llm-gateway.mycompany.com/openai" },
    { "name": "local", "provider": "ollama", "model": "llama3.2" }
  ]
}
```

**Precedence:** active profile (config file) → VS Code settings. Profiles support custom `baseUrl` for enterprise API gateways/proxies. The status bar always shows what's active; API keys never live in the config file — they stay in VS Code secret storage.

## 🎛 Studio Settings view

The in-app **Settings** page (sidebar → Settings, or `A2UI: Open Studio Settings`) manages everything visually: profile cards with one-click activation, generation tuning (temperature, max tokens, auto-repair, system-prompt additions), connection status per provider (key stored or not), appearance (accent themes, surface width, density, reduced motion), and session export to a replayable `.a2ui.jsonl`.

## 📄 Commands

| Command | Description |
| --- | --- |
| `A2UI: Open Playground` | Open the studio panel |
| `A2UI: Open Studio Settings` | Jump straight to the Settings view |
| `A2UI: Open Workspace Config File` | Open (or scaffold) `a2ui.config.json` |
| `A2UI: Preview Current File` | Render the active `.a2ui.json(l)` stream file |
| `A2UI: Set AI Provider API Key` | Store an API key in secret storage |
| `A2UI: New Example Stream File` | Create a starter `.a2ui.jsonl` file |

## ⚙️ Settings

| Setting | Default | Description |
| --- | --- | --- |
| `a2ui.provider` | `copilot` | AI provider (`copilot`, `anthropic`, `zai`, `openai`, `gemini`, `ollama`) |
| `a2ui.model` | *(provider default)* | Model ID override (Anthropic default: `claude-opus-5`) |
| `a2ui.temperature` | `0.7` | Sampling temperature — ignored by Claude 5 models (profiles can override) |
| `a2ui.maxTokens` | `16000` | Max output tokens per turn, thinking included (profiles can override) |
| `a2ui.claude.effort` | `high` | Reasoning effort for design turns: `low`, `medium`, `high`, `xhigh`, `max` |
| `a2ui.claude.actionModel` | `claude-sonnet-5` | Model for action round-trips and repairs; empty = same as design model |
| `a2ui.claude.actionEffort` | `medium` | Reasoning effort for action round-trips and repairs |
| `a2ui.claude.showThinking` | `true` | Stream Claude's summarized reasoning into the chat |
| `a2ui.claude.refusalFallback` | `true` | Re-run safety-declined Opus 5 requests on Anthropic's fallback model (beta header) |
| `a2ui.zai.plan` | `coding` | Z.ai endpoint: `coding` (GLM Coding Plan) or `general` |
| `a2ui.zai.reasoningEffort` | `high` | GLM thinking depth: `low`, `high`, `max` |
| `a2ui.systemPromptAppend` | *(empty)* | Extra system-prompt instructions (config file can override) |
| `a2ui.ollamaUrl` | `http://localhost:11434` | Local Ollama endpoint |
| `a2ui.autoRepair` | `true` | Send one corrective turn when messages fail validation |

## 🛠 Development

```bash
npm install
npm run build      # bundle to dist/
# press F5 in VS Code to launch the Extension Development Host
npm run dev        # same, but without the debugger attached (see note)
npm run package    # produce the .vsix
```

> **Note on F5 debugging:** VS Code starts the debugged extension host with Node's `--experimental-network-inspection`, and the Node version bundled with current VS Code (24.x) has an inspector bug that logs `TypeError: Missing dataLength in event` and shows an "An unknown error occurred" toast every time a streaming HTTP response arrives — which is every AI generation. It is harmless and does not come from the extension. Use `npm run dev` (no debugger) or install the `.vsix` to test without the noise.

## 📚 About A2UI

A2UI is an Apache-2.0 licensed open project created by Google (with contributions from CopilotKit and the community). Agents send **declarative component descriptions** — never executable code — that clients render with their own trusted widgets. Learn more:

- [a2ui.org](https://a2ui.org)
- [github.com/google/A2UI](https://github.com/google/A2UI)
- [Protocol spec v0.9.1](https://github.com/google/A2UI/blob/main/specification/v0_9_1/docs/a2ui_protocol.md)

---

## 👤 Author

**Sitharaj Seenivasan**

- 🌐 Website: [sitharaj.in](https://sitharaj.in)
- 💼 LinkedIn: [sitharaj08](https://www.linkedin.com/in/sitharaj08)
- 💻 GitHub: [sitharaj88](https://github.com/sitharaj88)

## ☕ Support

If this project helps you, consider buying me a coffee — it keeps the work going.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-FFDD00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/sitharaj88)

## 📄 License

Licensed under the [Apache License 2.0](LICENSE). © 2026 Sitharaj Seenivasan.

---

*This extension is a community experiment and is not affiliated with Google or the A2UI project.*
