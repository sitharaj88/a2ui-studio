# Bring any AI provider

| Provider | Setup |
| --- | --- |
| **GitHub Copilot** | None — uses the VS Code Language Model API |
| **Anthropic Claude** | API key — Opus 5 designs, Sonnet 5 handles actions, reasoning streams live |
| **Z.ai GLM** | GLM Coding Plan key — GLM-5.3 / GLM-5.3-Flash |
| **OpenAI** | API key |
| **Google Gemini** | API key |
| **Ollama** | `ollama serve` running locally |
| **Remote A2A agent** | Set `a2ui.a2aEndpoint` (experimental) |

Keys are stored in VS Code **secret storage** — never in settings files. Once a key is set, the model dropdown lists your account's actual available models.

You can also type `@a2ui a booking form` in **Copilot Chat** and open the result in the studio with one click.
