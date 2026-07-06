# Changelog

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
