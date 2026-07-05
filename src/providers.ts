import * as vscode from 'vscode';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamHandle {
  cancel(): void;
}

export type ProviderId = 'copilot' | 'anthropic' | 'openai' | 'gemini' | 'ollama' | 'a2a';

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  copilot: 'GitHub Copilot',
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  ollama: 'Ollama (local)',
  a2a: 'Remote A2A agent (experimental)'
};

export const DEFAULT_MODELS: Record<ProviderId, string> = {
  copilot: '',
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  ollama: 'llama3.2',
  a2a: ''
};

export interface ModelInfo {
  id: string;
  label: string;
}

/** Curated fallbacks when a provider's model list cannot be fetched. */
const FALLBACK_MODELS: Record<ProviderId, ModelInfo[]> = {
  copilot: [],
  anthropic: [
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' }
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { id: 'o3-mini', label: 'o3-mini' }
  ],
  gemini: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
  ],
  ollama: [{ id: 'llama3.2', label: 'llama3.2' }],
  a2a: []
};

export interface ModelListResult {
  models: ModelInfo[];
  /** Set when the list is a fallback (e.g. missing API key, offline). */
  note?: string;
}

export interface ListModelsOptions {
  /** Custom gateway base URL — models are fetched from it instead of the vendor API. */
  baseUrl?: string;
  ollamaUrl?: string;
}

