# A2UI Studio

**Experiment with [A2UI](https://a2ui.org) — Google's open protocol for agent-driven interfaces — right inside VS Code.**

Describe any UI in plain language and watch an AI agent stream live **A2UI v0.9.1** protocol messages that render as beautiful, fully interactive surfaces: forms, wizards, dashboards, product cards — with real data binding, validation, and action round-trips back to the agent.

## ✨ Features

- **Live A2UI renderer** — a complete client implementation of the A2UI v0.9.1 basic catalog (`Card`, `Row`/`Column`/`List` with templated children, `Tabs`, `Modal`, `TextField`, `ChoicePicker`, `Slider`, `DateTimeInput`, `CheckBox`, `Button`, media…), styled with a **Material 3 / Fluent design system** — floating-label fields, button ripple, segmented pickers, sliding tabs, elevation and state layers, in both light and dark themes.
- **Studio Extended Catalog** — 12 modern components on top of the basic set so agents can build real apps: **Pages** (multi-page navigation the agent can drive), **Stepper** wizards, **Hero** headers, **StatCard** KPIs, **Chart** (bar/line/donut, pure SVG), **Table**, **Timeline**, **Accordion**, **Rating**, **ProgressBar**, **Avatar**, **Badge**.
- **Any AI provider**:
  - **GitHub Copilot** via the VS Code Language Model API — zero configuration if you have Copilot
  - **Anthropic Claude**, **OpenAI**, **Google Gemini** — bring your own API key (stored in VS Code secret storage)
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
- **`@a2ui` in Copilot Chat** — type `@a2ui a booking form` in Copilot Chat and open the result in the studio with one click.
- **Remote A2A agents (experimental)** — connect to a real A2UI-capable A2A endpoint instead of simulating one.
- **Auto-repair loop** — invalid messages are reported back to the model for one corrective turn (the spec's prompt-generate-validate loop).

## 📖 Prompt cookbook

**[PROMPTS.md](PROMPTS.md)** has copy-paste prompts for video players and playlists, validated forms, dashboards with templated lists, quizzes, a text adventure, enterprise approval flows, arena-worthy challenges, and round-trip follow-ups — each designed to exercise a specific part of the A2UI protocol. It also lists verified sample video URLs *with audio* (many popular "sample video" sites ship silent files).

## 🚀 Getting started

1. Run **`A2UI: Open Playground`** from the command palette (or the A2UI icon in the activity bar).
2. Click an **Instant demo** card — no setup needed — or pick a provider in the header:
   - **GitHub Copilot**: works out of the box if the Copilot extension is signed in.
   - **Claude / OpenAI / Gemini**: run **`A2UI: Set AI Provider API Key`** first.
   - **Ollama**: have `ollama serve` running locally.
3. Describe a UI — *“a coffee order form with size, milk options and a pay button”* — and press Enter.
4. Interact with the generated surface. Button actions go back to the agent, which updates the UI in response.

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
    { "name": "claude", "provider": "anthropic", "model": "claude-sonnet-5", "temperature": 0.7, "maxTokens": 8192 },
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
| `a2ui.provider` | `copilot` | AI provider (`copilot`, `anthropic`, `openai`, `gemini`, `ollama`) |
| `a2ui.model` | *(provider default)* | Model ID override |
| `a2ui.temperature` | `0.7` | Sampling temperature (profiles can override) |
| `a2ui.maxTokens` | `8192` | Max output tokens per turn (profiles can override) |
| `a2ui.systemPromptAppend` | *(empty)* | Extra system-prompt instructions (config file can override) |
| `a2ui.ollamaUrl` | `http://localhost:11434` | Local Ollama endpoint |
| `a2ui.autoRepair` | `true` | Send one corrective turn when messages fail validation |

## 🛠 Development

```bash
npm install
npm run build      # bundle to dist/
# press F5 in VS Code to launch the Extension Development Host
npm run package    # produce the .vsix
```

## 📚 About A2UI

A2UI is an Apache-2.0 licensed open project created by Google (with contributions from CopilotKit and the community). Agents send **declarative component descriptions** — never executable code — that clients render with their own trusted widgets. Learn more:

- [a2ui.org](https://a2ui.org)
- [github.com/google/A2UI](https://github.com/google/A2UI)
- [Protocol spec v0.9.1](https://github.com/google/A2UI/blob/main/specification/v0_9_1/docs/a2ui_protocol.md)

---

*This extension is a community experiment and is not affiliated with Google or the A2UI project.*
