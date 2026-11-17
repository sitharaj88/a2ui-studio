---
name: a2ui-studio
description: Generate valid A2UI v0.9.1 JSONL and open it in the A2UI Studio interface.
---

# A2UI Studio

Use this skill when the user asks to design an interface with A2UI Studio.

## Workflow

1. Generate only newline-delimited JSON objects using A2UI v0.9.1.
2. Follow the A2UI basic catalog unless the workspace provides a custom catalog.
3. Create a surface before updating its components or data model.
4. Give every surface a `surfaceId`, a `root` component, and valid component references.
5. Seed every bound data path with realistic data.
6. Validate the complete JSONL stream before presenting it.
7. Invoke the `a2uiPreviewSurface` tool with the validated stream to open Dashboard/Playground/Arena/Gallery/Settings in A2UI Studio.

Do not return prose or Markdown inside the JSONL payload. If the request is ambiguous,
ask a concise clarification before generating the stream.
