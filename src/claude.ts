/**
 * Anthropic Claude provider built on the official SDK: streaming with adaptive
 * thinking, effort control, prompt caching, refusal handling and typed errors.
 */
import Anthropic from '@anthropic-ai/sdk';
import type * as vscode from 'vscode';
import { buildClaudeRequest, ChatTurn, ClaudeEffort, CLAUDE_MODELS } from './claudeRequest';

export interface ClaudeUsage {
  model: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface ClaudeStreamOptions {
  apiKey: string;
  baseUrl?: string;
  model: string;
  messages: ChatTurn[];
  maxTokens: number;
  effort: ClaudeEffort;
  showThinking: boolean;
  refusalFallback: boolean;
  temperature?: number;
  token: vscode.CancellationToken;
  onText(chunk: string): void;
  onThinking?(chunk: string): void;
  onUsage?(usage: ClaudeUsage): void;
  /** Non-fatal, user-facing notices (fallback ran, output truncated…). */
  onNote?(text: string): void;
  /** Called once with a summary of the request features that were enabled. */
  onFeatures?(summary: string): void;
}

function makeClient(apiKey: string, baseUrl?: string): Anthropic {
  return new Anthropic({
    // Gateways commonly do their own auth; the SDK still insists on a credential.
    apiKey: apiKey || (baseUrl ? 'gateway' : undefined),
    baseURL: baseUrl || undefined,
    maxRetries: 2
  });
}

interface MinimalStream extends AsyncIterable<Anthropic.MessageStreamEvent | Anthropic.Beta.BetaRawMessageStreamEvent> {
  finalMessage(): Promise<Anthropic.Message | Anthropic.Beta.BetaMessage>;
}

/** Streams one Claude turn. Resolves when the model finishes; throws on API errors or refusals. */
export async function streamClaude(opts: ClaudeStreamOptions): Promise<void> {
  const client = makeClient(opts.apiKey, opts.baseUrl);
  const { params, betas, summary } = buildClaudeRequest(opts);
  opts.onFeatures?.(summary);

  const controller = new AbortController();
  const sub = opts.token.onCancellationRequested(() => controller.abort());
  try {
    const stream: MinimalStream = betas.length
      ? client.beta.messages.stream(
          { ...(params as unknown as Parameters<typeof client.beta.messages.stream>[0]), betas },
          { signal: controller.signal }
        )
      : client.messages.stream(params, { signal: controller.signal });

    for await (const event of stream) {
      if (opts.token.isCancellationRequested) break;
      if (event.type !== 'content_block_delta') continue;
      if (event.delta.type === 'text_delta') opts.onText(event.delta.text);
      else if (event.delta.type === 'thinking_delta') opts.onThinking?.(event.delta.thinking);
    }
    if (opts.token.isCancellationRequested) return;

    const final = await stream.finalMessage();
    opts.onUsage?.({
      model: final.model,
      input: final.usage.input_tokens ?? 0,
      output: final.usage.output_tokens ?? 0,
      cacheRead: final.usage.cache_read_input_tokens ?? 0,
      cacheWrite: final.usage.cache_creation_input_tokens ?? 0
    });

    for (const block of final.content as Array<{ type: string; from?: { model: string }; to?: { model: string } }>) {
      if (block.type === 'fallback' && block.from && block.to) {
        opts.onNote?.(`${block.from.model} declined this request; ${block.to.model} answered instead.`);
      }
    }

    if (final.stop_reason === 'refusal') {
      const details = final.stop_details;
      const why = details?.category ? ` (category: ${details.category})` : '';
      throw new Error(
        `Claude declined this request${why}. ${details?.explanation ?? 'Try rephrasing, or pick a different model.'}`
      );
    }
    if (final.stop_reason === 'max_tokens') {
      opts.onNote?.(
        `Output stopped at the ${opts.maxTokens}-token limit — raise "Max output tokens" in Settings for larger surfaces.`
      );
    }
  } catch (e) {
    if (opts.token.isCancellationRequested) return;
    throw translateError(e, opts.baseUrl);
  } finally {
    sub.dispose();
  }
}

function translateError(e: unknown, baseUrl?: string): Error {
  if (e instanceof Anthropic.AuthenticationError) {
    return new Error('Claude rejected the API key. Run "A2UI: Set AI Provider API Key" to update it.');
  }
  if (e instanceof Anthropic.PermissionDeniedError) {
    return new Error(`Claude denied access to this model or feature: ${e.message}`);
  }
  if (e instanceof Anthropic.NotFoundError) {
    return new Error(`Claude could not find that model — pick one from the model dropdown. (${e.message})`);
  }
  if (e instanceof Anthropic.RateLimitError) {
    return new Error('Claude rate limit reached — wait a moment and try again.');
  }
  if (e instanceof Anthropic.BadRequestError) {
    return new Error(`Claude rejected the request: ${e.message}`);
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return new Error(`Could not reach ${baseUrl || 'api.anthropic.com'}: ${e.message}`);
  }
  if (e instanceof Anthropic.APIError) {
    return new Error(`Claude API error ${e.status ?? ''}: ${e.message}`.replace('  ', ' '));
  }
  return e instanceof Error ? e : new Error(String(e));
}

/** Lists the account's models, first-class studio models first. */
export async function listClaudeModels(
  apiKey: string,
  baseUrl?: string
): Promise<Array<{ id: string; label: string }>> {
  const client = makeClient(apiKey, baseUrl);
  const seen: Array<{ id: string; label: string }> = [];
  for await (const m of client.models.list({ limit: 100 })) {
    seen.push({ id: m.id, label: m.display_name || m.id });
  }
  const rank = (id: string) => {
    const idx = CLAUDE_MODELS.findIndex((c) => id === c.id);
    return idx < 0 ? CLAUDE_MODELS.length : idx;
  };
  return seen.sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label));
}
