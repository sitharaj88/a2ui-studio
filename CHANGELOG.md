# Changelog

## 0.4.0 — 2026-07-06

### Added
- **Studio Extended Catalog** (`https://a2ui-studio.dev/catalogs/studio/v1`) — 12 modern components beyond the
  basic catalog, so agents can generate real apps: **Pages** (multi-page navigation, agent can navigate you via
  `updateDataModel`), **Stepper** wizards, **Hero** headers, **StatCard** KPI tiles with delta chips,
  **Chart** (bar/line/donut, pure SVG), **Table** (data-model rows, sticky header), **Timeline**, **Accordion**,
  interactive **Rating**, **ProgressBar**, **Avatar** (initials fallback), **Badge**.
- **Design direction** in the system prompt — agents are taught to compose like designers: hero-first layouts,
  stat rows, generous spacing, icons, realistic seeded data, always-themed surfaces.
- **Analytics app instant demo** — a three-page product-analytics app (Hero + KPIs + charts, data tables, more)
  rendering locally with zero AI setup.
- PROMPTS.md: new "Multi-page apps" section with copy-paste prompts.

## 0.3.0 — 2026-07-05

### Changed
- **Material 3 / Fluent redesign of the surface renderer** — a full design-system pass over every rendered A2UI component:
  tonal surface + 3-level elevation tokens, MD3 type scale, state layers (hover/press/focus-visible) throughout;
  buttons with pointer ripple and filled/tonal/text variants; notched-outline text fields with floating labels and
  animated error text; MD3 checkbox with check-draw animation and state-layer halo; segmented-button ChoicePicker
  (single-select) and filter chips with leading check (multi-select); slider with hover halo and drag value bubble;
  tabs with sliding indicator; modal with scrim fade and 28px-radius entrance motion; elevated cards, refined lists
  (snap scrolling), tonal audio player and media fallbacks. Fully theme-aware in light and dark, respects
  density-compact and reduced-motion, and preserves all behavior contracts (bindings, inspector, focus/playback restore).

## 0.2.0 — 2026-07-05

### Added
- **Live preview editor** — open any `.a2ui.json(l)` file with the "A2UI Live Preview" editor (right-click → Open With) and watch edits re-render in real time.
- **Component inspector** — toggle Inspect on the canvas, click any rendered component to see its definition and live data bindings; hovering a stream message flashes the components it defines.
- **Model arena** — run one prompt against two providers side by side with message/validity/latency stats.
- **Session replay** — scrub through the session's message stream like a debugger (play/pause/step/slider).
- **Editable data models** — edit any surface's data model JSON directly in the Data tab and watch bindings react.
- **Prompt library** — save prompts from the composer; they appear in the gallery and as chips, persisted across sessions.
- **Surface HTML export** — export any rendered surface as a standalone HTML snapshot.
- **Custom catalogs** — point `a2ui.config.json` at your design system's catalog JSON; the agent is instructed to use it and unknown components render as labeled placeholders.
- **Remote A2A agent provider (experimental)** — connect to an A2UI-capable A2A endpoint via `a2ui.a2aEndpoint`.
- **`@a2ui` Copilot Chat participant** — generate a stream in Copilot Chat and open it in the studio.
- **Getting-started walkthrough**, CI workflow, and this changelog.

## 0.1.0 — 2026-07-05

- Initial release: A2UI v0.9.1 renderer, playground with dashboard/chat/gallery/settings, five AI providers with live model listing, workspace profiles via `a2ui.config.json`, stream/data/action inspectors, instant demos, auto-repair loop, session export, status bar item.