/** Lists selectable models for a provider, falling back to curated defaults. */
export async function listModels(
  provider: ProviderId,
  secrets: vscode.SecretStorage,
  opts: ListModelsOptions = {}
): Promise<ModelListResult> {
  const gatewayNote = opts.baseUrl ? ` (listed from ${opts.baseUrl})` : '';
  try {
    switch (provider) {
      case 'copilot': {
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        if (models.length === 0) {
          return { models: [], note: 'No Copilot models found — install and sign in to GitHub Copilot.' };
        }
        const seen = new Set<string>();
        const out: ModelInfo[] = [];
        for (const m of models) {
          const family = m.family || m.id;
          if (seen.has(family)) continue;
          seen.add(family);
          out.push({ id: family, label: m.name || family });
        }
        return { models: out };
      }
      case 'anthropic': {
        const key = await secrets.get(secretKeyFor('anthropic'));
        if (!key && !opts.baseUrl) {
          return { models: FALLBACK_MODELS.anthropic, note: 'Set an API key (or a gateway URL) to list your available models.' };
        }
        const base = (opts.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
        const res = await fetch(`${base}/v1/models?limit=100`, {
          headers: { ...(key ? { 'x-api-key': key } : {}), 'anthropic-version': '2023-06-01' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        const models = (data.data ?? []).map((m: any) => ({ id: m.id, label: m.display_name || m.id }));
        return models.length
          ? { models, note: gatewayNote ? `Live model list${gatewayNote}.` : undefined }
          : { models: FALLBACK_MODELS.anthropic };
      }
      case 'openai': {
        const key = await secrets.get(secretKeyFor('openai'));
        if (!key && !opts.baseUrl) {
          return { models: FALLBACK_MODELS.openai, note: 'Set an API key (or a gateway URL) to list your available models.' };
        }
        const base = (opts.baseUrl || 'https://api.openai.com').replace(/\/$/, '');
        const res = await fetch(`${base}/v1/models`, {
          headers: key ? { authorization: `Bearer ${key}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        let models = (data.data ?? []).map((m: any) => String(m.id));
        // Vendor API needs noise-filtering; a gateway's list is already curated.
        if (!opts.baseUrl) {
          models = models.filter(
            (id: string) => /^(gpt-|o\d|chatgpt-)/.test(id) && !/(audio|realtime|transcribe|tts|image|search|embed)/.test(id)
          );
        }
        const out = models.sort().map((id: string) => ({ id, label: id }));
        return out.length
          ? { models: out, note: gatewayNote ? `Live model list${gatewayNote}.` : undefined }
          : { models: FALLBACK_MODELS.openai };
      }
      case 'gemini': {
        const key = await secrets.get(secretKeyFor('gemini'));
        if (!key && !opts.baseUrl) {
          return { models: FALLBACK_MODELS.gemini, note: 'Set an API key (or a gateway URL) to list your available models.' };
        }
        const base = (opts.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
        const res = await fetch(`${base}/v1beta/models?pageSize=100`, {
          headers: key ? { 'x-goog-api-key': key } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        const models = (data.models ?? [])
          .filter((m: any) => !opts.baseUrl ? (m.supportedGenerationMethods ?? []).includes('generateContent') : true)
          .map((m: any) => ({
            id: String(m.name).replace(/^models\//, ''),
            label: m.displayName || String(m.name).replace(/^models\//, '')
          }));
        return models.length
          ? { models, note: gatewayNote ? `Live model list${gatewayNote}.` : undefined }
          : { models: FALLBACK_MODELS.gemini };
      }
      case 'a2a': {
        const endpoint = vscode.workspace.getConfiguration('a2ui').get<string>('a2aEndpoint', '');
        return {
          models: [],
          note: endpoint
            ? 'The remote agent chooses its own model.'
            : 'Set a2ui.a2aEndpoint in settings to connect to a remote A2UI agent over A2A.'
        };
      }
      case 'ollama': {
        const base =
          opts.baseUrl ||
          opts.ollamaUrl ||
          vscode.workspace.getConfiguration('a2ui').get<string>('ollamaUrl', 'http://localhost:11434');
        const res = await fetch(`${base.replace(/\/$/, '')}/api/tags`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        const models = (data.models ?? []).map((m: any) => ({ id: m.name, label: m.name }));
        return models.length ? { models } : { models: FALLBACK_MODELS.ollama, note: 'No local models — run `ollama pull llama3.2`.' };
      }
    }
  } catch (e) {
    return {
      models: FALLBACK_MODELS[provider],
      note: `Could not fetch the live model list (${e instanceof Error ? e.message : e}); showing common defaults.`
    };
  }
}

export interface GenerateOptions {
  provider: ProviderId;
  model: string;
  messages: ChatMessage[];
  secrets: vscode.SecretStorage;
  token: vscode.CancellationToken;
  onText(chunk: string): void;
  /** Sampling temperature (ignored by providers that don't support it). */
  temperature?: number;
  /** Max output tokens per turn. */
  maxTokens?: number;
  /** Custom API base URL (enterprise gateways/proxies). */
  baseUrl?: string;
  /** Ollama server URL override. */
  ollamaUrl?: string;
  /** Called with the human-readable label of the model actually used. */
  onModel?(label: string): void;
}

/** Streams a completion from the selected provider, invoking onText per chunk. */
export async function generate(opts: GenerateOptions): Promise<void> {
  if (opts.provider !== 'copilot') {
    // Copilot reports after resolution; every other provider is deterministic.
    opts.onModel?.(
      opts.provider === 'a2a' ? 'remote agent' : opts.model || DEFAULT_MODELS[opts.provider] || 'auto'
    );
  }
  switch (opts.provider) {
    case 'copilot':
      return generateCopilot(opts);
    case 'anthropic':
      return generateAnthropic(opts);
    case 'openai':
      return generateOpenAI(opts);
    case 'gemini':
      return generateGemini(opts);
    case 'ollama':
      return generateOllama(opts);
    case 'a2a':
      return generateA2A(opts);
  }
}

export function secretKeyFor(provider: ProviderId): string {
  return `a2ui.apiKey.${provider}`;
}

/**
 * Returns the stored API key. Without a custom baseUrl the key is mandatory;
 * with a gateway (which often does its own auth) a missing key is allowed and
 * auth headers are simply omitted.
 */
async function requireApiKey(
  provider: ProviderId,
  secrets: vscode.SecretStorage,
  baseUrl?: string
): Promise<string> {
  const key = await secrets.get(secretKeyFor(provider));
  if (!key && !baseUrl) {
    throw new Error(
      `No API key set for ${PROVIDER_LABELS[provider]}. Run the "A2UI: Set AI Provider API Key" command first.`
    );
  }
  return key ?? '';
}

// ---------------------------------------------------------------------------
// GitHub Copilot via the VS Code Language Model API
// ---------------------------------------------------------------------------

async function generateCopilot(opts: GenerateOptions): Promise<void> {
  const all = await vscode.lm.selectChatModels({ vendor: 'copilot' });
  if (all.length === 0) {
    throw new Error(
      'No GitHub Copilot language models available. Install/sign in to GitHub Copilot, or pick another provider in the playground header.'
    );
  }
  let preferred: vscode.LanguageModelChat;
  if (opts.model) {
    // Explicit selection is a contract: exact match or a hard error — never
    // silently substitute a different (potentially premium) model.
    const wanted = opts.model.toLowerCase();
    const match =
      all.find((m) => m.family.toLowerCase() === wanted) ??
      all.find((m) => m.id.toLowerCase() === wanted) ??
      all.find((m) => (m.name || '').toLowerCase() === wanted);
    if (!match) {
      const families = [...new Set(all.map((m) => m.family))].join(', ');
      throw new Error(
        `Copilot model "${opts.model}" is not available in this VS Code. Available families: ${families}. Pick one from the model dropdown (it lists live Copilot models).`
      );
    }
    preferred = match;
  } else {
    // Auto mode only: prefer a capable default.
    preferred = all.find((m) => /claude|gpt-4|gpt-5|o[13]/i.test(m.id)) ?? all[all.length - 1];
  }
  opts.onModel?.(preferred.name || preferred.family || preferred.id);

  const lmMessages = opts.messages.map((m) =>
    m.role === 'assistant'
      ? vscode.LanguageModelChatMessage.Assistant(m.content)
      : vscode.LanguageModelChatMessage.User(
          m.role === 'system' ? `<system instructions>\n${m.content}\n</system instructions>` : m.content
        )
  );

  const requestOptions: vscode.LanguageModelChatRequestOptions =
    typeof opts.temperature === 'number' ? { modelOptions: { temperature: opts.temperature } } : {};
  const response = await preferred.sendRequest(lmMessages, requestOptions, opts.token);
  for await (const chunk of response.text) {
    if (opts.token.isCancellationRequested) return;
    opts.onText(chunk);
  }
}

// ---------------------------------------------------------------------------
// Shared SSE/stream plumbing for HTTP providers
// ---------------------------------------------------------------------------

async function streamHttp(
  url: string,
  init: RequestInit,
  token: vscode.CancellationToken,
  onLine: (line: string) => void
): Promise<void> {
  const controller = new AbortController();
  const sub = token.onCancellationRequested(() => controller.abort());
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from provider: ${body.slice(0, 400)}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        if (line.trim()) onLine(line);
      }
    }
    if (buffer.trim()) onLine(buffer);
  } finally {
    sub.dispose();
  }
}

function sseData(line: string): string | undefined {
  if (line.startsWith('data:')) {
    const data = line.slice(5).trim();
    if (data && data !== '[DONE]') return data;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

async function generateAnthropic(opts: GenerateOptions): Promise<void> {
  const key = await requireApiKey('anthropic', opts.secrets, opts.baseUrl);
  const system = opts.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const messages = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  await streamHttp(
    `${(opts.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '')}/v1/messages`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(key ? { 'x-api-key': key } : {}),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODELS.anthropic,
        max_tokens: opts.maxTokens ?? 8192,
        temperature: opts.temperature,
        stream: true,
        system,
        messages
      })
    },
    opts.token,
    (line) => {
      const data = sseData(line);
      if (!data) return;
      try {
        const evt = JSON.parse(data);
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          opts.onText(evt.delta.text);
        }
        if (evt.type === 'error') {
          throw new Error(evt.error?.message ?? 'Anthropic stream error');
        }
      } catch (e) {
        if (e instanceof SyntaxError) return; // partial frame; ignore
        throw e;
      }
    }
  );
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

async function generateOpenAI(opts: GenerateOptions): Promise<void> {
  const key = await requireApiKey('openai', opts.secrets, opts.baseUrl);
  await streamHttp(
    `${(opts.baseUrl || 'https://api.openai.com').replace(/\/$/, '')}/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(key ? { authorization: `Bearer ${key}` } : {})
      },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODELS.openai,
        stream: true,
        temperature: opts.temperature,
        max_completion_tokens: opts.maxTokens,
        messages: opts.messages
      })
    },
    opts.token,
    (line) => {
      const data = sseData(line);
      if (!data) return;
      try {
        const evt = JSON.parse(data);
        const delta = evt.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') opts.onText(delta);
      } catch {
        /* partial frame */
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Google Gemini
// ---------------------------------------------------------------------------

async function generateGemini(opts: GenerateOptions): Promise<void> {
  const key = await requireApiKey('gemini', opts.secrets, opts.baseUrl);
  const model = opts.model || DEFAULT_MODELS.gemini;
  const system = opts.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const contents = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  await streamHttp(
    `${(opts.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(key ? { 'x-goog-api-key': key } : {})
      },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxTokens
        },
        contents
      })
    },
    opts.token,
    (line) => {
      const data = sseData(line);
      if (!data) return;
      try {
        const evt = JSON.parse(data);
        const text = evt.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('');
        if (text) opts.onText(text);
      } catch {
        /* partial frame */
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Ollama (local)
// ---------------------------------------------------------------------------

async function generateOllama(opts: GenerateOptions): Promise<void> {
  const base =
    opts.baseUrl ||
    opts.ollamaUrl ||
    vscode.workspace.getConfiguration('a2ui').get<string>('ollamaUrl', 'http://localhost:11434');
  await streamHttp(
    `${base.replace(/\/$/, '')}/api/chat`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODELS.ollama,
        stream: true,
        options: {
          temperature: opts.temperature,
          num_predict: opts.maxTokens
        },
        messages: opts.messages
      })
    },
    opts.token,
    (line) => {
      try {
        const evt = JSON.parse(line);
        const text = evt.message?.content;
        if (typeof text === 'string') opts.onText(text);
        if (evt.error) throw new Error(String(evt.error));
      } catch (e) {
        if (e instanceof SyntaxError) return;
        throw e;
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Remote A2A agent (experimental)
//
// Speaks A2A JSON-RPC `message/stream` over SSE against a2ui.a2aEndpoint and
// scans returned message/artifact parts for A2UI payloads: DataParts are
// forwarded as JSON, TextParts go through the normal stream extractor.
// ---------------------------------------------------------------------------

async function generateA2A(opts: GenerateOptions): Promise<void> {
  const endpoint =
    opts.baseUrl || vscode.workspace.getConfiguration('a2ui').get<string>('a2aEndpoint', '');
  if (!endpoint) {
    throw new Error(
      'No A2A endpoint configured. Set "a2ui.a2aEndpoint" (or a profile baseUrl) to the URL of an A2UI-capable A2A agent.'
    );
  }
  const lastUser = [...opts.messages].reverse().find((m) => m.role === 'user');
  const messageId = `a2ui-studio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const emitParts = (parts: any[]) => {
    for (const part of parts) {
      if (!part || typeof part !== 'object') continue;
      if (typeof part.text === 'string') {
        opts.onText(part.text + '\n');
      } else if (part.data && typeof part.data === 'object') {
        opts.onText(JSON.stringify(part.data) + '\n');
      }
    }
  };

  const scan = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.parts)) emitParts(node.parts);
    for (const key of ['artifact', 'message', 'status', 'result']) {
      if (node[key]) scan(node[key]);
    }
  };

  await streamHttp(
    endpoint,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream, application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: messageId,
        method: 'message/stream',
        params: {
          message: {
            role: 'user',
            messageId,
            parts: [{ kind: 'text', text: lastUser?.content ?? '' }],
            metadata: {
              a2uiClientCapabilities: {
                supportedCatalogIds: ['https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json']
              }
            }
          }
        }
      })
    },
    opts.token,
    (line) => {
      const data = sseData(line) ?? (line.trim().startsWith('{') ? line.trim() : undefined);
      if (!data) return;
      try {
        const evt = JSON.parse(data);
        if (evt.error) throw new Error(evt.error.message || 'A2A agent returned an error');
        scan(evt);
      } catch (e) {
        if (e instanceof SyntaxError) return; // partial frame
        throw e;
      }
    }
  );
}
