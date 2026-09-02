import * as vscode from 'vscode';
import { ClaudeUsage, listClaudeModels, streamClaude } from './claude';
import { ClaudeEffort, CLAUDE_MODELS, DEFAULT_CLAUDE_OPTIONS } from './claudeRequest';
import { buildGlmRequest, DEFAULT_GLM_OPTIONS, glmBaseUrl, GLM_MODELS, GlmPlan, GlmReasoningEffort, parseGlmChunk } from './glm';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamHandle {
  cancel(): void;
}

export type ProviderId = 'copilot' | 'anthropic' | 'zai' | 'openai' | 'gemini' | 'ollama' | 'a2a';

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  copilot: 'GitHub Copilot',
  anthropic: 'Anthropic Claude',
  zai: 'Z.ai GLM (Coding Plan)',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  ollama: 'Ollama (local)',
  a2a: 'Remote A2A agent (experimental)'
};

export const DEFAULT_MODELS: Record<ProviderId, string> = {
  copilot: '',
  anthropic: 'claude-opus-5',
  zai: 'glm-5.3',
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
  anthropic: CLAUDE_MODELS.map((m) => ({ id: m.id, label: m.label })),
  zai: GLM_MODELS.map((m) => ({ id: m.id, label: m.label })),
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
  /** Z.ai: which plan endpoint to use. */
  zaiPlan?: GlmPlan;
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
        const key = await resolveApiKey('anthropic', secrets);
        if (!key && !opts.baseUrl) {
          return { models: FALLBACK_MODELS.anthropic, note: 'Set an API key (or a gateway URL) to list your available models.' };
        }
        const models = await listClaudeModels(key, opts.baseUrl);
        return models.length
          ? { models, note: gatewayNote ? `Live model list${gatewayNote}.` : undefined }
          : { models: FALLBACK_MODELS.anthropic };
      }
      case 'zai': {
        const key = await secrets.get(secretKeyFor('zai'));
        if (!key) {
          return { models: FALLBACK_MODELS.zai, note: 'Set your Z.ai API key to use GLM. Showing the Coding Plan models.' };
        }
        const base = glmBaseUrl(opts.zaiPlan ?? DEFAULT_GLM_OPTIONS.plan, opts.baseUrl);
        const res = await fetch(`${base}/models`, { headers: { authorization: `Bearer ${key}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        const live = (data.data ?? []).map((m: any) => String(m.id)).filter((id: string) => /glm/i.test(id));
        if (!live.length) return { models: FALLBACK_MODELS.zai };
        const curated = FALLBACK_MODELS.zai.filter((m) => live.includes(m.id.replace(/\[1m\]$/, '')));
        const extra = live.filter((id: string) => !curated.some((m) => m.id === id)).sort().map((id: string) => ({ id, label: id }));
        return { models: [...curated, ...extra] };
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
  /** Sampling temperature (ignored by providers/models that don't support it). */
  temperature?: number;
  /** Max output tokens per turn. */
  maxTokens?: number;
  /** Custom API base URL (enterprise gateways/proxies). */
  baseUrl?: string;
  /** Ollama server URL override. */
  ollamaUrl?: string;
  /** Called with the human-readable label of the model actually used. */
  onModel?(label: string): void;
  /** Claude only: reasoning effort for this turn. */
  effort?: ClaudeEffort;
  /** Claude only: stream summarized reasoning. */
  showThinking?: boolean;
  /** Claude only: allow server-side refusal fallback. */
  refusalFallback?: boolean;
  /** Z.ai only: coding-plan or general endpoint. */
  zaiPlan?: GlmPlan;
  /** Z.ai only: GLM reasoning effort. */
  reasoningEffort?: GlmReasoningEffort;
  /** Streamed reasoning summary (Claude). */
  onThinking?(chunk: string): void;
  /** Token usage for the completed turn (Claude). */
  onUsage?(usage: ClaudeUsage): void;
  /** Non-fatal notices worth surfacing to the user. */
  onNote?(text: string): void;
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
    case 'zai':
      return generateZai(opts);
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
 * Stored key, else (for Claude) the ANTHROPIC_API_KEY the extension host was
 * launched with — the same credential the official SDK would pick up.
 */
async function resolveApiKey(provider: ProviderId, secrets: vscode.SecretStorage): Promise<string> {
  const stored = await secrets.get(secretKeyFor(provider));
  if (stored) return stored;
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY ?? '';
  return '';
}

/**
 * Returns the API key. Without a custom baseUrl the key is mandatory;
 * with a gateway (which often does its own auth) a missing key is allowed and
 * auth headers are simply omitted.
 */
async function requireApiKey(
  provider: ProviderId,
  secrets: vscode.SecretStorage,
  baseUrl?: string
): Promise<string> {
  const key = await resolveApiKey(provider, secrets);
  if (!key && !baseUrl) {
    throw new Error(
      `No API key set for ${PROVIDER_LABELS[provider]}. Run the "A2UI: Set AI Provider API Key" command first.`
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// GitHub Copilot via the VS Code Language Model API
// ---------------------------------------------------------------------------

/** Lower-case, with separators removed so "gpt-4.1" and "gpt_4_1" compare equal. */
function normalizeModelKey(value: string): string {
  return value.toLowerCase().replace(/[\s._-]+/g, '');
}

/**
 * Resolves a user-selected Copilot model. Exact (family/id/name) wins; then a
 * unique family or id that extends the requested one, or that the requested
 * one extends. Ambiguous matches return undefined so nothing is substituted.
 */
export function matchCopilotModel<T extends { id: string; family: string; name?: string }>(
  models: readonly T[],
  wanted: string
): T | undefined {
  const key = normalizeModelKey(wanted);
  if (!key) return undefined;
  const keysOf = (m: T) => [m.family, m.id, m.name ?? ''].filter(Boolean).map(normalizeModelKey);
  const exact = models.find((m) => keysOf(m).includes(key));
  if (exact) return exact;
  const related = models.filter((m) => keysOf(m).some((k) => k.startsWith(key) || key.startsWith(k)));
  const families = new Set(related.map((m) => m.family || m.id));
  return families.size === 1 ? related[0] : undefined;
}

async function generateCopilot(opts: GenerateOptions): Promise<void> {
  const all = await vscode.lm.selectChatModels({ vendor: 'copilot' });
  if (all.length === 0) {
    throw new Error(
      'No GitHub Copilot language models available. Install/sign in to GitHub Copilot, or pick another provider in the playground header.'
    );
  }
  let preferred: vscode.LanguageModelChat;
  if (opts.model) {
    // Explicit selection is a contract: never silently substitute a different
    // (potentially premium) model. Exact match first; otherwise accept a
    // unique variant of the same family (VS Code can rename a family between
    // listing and use, e.g. "oswe-vscode" → "oswe-vscode-modelD").
    const match = matchCopilotModel(all, opts.model);
    if (!match) {
      const families = [...new Set(all.map((m) => m.family || m.id))].join(', ');
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
// Anthropic Claude — official SDK (see claude.ts)
// ---------------------------------------------------------------------------

async function generateAnthropic(opts: GenerateOptions): Promise<void> {
  const key = await requireApiKey('anthropic', opts.secrets, opts.baseUrl);
  await streamClaude({
    apiKey: key,
    baseUrl: opts.baseUrl,
    model: opts.model || DEFAULT_MODELS.anthropic,
    messages: opts.messages,
    maxTokens: opts.maxTokens ?? 16000,
    effort: opts.effort ?? DEFAULT_CLAUDE_OPTIONS.effort,
    showThinking: opts.showThinking ?? DEFAULT_CLAUDE_OPTIONS.showThinking,
    refusalFallback: opts.refusalFallback ?? DEFAULT_CLAUDE_OPTIONS.refusalFallback,
    temperature: opts.temperature,
    token: opts.token,
    onText: opts.onText,
    onThinking: opts.onThinking,
    onUsage: opts.onUsage,
    onNote: opts.onNote
  });
}

// ---------------------------------------------------------------------------
// Z.ai GLM — OpenAI-compatible chat completions with reasoning_content
// ---------------------------------------------------------------------------

async function generateZai(opts: GenerateOptions): Promise<void> {
  const key = await requireApiKey('zai', opts.secrets);
  const plan = opts.zaiPlan ?? DEFAULT_GLM_OPTIONS.plan;
  const base = glmBaseUrl(plan, opts.baseUrl);
  let sawText = false;
  await streamHttp(
    `${base}/chat/completions`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(
        buildGlmRequest({
          model: opts.model || DEFAULT_MODELS.zai,
          messages: opts.messages,
          maxTokens: opts.maxTokens,
          temperature: opts.temperature,
          reasoningEffort: opts.reasoningEffort ?? DEFAULT_GLM_OPTIONS.reasoningEffort
        })
      )
    },
    opts.token,
    (line) => {
      const data = sseData(line);
      if (!data) return;
      try {
        const evt = JSON.parse(data);
        if (evt.error) throw new Error(evt.error.message || 'GLM returned an error');
        const { text, reasoning } = parseGlmChunk(evt);
        if (reasoning) opts.onThinking?.(reasoning);
        if (text) {
          sawText = true;
          opts.onText(text);
        }
        const usage = evt.usage;
        if (usage && typeof usage.prompt_tokens === 'number') {
          opts.onUsage?.({
            model: evt.model || opts.model || DEFAULT_MODELS.zai,
            input: usage.prompt_tokens,
            output: usage.completion_tokens ?? 0,
            cacheRead: usage.prompt_tokens_details?.cached_tokens ?? 0,
            cacheWrite: 0
          });
        }
      } catch (e) {
        if (e instanceof SyntaxError) return; // partial frame
        throw e;
      }
    }
  ).catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (/HTTP 401/.test(msg)) {
      throw new Error(
        `Z.ai rejected the API key for the ${plan} endpoint. Coding Plan keys only work with the coding endpoint (and vice versa) — check the plan in Settings → GLM.`
      );
    }
    if (/HTTP 429/.test(msg)) throw new Error('Z.ai rate limit or plan quota reached — wait a moment and try again.');
    throw e;
  });
  if (!sawText && !opts.token.isCancellationRequested) {
    opts.onNote?.('GLM streamed reasoning but no A2UI output — try lowering reasoning effort or raising max tokens.');
  }
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
