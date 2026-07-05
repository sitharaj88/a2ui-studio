# Changelog

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
