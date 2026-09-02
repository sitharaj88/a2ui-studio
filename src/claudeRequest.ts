/**
 * Pure request shaping for Claude models. No SDK or VS Code runtime imports so
 * the model-family rules live in one testable place.
 */
import type Anthropic from '@anthropic-ai/sdk';

export type ClaudeEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export const CLAUDE_EFFORTS: ClaudeEffort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

/** Studio-level Claude agent options (settings / profile). */
export interface ClaudeOptions {
  /** Effort for design turns (new surfaces). */
  effort: ClaudeEffort;
  /** Model for action round-trips and repair turns; '' = same as the design model. */
  actionModel: string;
  /** Effort for action round-trips and repair turns. */
  actionEffort: ClaudeEffort;
  /** Stream the model's summarized reasoning into the chat. */
  showThinking: boolean;
  /** Let the API re-run a safety-declined request on Anthropic's recommended fallback model. */
  refusalFallback: boolean;
}

export const DEFAULT_CLAUDE_OPTIONS: ClaudeOptions = {
  effort: 'high',
  actionModel: 'claude-sonnet-5',
  actionEffort: 'medium',
  showThinking: true,
  refusalFallback: true
};

export interface ClaudeModelInfo {
  id: string;
  label: string;
  /** USD per million input tokens. */
  input: number;
  /** USD per million output tokens. */
  output: number;
  role: string;
}

/** Curated first-class models, in the order the studio presents them. */
export const CLAUDE_MODELS: ClaudeModelInfo[] = [
  { id: 'claude-opus-5', label: 'Claude Opus 5', input: 5, output: 25, role: 'Designer — richest, most creative surfaces' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', input: 2, output: 10, role: 'Builder — fast, precise action round-trips' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', input: 1, output: 5, role: 'Economy — quick drafts' }
];

export function isClaudeEffort(value: unknown): value is ClaudeEffort {
  return typeof value === 'string' && (CLAUDE_EFFORTS as string[]).includes(value);
}

/**
 * Models whose API surface predates the 4.6 generation. They accept sampling
 * parameters but reject adaptive thinking and `output_config.effort`.
 * Handles bare ids, dated snapshots and Bedrock-style prefixes.
 */
export function isLegacyClaude(model: string): boolean {
  const m = /claude-(?:(\d+)(?:-(\d+))?-(?:opus|sonnet|haiku)|(?:opus|sonnet|haiku)-(\d+)(?:-(\d)(?!\d))?)/.exec(model);
  if (!m) return false; // unknown / aliased ids are treated as current-generation
  const major = Number(m[1] ?? m[3]);
  const minor = Number(m[2] ?? m[4] ?? 0);
  return major < 4 || (major === 4 && minor <= 5);
}

/** Models shipping safety classifiers that can decline a request outright. */
export function supportsRefusalFallback(model: string): boolean {
  return /claude-(opus-5|fable|mythos)/.test(model);
}

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BuildClaudeRequestInput {
  model: string;
  messages: ChatTurn[];
  maxTokens: number;
  effort: ClaudeEffort;
  showThinking: boolean;
  refusalFallback: boolean;
  /** Only forwarded to legacy models; current models reject sampling params. */
  temperature?: number;
}

export interface BuiltClaudeRequest {
  params: Anthropic.MessageStreamParams & { fallbacks?: 'default' };
  /** Beta flags to send; empty means the stable endpoint suffices. */
  betas: string[];
  /** Human-readable summary of what was enabled, for status lines. */
  summary: string;
}

/**
 * Translates studio chat history into a Messages API request with the right
 * feature set for the target model:
 *  - current models: adaptive thinking + effort, no sampling params
 *  - legacy models: temperature only
 *  - prompt caching breakpoints on the system prompt and the latest user turn
 *  - server-side refusal fallback on classifier-guarded models (beta)
 */
export function buildClaudeRequest(input: BuildClaudeRequestInput): BuiltClaudeRequest {
  const legacy = isLegacyClaude(input.model);
  const systemText = input.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const turns = input.messages.filter((m) => m.role !== 'system');
  const lastUserIdx = turns.map((m) => m.role).lastIndexOf('user');
  const messages: Anthropic.MessageParam[] = turns.map((m, idx) =>
    idx === lastUserIdx
      ? { role: 'user', content: [{ type: 'text', text: m.content, cache_control: { type: 'ephemeral' } }] }
      : { role: m.role as 'user' | 'assistant', content: m.content }
  );

  const params: BuiltClaudeRequest['params'] = {
    model: input.model,
    max_tokens: input.maxTokens,
    messages
  };
  if (systemText) {
    params.system = [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }];
  }

  const enabled: string[] = [];
  const betas: string[] = [];
  if (legacy) {
    if (typeof input.temperature === 'number') params.temperature = input.temperature;
  } else {
    params.thinking = input.showThinking
      ? { type: 'adaptive', display: 'summarized' }
      : { type: 'adaptive', display: 'omitted' };
    params.output_config = { effort: input.effort };
    enabled.push(`effort ${input.effort}`);
    if (input.refusalFallback && supportsRefusalFallback(input.model)) {
      params.fallbacks = 'default';
      betas.push('server-side-fallback-2026-07-01');
      enabled.push('refusal fallback');
    }
  }
  enabled.push('prompt cache');

  return { params, betas, summary: enabled.join(' · ') };
}

/** Estimated USD cost for a turn on a known model; undefined for unknown ids. */
export function estimateClaudeCost(
  model: string,
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number }
): number | undefined {
  const info = CLAUDE_MODELS.find((m) => model.includes(m.id));
  if (!info) return undefined;
  const perTok = (usd: number) => usd / 1_000_000;
  return (
    usage.input * perTok(info.input) +
    usage.cacheWrite * perTok(info.input) * 1.25 +
    usage.cacheRead * perTok(info.input) * 0.1 +
    usage.output * perTok(info.output)
  );
}
