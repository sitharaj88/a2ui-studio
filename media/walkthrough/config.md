# Team configuration

Commit **`a2ui.config.json`** to your repo to share setup with your whole team:

```json
{
  "defaultProfile": "claude",
  "systemPromptAppend": "Always use #0F62FE as primaryColor.",
  "catalog": { "path": "./design-system.catalog.json" },
  "profiles": [
    { "name": "copilot", "provider": "copilot" },
    { "name": "claude", "provider": "anthropic", "model": "claude-sonnet-5" },
    { "name": "gateway", "provider": "openai", "baseUrl": "https://llm-gateway.corp/openai" }
  ]
}
```

- **Profiles** appear as a picker in the studio header — one click to switch
- **`baseUrl`** routes through enterprise API gateways
- **`catalog`** teaches the agent your design system's components
- The file is schema-validated with autocomplete as you edit
