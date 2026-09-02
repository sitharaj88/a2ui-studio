import * as vscode from 'vscode';
import { JsonStreamExtractor, SurfaceTracker, validateEnvelope } from './a2ui';
import { ClaudeUsage } from './claude';
import { ClaudeEffort, CLAUDE_MODELS, estimateClaudeCost } from './claudeRequest';
import { ConfigService, EffectiveConfig } from './config';
import {
  ChatMessage,
  DEFAULT_MODELS,
  generate,
  listModels,
  PROVIDER_LABELS,
  ProviderId,
  secretKeyFor
} from './providers';
import { actionPrompt, buildSystemPrompt, repairPrompt, userRequestPrompt } from './prompt';
import { EXPORT_VSCODE_VARS, webviewHtml } from './webviewHtml';

const SAVED_PROMPTS_KEY = 'a2ui.savedPrompts';

interface SavedPrompt {
  id: string;
  text: string;
}

/** VS Code settings the webview Settings view may write. */
const WRITABLE_SETTINGS = new Set([
  'provider',
  'model',
  'temperature',
  'maxTokens',
  'autoRepair',
  'systemPromptAppend',
  'ollamaUrl',
  'a2aEndpoint',
  'baseUrls',
  'claude.effort',
  'claude.actionModel',
  'claude.actionEffort',
  'claude.showThinking',
  'claude.refusalFallback',
  'zai.plan',
  'zai.reasoningEffort'
]);

/** What a turn is for — drives model/effort routing on Claude. */
type TurnKind = 'design' | 'action' | 'repair';

interface TurnRoute {
  model: string;
  effort: ClaudeEffort;
  /** Short label shown in status lines, e.g. "designer · claude-opus-5". */
  label: string;
}

/**
 * Picks the model and effort for a turn. On Claude, design turns go to the
 * configured (Opus-class) model at full effort while action round-trips and
 * repairs go to the faster action model — the "designer / builder" split.
 */
export function routeTurn(eff: EffectiveConfig, kind: TurnKind): TurnRoute {
  const designModel = eff.model || DEFAULT_MODELS[eff.provider];
  if (eff.provider !== 'anthropic') {
    return { model: eff.model, effort: eff.claude.effort, label: designModel || 'auto' };
  }
  if (kind === 'design' || !eff.claude.actionModel) {
    return { model: designModel, effort: eff.claude.effort, label: `designer · ${designModel}` };
  }
  return {
    model: eff.claude.actionModel,
    effort: eff.claude.actionEffort,
    label: `builder · ${eff.claude.actionModel}`
  };
}

export class PlaygroundPanel {
  public static current: PlaygroundPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private readonly configService: ConfigService;
  private history: ChatMessage[] = [];
  private readonly tracker = new SurfaceTracker();
  private cancelSource: vscode.CancellationTokenSource | undefined;
  private disposables: vscode.Disposable[] = [];

