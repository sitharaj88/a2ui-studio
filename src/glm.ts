/**
 * Pure request shaping for Z.ai GLM models (OpenAI-compatible chat
 * completions). No VS Code imports so it stays unit-testable.
 *
 * Endpoints (docs.z.ai): the GLM Coding Plan key only works against the
 * coding endpoint, a general API key only against the general one.
 */
export type GlmPlan = 'coding' | 'general';
export type GlmReasoningEffort = 'low' | 'high' | 'max';

export const GLM_ENDPOINTS: Record<GlmPlan, string> = {
  coding: 'https://api.z.ai/api/coding/paas/v4',
  general: 'https://api.z.ai/api/paas/v4'
};

export const GLM_REASONING_EFFORTS: GlmReasoningEffort[] = ['low', 'high', 'max'];

export interface GlmOptions {
  plan: GlmPlan;
  reasoningEffort: GlmReasoningEffort;
}

export const DEFAULT_GLM_OPTIONS: GlmOptions = { plan: 'coding', reasoningEffort: 'high' };

export interface GlmModelInfo {
  id: string;
  label: string;
  role: string;
}

/** Curated Coding Plan models; `[1m]` unlocks the 1M-token context window. */
export const GLM_MODELS: GlmModelInfo[] = [
  { id: 'glm-5.3', label: 'GLM-5.3', role: 'Flagship — richest surfaces' },
  { id: 'glm-5.3-flash', label: 'GLM-5.3-Flash', role: 'Fast — quick iterations' },
  { id: 'glm-5.3[1m]', label: 'GLM-5.3 (1M context)', role: 'Flagship with 1M context' },
  { id: 'glm-5.3-flash[1m]', label: 'GLM-5.3-Flash (1M context)', role: 'Fast with 1M context' }
];

export function isGlmPlan(value: unknown): value is GlmPlan {
  return value === 'coding' || value === 'general';
}

export function isGlmReasoningEffort(value: unknown): value is GlmReasoningEffort {
  return typeof value === 'string' && (GLM_REASONING_EFFORTS as string[]).includes(value);
}

/** Base URL for a plan, honoring an explicit gateway override. */
export function glmBaseUrl(plan: GlmPlan, override?: string): string {
  return (override || GLM_ENDPOINTS[plan]).replace(/\/$/, '');
}

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BuildGlmRequestInput {
  model: string;
  messages: ChatTurn[];
  maxTokens?: number;
  temperature?: number;
  reasoningEffort: GlmReasoningEffort;
}

/** Chat-completions body for GLM: thinking on, effort hint, temperature clamped to GLM's [0, 1]. */
export function buildGlmRequest(input: BuildGlmRequestInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    stream: true,
    messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    thinking: { type: 'enabled' },
    reasoning_effort: input.reasoningEffort
  };
  if (typeof input.maxTokens === 'number') body.max_tokens = Math.min(Math.max(1, input.maxTokens), 131072);
  if (typeof input.temperature === 'number') body.temperature = Math.min(Math.max(0, input.temperature), 1);
  return body;
}

export interface GlmDelta {
  text?: string;
  reasoning?: string;
}

/** Extracts content and reasoning deltas from one streamed chunk. */
export function parseGlmChunk(evt: any): GlmDelta {
  const delta = evt?.choices?.[0]?.delta ?? {};
  const out: GlmDelta = {};
  if (typeof delta.content === 'string' && delta.content) out.text = delta.content;
  if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) out.reasoning = delta.reasoning_content;
  return out;
}
