# Changelog

## 1.1.0 — 2026-09-02

### Claude 5 agent
- **Official Anthropic SDK** replaces the hand-rolled SSE client for Claude: retries, typed errors (bad key, rate limit, unknown model, unreachable gateway) and abort-on-stop.
- **Designer / builder routing** — Claude Opus 5 handles design turns (new prompts) and Claude Sonnet 5 handles action round-trips and auto-repair turns, each with its own effort level. Configurable via `a2ui.claude.*` settings or per profile (`effort`, `actionModel`, `actionEffort`, `showThinking`).
- **Adaptive thinking with a live reasoning stream** — the model's summarized thinking streams into the chat while it works and stays available as a collapsible *Reasoning* block on the agent's reply.
- **`output_config.effort`** on every Claude 5 request; sampling parameters are no longer sent to Claude 5-generation models (they returned HTTP 400 with the previous default temperature).
- **Prompt caching** breakpoints on the system prompt and latest user turn.
- **Refusal handling** — `stop_reason: "refusal"` is surfaced with its category; optional server-side fallback (`fallbacks: "default"`) re-runs declined Opus 5 requests on Anthropic's recommended model and the chat reports which model answered.
- **Usage & cost** — a dashboard card and stat tile track input/output/cache tokens, cache hit rate and estimated USD cost per session; each agent reply notes the model that produced it.
- Model list ranks Opus 5 and Sonnet 5 first; the Anthropic default model is now `claude-opus-5`; `ANTHROPIC_API_KEY` in the extension host environment is honored when no key is stored.
- Model arena: one-click **Opus 5 vs Sonnet 5** preset.

### Z.ai GLM provider
- New **Z.ai GLM (Coding Plan)** provider: GLM-5.3, GLM-5.3-Flash and their `[1m]` long-context variants over Z.ai's OpenAI-compatible endpoint. `a2ui.zai.plan` selects the Coding Plan or general endpoint (keys are not interchangeable), `a2ui.zai.reasoningEffort` sets thinking depth, and `a2ui.baseUrls.zai` overrides the endpoint (China region / proxies).
- GLM `reasoning_content` streams into the chat's *Reasoning* block; token usage lands on the dashboard; 401/429 responses get plan-aware messages.
- Profiles accept `plan` and `reasoningEffort`; the starter config ships a `glm` profile.

### Protocol quality
- **Surface linter** — cross-message checks feed the repair loop: dangling child references (including `Tabs`, `Pages`, `Stepper`, `Accordion`, `Modal` and template children), surfaces with no `root`, `updateComponents` for a surface that was never created.
- Per-message validation now flags duplicate ids, `Card` with `children`, and `Button` without a `child`.
- Repair notices appear in the chat as event pills.

### Other
- Copilot model selection tolerates VS Code renaming a model family between listing and use (e.g. `oswe-vscode` → `oswe-vscode-modelD`): exact match first, then a unique variant of the same family; ambiguous or unknown ids still error instead of substituting a model.
- Default `a2ui.maxTokens` raised to 16000 so adaptive thinking has headroom.
- Starter `a2ui.config.json` ships `claude` (Opus 5 + Sonnet 5) and `claude-fast` (Sonnet 5 only) profiles.

## 1.0.0 — 2026-07-06

Initial public release. A complete studio for experimenting with [A2UI](https://a2ui.org), Google's open protocol for agent-driven interfaces.

### Renderer
- Full A2UI v0.9.1 client renderer for the basic catalog (Card, Row/Column/List with templated children, Tabs, Modal, TextField, ChoicePicker, Slider, DateTimeInput, CheckBox, Button, media, Divider, Icon), with JSON Pointer data binding, two-way inputs, validation checks, actions, and `formatString`.
- **Material 3 / Fluent design system** — floating-label text fields, button ripple, segmented pickers, sliding tab indicator, elevation and state layers, in both light and dark themes.
- **Studio Extended Catalog** (`a2ui-studio.dev/catalogs/studio/v1`) — 12 modern components for real apps: Pages (multi-page, agent-drivable navigation), Stepper, Hero, StatCard, Chart (bar/line/donut, pure SVG), Table, Timeline, Accordion, Rating, ProgressBar, Avatar, Badge.
- Responsive across narrow/split panels.

### Providers
- GitHub Copilot (VS Code Language Model API), Anthropic Claude, OpenAI, Google Gemini, Ollama, and an experimental remote A2A agent.
- Live model listing per provider, strict model selection (no silent premium fallback), and enterprise gateway base URLs with gateway-fetched model lists.

### Studio
- Playground with agent chat, Dashboard, Gallery, Settings, and a two-provider Model Arena.
- Component Inspector, session Replay, editable data models, prompt library, and export to standalone HTML or replayable `.a2ui.jsonl`.
- Live-preview custom editor for `.a2ui.json(l)` files and an `@a2ui` Copilot Chat participant.
- Instant demos (including a three-page Analytics app) that render with zero AI setup.

### Team configuration
- `a2ui.config.json` — schema-validated provider profiles, custom catalogs, gateway URLs, and prompt rules; hot-reloaded, with a status bar indicator.