  static show(context: vscode.ExtensionContext, configService: ConfigService): PlaygroundPanel {
    if (PlaygroundPanel.current) {
      PlaygroundPanel.current.panel.reveal();
      return PlaygroundPanel.current;
    }
    const panel = vscode.window.createWebviewPanel(
      'a2uiPlayground',
      'A2UI Studio',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );
    PlaygroundPanel.current = new PlaygroundPanel(panel, context, configService);
    return PlaygroundPanel.current;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    configService: ConfigService
  ) {
    this.panel = panel;
    this.context = context;
    this.configService = configService;
    this.panel.webview.html = this.renderHtml();
    this.panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'activity-icon.svg');

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg), null, this.disposables);
    this.disposables.push(this.configService.onDidChange(() => this.sendConfig()));
  }

  /** Switch the webview to a specific view (dashboard/playground/gallery/settings). */
  showView(view: string): void {
    this.post({ type: 'setView', view });
  }

  /** Pipe a pre-recorded A2UI JSONL stream (from a file) into the renderer. */
  previewStream(text: string, sourceName: string): void {
    this.post({ type: 'resetSurfaces' });
    this.tracker.reset();
    this.post({ type: 'note', text: `Previewing ${sourceName}` });
    const extractor = new JsonStreamExtractor();
    const objects = [...extractor.push(text), ...extractor.finish()];
    const allowUnknown = !!this.configService.effective().catalog;
    let valid = 0;
    for (const obj of objects) {
      const result = validateEnvelope(obj, { allowUnknownComponents: allowUnknown });
      if (result.ok) {
        valid++;
        this.tracker.apply(obj);
        this.post({ type: 'a2ui', envelope: obj });
      } else {
        this.post({ type: 'invalid', envelope: obj, errors: result.errors });
      }
    }
    this.post({
      type: 'status',
      state: 'idle',
      text: `Rendered ${valid} message${valid === 1 ? '' : 's'} from ${sourceName}`
    });
  }

  private async onMessage(msg: any): Promise<void> {
    switch (msg?.type) {
      case 'ready':
        await this.sendConfig();
        break;
      case 'listModels': {
        const provider = (msg.provider as ProviderId) || this.configService.effective().provider;
        const result = await listModels(provider, this.context.secrets, {
          baseUrl: this.configService.baseUrlFor(provider),
          ollamaUrl: this.configService.effective().ollamaUrl,
          zaiPlan: this.configService.effective().zai.plan
        });
        this.post({ type: 'models', provider, models: result.models, note: result.note });
        break;
      }
      case 'prompt':
        await this.runTurn(userRequestPrompt(String(msg.text ?? '')), 'design');
        break;
      case 'action':
        await this.runTurn(actionPrompt(msg.payload), 'action');
        break;
      case 'stop':
        this.cancelSource?.cancel();
        for (const c of this.arenaCancels.splice(0)) c.cancel();
        break;
      case 'clear':
        this.history = [];
        this.tracker.reset();
        this.post({ type: 'resetSurfaces' });
        this.post({ type: 'status', state: 'idle', text: 'Session cleared' });
        break;
      case 'setProvider':
        await this.configService.setActiveProfile('');
        await vscode.workspace
          .getConfiguration('a2ui')
          .update('provider', msg.provider, vscode.ConfigurationTarget.Global);
        break;
      case 'setModel':
        await this.configService.setActiveProfile('');
        await vscode.workspace
          .getConfiguration('a2ui')
          .update('model', msg.model ?? '', vscode.ConfigurationTarget.Global);
        break;
      case 'setActiveProfile':
        await this.configService.setActiveProfile(String(msg.name ?? ''));
        break;
      case 'setSetting': {
        const key = String(msg.key ?? '');
        if (WRITABLE_SETTINGS.has(key)) {
          await vscode.workspace
            .getConfiguration('a2ui')
            .update(key, msg.value, vscode.ConfigurationTarget.Global);
        }
        break;
      }
      case 'setApiKey':
        await vscode.commands.executeCommand('a2ui.setApiKey');
        await this.sendConfig();
        break;
      case 'openConfigFile': {
        const uri = this.configService.configFileUri;
        if (uri) await vscode.window.showTextDocument(uri);
        else await this.configService.createConfigFile();
        break;
      }
      case 'createConfigFile':
        await this.configService.createConfigFile();
        break;
      case 'exportSession':
        await this.exportSession(String(msg.jsonl ?? ''));
        break;
      case 'exportHtml':
        await this.exportHtml(String(msg.surfaceId ?? 'surface'), String(msg.html ?? ''));
        break;
      case 'arena':
        await this.runArena(msg);
        break;
      case 'savePrompt': {
        const text = String(msg.text ?? '').trim();
        if (!text) break;
        const prompts = this.savedPrompts.filter((p) => p.text !== text);
        prompts.unshift({ id: Date.now().toString(36), text });
        await this.context.globalState.update(SAVED_PROMPTS_KEY, prompts.slice(0, 30));
        await this.sendConfig();
        break;
      }
      case 'deletePrompt':
        await this.context.globalState.update(
          SAVED_PROMPTS_KEY,
          this.savedPrompts.filter((p) => p.id !== msg.id)
        );
        await this.sendConfig();
        break;
      case 'openExternal':
        if (typeof msg.url === 'string' && /^https?:\/\//i.test(msg.url)) {
          void vscode.env.openExternal(vscode.Uri.parse(msg.url));
        }
        break;
    }
  }

  private get savedPrompts(): SavedPrompt[] {
    return this.context.globalState.get<SavedPrompt[]>(SAVED_PROMPTS_KEY, []);
  }

  /** Exports a rendered surface as a standalone HTML snapshot. */
  private async exportHtml(surfaceId: string, html: string): Promise<void> {
    if (!html) return;
    const cssUri = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css');
    const css = Buffer.from(await vscode.workspace.fs.readFile(cssUri)).toString('utf8');
    const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${surfaceId} — A2UI surface</title>
<style>${EXPORT_VSCODE_VARS}</style>
<style>${css}</style>
</head>
<body>
${html}
<!-- Static snapshot exported from A2UI Studio (https://a2ui.org). Inputs are visual only. -->
</body>
</html>`;
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
    const target = await vscode.window.showSaveDialog({
      defaultUri: folder ? vscode.Uri.joinPath(folder, `${surfaceId}.html`) : undefined,
      filters: { HTML: ['html'] },
      title: 'Export surface as HTML snapshot'
    });
    if (!target) return;
    await vscode.workspace.fs.writeFile(target, Buffer.from(page, 'utf8'));
    void vscode.window.showInformationMessage(`Surface exported to ${target.fsPath.split(/[\\/]/).pop()}.`);
  }

  // -------------------------------------------------------------------------
  // Model arena: run the same prompt against two providers concurrently.
  // -------------------------------------------------------------------------

  private arenaCancels: vscode.CancellationTokenSource[] = [];

  private async runArena(msg: any): Promise<void> {
    for (const c of this.arenaCancels.splice(0)) c.cancel();
    const prompt = String(msg.prompt ?? '').trim();
    if (!prompt) return;
    await Promise.all(
      (['a', 'b'] as const).map((side) => this.arenaOnce(side, prompt, msg.sides?.[side] ?? {}))
    );
  }

  private async arenaOnce(
    side: 'a' | 'b',
    prompt: string,
    sel: { provider?: ProviderId; model?: string }
  ): Promise<void> {
    const eff = this.configService.effective();
    const provider = sel.provider ?? eff.provider;
    const cts = new vscode.CancellationTokenSource();
    this.arenaCancels.push(cts);
    const extractor = new JsonStreamExtractor();
    const allowUnknown = !!eff.catalog;
    const start = Date.now();
    let messages = 0;
    let invalid = 0;

    const handleObjects = (objects: unknown[]) => {
      for (const obj of objects) {
        const result = validateEnvelope(obj, { allowUnknownComponents: allowUnknown });
        if (result.ok) messages++;
        else invalid++;
        this.post({ type: 'arenaEnvelope', side, envelope: obj, ok: result.ok, errors: result.errors });
      }
    };

    this.post({ type: 'arenaStatus', side, state: 'generating', text: `Generating with ${PROVIDER_LABELS[provider]}…` });
    try {
      await generate({
        provider,
        model: sel.model ?? '',
        temperature: eff.temperature,
        maxTokens: eff.maxTokens,
        baseUrl: this.configService.baseUrlFor(provider),
        ollamaUrl: eff.ollamaUrl,
        effort: eff.claude.effort,
        showThinking: false,
        refusalFallback: eff.claude.refusalFallback,
        zaiPlan: eff.zai.plan,
        reasoningEffort: eff.zai.reasoningEffort,
        onModel: (modelLabel) =>
          this.post({ type: 'arenaStatus', side, state: 'generating', text: `${PROVIDER_LABELS[provider]} · ${modelLabel}` }),
        onUsage: (usage) => this.postUsage(usage, `arena ${side.toUpperCase()}`),
        messages: [
          { role: 'system', content: buildSystemPrompt(eff.systemPromptAppend, eff.catalog) },
          { role: 'user', content: userRequestPrompt(prompt) }
        ],
        secrets: this.context.secrets,
        token: cts.token,
        onText: (chunk) => handleObjects(extractor.push(chunk))
      });
      handleObjects(extractor.finish());
      this.post({
        type: 'arenaStatus',
        side,
        state: 'idle',
        text: 'Done',
        stats: { messages, invalid, ms: Date.now() - start }
      });
    } catch (e) {
      this.post({
        type: 'arenaStatus',
        side,
        state: cts.token.isCancellationRequested ? 'idle' : 'error',
        text: cts.token.isCancellationRequested ? 'Stopped' : e instanceof Error ? e.message : String(e),
        stats: { messages, invalid, ms: Date.now() - start }
      });
    }
  }

  private async exportSession(jsonl: string): Promise<void> {
    if (!jsonl.trim()) {
      void vscode.window.showInformationMessage('Nothing to export yet — generate a surface first.');
      return;
    }
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
    const target = await vscode.window.showSaveDialog({
      defaultUri: folder ? vscode.Uri.joinPath(folder, 'session.a2ui.jsonl') : undefined,
      filters: { 'A2UI stream': ['jsonl', 'json'] },
      title: 'Export A2UI session stream'
    });
    if (!target) return;
    await vscode.workspace.fs.writeFile(target, Buffer.from(jsonl, 'utf8'));
    const open = await vscode.window.showInformationMessage('A2UI session exported.', 'Open file');
    if (open) await vscode.window.showTextDocument(target);
  }

  private async sendConfig(): Promise<void> {
    const eff = this.configService.effective();
    const keys: Record<string, boolean> = {};
    for (const p of ['anthropic', 'zai', 'openai', 'gemini'] as ProviderId[]) {
      keys[p] = !!(await this.context.secrets.get(secretKeyFor(p)));
    }
    if (!keys.anthropic && process.env.ANTHROPIC_API_KEY) keys.anthropic = true;
    const cfg = vscode.workspace.getConfiguration('a2ui');
    this.post({
      type: 'config',
      effective: {
        ...eff,
        // The catalog JSON can be large; the webview only needs metadata.
        catalog: eff.catalog ? { id: eff.catalog.id, componentNames: eff.catalog.componentNames } : undefined
      },
      keys,
      savedPrompts: this.savedPrompts,
      settings: {
        provider: cfg.get('provider', 'copilot'),
        model: cfg.get('model', ''),
        temperature: cfg.get('temperature', 0.7),
        maxTokens: cfg.get('maxTokens', 16000),
        autoRepair: cfg.get('autoRepair', true),
        systemPromptAppend: cfg.get('systemPromptAppend', ''),
        ollamaUrl: cfg.get('ollamaUrl', 'http://localhost:11434'),
        a2aEndpoint: cfg.get('a2aEndpoint', ''),
        baseUrls: cfg.get('baseUrls', {}),
        claude: this.configService.claudeSettings(),
        zai: this.configService.glmSettings()
      },
      claudeModels: CLAUDE_MODELS,
      providers: Object.entries(PROVIDER_LABELS).map(([id, label]) => ({
        id,
        label,
        defaultModel: DEFAULT_MODELS[id as ProviderId]
      }))
    });
  }

  private postUsage(usage: ClaudeUsage, kind: string): void {
    this.post({ type: 'usage', kind, ...usage, cost: estimateClaudeCost(usage.model, usage) });
  }

  /** Runs one generate turn (plus at most one auto-repair turn). */
  private async runTurn(userContent: string, kind: TurnKind): Promise<void> {
    if (this.cancelSource) {
      this.cancelSource.cancel();
    }
    const eff = this.configService.effective();
    if (this.history.length === 0) {
      this.history.push({ role: 'system', content: buildSystemPrompt(eff.systemPromptAppend, eff.catalog) });
    }
    this.history.push({ role: 'user', content: userContent });

    const errors = await this.streamOnce(kind);
    if (errors === undefined) return; // cancelled or failed

    if (errors.length > 0 && eff.autoRepair) {
      this.post({ type: 'status', state: 'generating', text: 'Auto-repairing invalid messages…' });
      this.post({ type: 'notice', text: `Repairing ${errors.length} issue${errors.length === 1 ? '' : 's'}: ${errors[0]}` });
      this.history.push({ role: 'user', content: repairPrompt(errors) });
      await this.streamOnce('repair');
    }
  }

  /**
   * Streams one model response, forwarding valid envelopes to the webview.
   * Returns the list of validation errors, or undefined on cancel/failure.
   */
  private async streamOnce(kind: TurnKind): Promise<string[] | undefined> {
    const eff = this.configService.effective();
    const route = routeTurn(eff, kind);
    this.cancelSource = new vscode.CancellationTokenSource();
    const token = this.cancelSource.token;
    const extractor = new JsonStreamExtractor();
    const errors: string[] = [];
    let assistantText = '';
    let envelopeCount = 0;

    const allowUnknown = !!eff.catalog;
    const handleObjects = (objects: unknown[]) => {
      for (const obj of objects) {
        const result = validateEnvelope(obj, { allowUnknownComponents: allowUnknown });
        if (result.ok) {
          envelopeCount++;
          this.tracker.apply(obj);
          this.post({ type: 'a2ui', envelope: obj });
        } else {
          errors.push(...result.errors);
          this.post({ type: 'invalid', envelope: obj, errors: result.errors });
        }
      }
    };

    const label = eff.activeProfile
      ? `profile “${eff.activeProfile}” (${PROVIDER_LABELS[eff.provider]})`
      : PROVIDER_LABELS[eff.provider];
    this.post({ type: 'status', state: 'generating', text: `Generating with ${label}…` });

    try {
      await generate({
        provider: eff.provider,
        model: route.model,
        temperature: eff.temperature,
        maxTokens: eff.maxTokens,
        baseUrl: eff.baseUrl,
        ollamaUrl: eff.ollamaUrl,
        effort: route.effort,
        showThinking: eff.claude.showThinking,
        refusalFallback: eff.claude.refusalFallback,
        zaiPlan: eff.zai.plan,
        reasoningEffort: eff.zai.reasoningEffort,
        messages: this.history,
        secrets: this.context.secrets,
        token,
        // Surface the model actually in use — a wrong-model bill should be
        // impossible to miss.
        onModel: (modelLabel) =>
          this.post({
            type: 'status',
            state: 'generating',
            text:
              eff.provider === 'anthropic'
                ? `Generating with ${label} · ${route.label} · effort ${route.effort}…`
                : eff.provider === 'zai'
                  ? `Generating with ${label} · ${modelLabel} · ${eff.zai.plan} plan · reasoning ${eff.zai.reasoningEffort}…`
                  : `Generating with ${label} · ${modelLabel}…`
          }),
        onThinking: (chunk) => this.post({ type: 'thinking', text: chunk }),
        onUsage: (usage) => this.postUsage(usage, kind),
        onNote: (text) => this.post({ type: 'notice', text }),
        onText: (chunk) => {
          assistantText += chunk;
          this.post({ type: 'raw', text: chunk });
          handleObjects(extractor.push(chunk));
        }
      });
      handleObjects(extractor.finish());
    } catch (e) {
      if (!token.isCancellationRequested) {
        const message = e instanceof Error ? e.message : String(e);
        this.post({ type: 'status', state: 'error', text: message });
      } else {
        this.post({ type: 'status', state: 'idle', text: 'Stopped' });
      }
      if (assistantText) this.history.push({ role: 'assistant', content: assistantText });
      return undefined;
    }

    this.history.push({ role: 'assistant', content: assistantText || '(empty response)' });

    if (token.isCancellationRequested) {
      this.post({ type: 'status', state: 'idle', text: 'Stopped' });
      return undefined;
    }
    // Structural problems only visible across messages (dangling ids, no root).
    errors.push(...this.tracker.lint());
    this.post({
      type: 'status',
      state: 'idle',
      text:
        envelopeCount > 0
          ? `Done — ${envelopeCount} A2UI message${envelopeCount === 1 ? '' : 's'}${errors.length ? `, ${errors.length} issue${errors.length === 1 ? '' : 's'}` : ''}`
          : 'The model returned no A2UI messages. Try a different prompt or provider.'
    });
    return errors;
  }

  private post(message: unknown): void {
    void this.panel.webview.postMessage(message);
  }

  private renderHtml(): string {
    return webviewHtml(this.panel.webview, this.context.extensionUri, 'studio');
  }

  private dispose(): void {
    PlaygroundPanel.current = undefined;
    this.cancelSource?.cancel();
    for (const c of this.arenaCancels.splice(0)) c.cancel();
    for (const d of this.disposables.splice(0)) d.dispose();
  }
}
