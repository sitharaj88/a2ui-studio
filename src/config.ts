import * as vscode from 'vscode';
import { ProviderId } from './providers';

export interface ProfileConfig {
  name: string;
  description?: string;
  provider: ProviderId;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FileConfig {
  defaultProfile?: string;
  autoRepair?: boolean;
  systemPromptAppend?: string;
  ollamaUrl?: string;
  profiles?: ProfileConfig[];
  /** Custom component catalog: path is resolved relative to the config file. */
  catalog?: { id?: string; path?: string };
  /** Per-provider gateway base URLs (e.g. AWS/LiteLLM proxies). */
  baseUrls?: Partial<Record<ProviderId, string>>;
}

export interface LoadedCatalog {
  id: string;
  json: string;
  componentNames: string[];
}

export interface EffectiveConfig {
  provider: ProviderId;
  model: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  autoRepair: boolean;
  systemPromptAppend: string;
  ollamaUrl: string;
  /** '' means manual (VS Code settings); otherwise the active profile name. */
  activeProfile: string;
  profiles: ProfileConfig[];
  /** Where provider/model came from. */
  source: 'profile' | 'settings';
  configPath?: string;
  configError?: string;
  catalog?: LoadedCatalog;
}

const PROVIDERS: ProviderId[] = ['copilot', 'anthropic', 'openai', 'gemini', 'ollama'];
const ACTIVE_PROFILE_KEY = 'a2ui.activeProfile';

export const CONFIG_FILE_NAMES = ['a2ui.config.json', '.a2ui/config.json'];

export const CONFIG_TEMPLATE = `{
  "$schema": "https://raw.githubusercontent.com/sitharaj/a2ui-studio/main/schemas/a2ui.config.schema.json",
  "defaultProfile": "copilot",
  "autoRepair": true,
  "systemPromptAppend": "",
  "profiles": [
    {
      "name": "copilot",
      "description": "GitHub Copilot — no API key needed",
      "provider": "copilot",
      "model": ""
    },
    {
      "name": "claude",
      "description": "Anthropic Claude for the richest surfaces",
      "provider": "anthropic",
      "model": "claude-sonnet-5",
      "temperature": 0.7,
      "maxTokens": 8192
    },
    {
      "name": "local",
      "description": "Fully local via Ollama",
      "provider": "ollama",
      "model": "llama3.2"
    }
  ]
}
`;

/**
 * Central configuration: merges the workspace a2ui.config.json (team-shared,
 * highest precedence) with VS Code settings. Watches both for changes.
 */
export class ConfigService implements vscode.Disposable {
  private fileConfig: FileConfig | undefined;
  private configUri: vscode.Uri | undefined;
  private configError: string | undefined;
  private catalog: LoadedCatalog | undefined;
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.emitter.event;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/{a2ui.config.json,.a2ui/config.json}');
    for (const evt of [watcher.onDidChange, watcher.onDidCreate, watcher.onDidDelete]) {
      this.disposables.push(evt(() => void this.reload()));
    }
    this.disposables.push(
      watcher,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('a2ui')) this.emitter.fire();
      })
    );
    void this.reload();
  }

  async reload(): Promise<void> {
    this.fileConfig = undefined;
    this.configUri = undefined;
    this.configError = undefined;
    const folders = vscode.workspace.workspaceFolders ?? [];
    outer: for (const folder of folders) {
      for (const name of CONFIG_FILE_NAMES) {
        const uri = vscode.Uri.joinPath(folder.uri, name);
        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          try {
            const parsed = JSON.parse(Buffer.from(bytes).toString('utf8')) as FileConfig;
            this.fileConfig = parsed;
            this.configUri = uri;
          } catch (e) {
            this.configUri = uri;
            this.configError = `Could not parse ${name}: ${e instanceof Error ? e.message : e}`;
          }
          break outer;
        } catch {
          // file absent; try next candidate
        }
      }
    }
    await this.loadCatalog();
    this.emitter.fire();
  }

  private async loadCatalog(): Promise<void> {
    this.catalog = undefined;
    const spec = this.fileConfig?.catalog;
    if (!spec?.path || !this.configUri) return;
    try {
      const baseDir = vscode.Uri.joinPath(this.configUri, '..');
      const uri = vscode.Uri.joinPath(baseDir, spec.path);
      const json = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
      const parsed = JSON.parse(json);
      const components = parsed.components;
      const componentNames =
        components && typeof components === 'object' && !Array.isArray(components)
          ? Object.keys(components)
          : Array.isArray(components)
            ? components.map((c: any) => c?.name ?? c?.component).filter(Boolean)
            : [];
      if (componentNames.length === 0) {
        this.configError = `Catalog at ${spec.path} defines no components (expected a "components" object).`;
        return;
      }
      this.catalog = {
        id: spec.id || parsed.catalogId || parsed.$id || spec.path,
        json,
        componentNames
      };
    } catch (e) {
      this.configError = `Could not load catalog "${spec.path}": ${e instanceof Error ? e.message : e}`;
    }
  }

  get configFileUri(): vscode.Uri | undefined {
    return this.configUri;
  }

  /** Valid profiles from the config file (invalid providers filtered out). */
  get profiles(): ProfileConfig[] {
    const raw = this.fileConfig?.profiles ?? [];
    return raw.filter(
      (p): p is ProfileConfig =>
        !!p && typeof p.name === 'string' && p.name.length > 0 && PROVIDERS.includes(p.provider)
    );
  }

  get activeProfileName(): string {
    const stored = this.context.workspaceState.get<string>(ACTIVE_PROFILE_KEY);
    const profiles = this.profiles;
    if (stored !== undefined) {
      return stored === '' || profiles.some((p) => p.name === stored) ? stored : '';
    }
    const def = this.fileConfig?.defaultProfile;
    if (def && profiles.some((p) => p.name === def)) return def;
    return profiles.length > 0 ? profiles[0].name : '';
  }

  async setActiveProfile(name: string): Promise<void> {
    await this.context.workspaceState.update(ACTIVE_PROFILE_KEY, name);
    this.emitter.fire();
  }

  /**
   * Gateway base URL for a provider. Precedence: active profile (when it
   * targets this provider) → config file baseUrls → VS Code a2ui.baseUrls.
   */
  baseUrlFor(provider: ProviderId): string | undefined {
    const profile = this.profiles.find((p) => p.name === this.activeProfileName);
    if (profile && profile.provider === provider && profile.baseUrl) return profile.baseUrl;
    const fromFile = this.fileConfig?.baseUrls?.[provider];
    if (fromFile) return fromFile;
    const fromSettings = vscode.workspace
      .getConfiguration('a2ui')
      .get<Partial<Record<ProviderId, string>>>('baseUrls', {});
    return fromSettings[provider] || undefined;
  }

  effective(): EffectiveConfig {
    const cfg = vscode.workspace.getConfiguration('a2ui');
    const file = this.fileConfig ?? {};
    const base: EffectiveConfig = {
      provider: cfg.get<ProviderId>('provider', 'copilot'),
      model: cfg.get<string>('model', ''),
      temperature: cfg.get<number>('temperature', 0.7),
      maxTokens: cfg.get<number>('maxTokens', 8192),
      autoRepair: file.autoRepair ?? cfg.get<boolean>('autoRepair', true),
      systemPromptAppend:
        typeof file.systemPromptAppend === 'string' && file.systemPromptAppend.trim()
          ? file.systemPromptAppend
          : cfg.get<string>('systemPromptAppend', ''),
      ollamaUrl: file.ollamaUrl ?? cfg.get<string>('ollamaUrl', 'http://localhost:11434'),
      activeProfile: this.activeProfileName,
      profiles: this.profiles,
      source: 'settings',
      configPath: this.configUri?.fsPath,
      configError: this.configError,
      catalog: this.catalog
    };
    const profile = this.profiles.find((p) => p.name === base.activeProfile);
    if (profile) {
      base.provider = profile.provider;
      base.model = profile.model ?? '';
      if (typeof profile.temperature === 'number') base.temperature = profile.temperature;
      if (typeof profile.maxTokens === 'number') base.maxTokens = profile.maxTokens;
      base.source = 'profile';
    }
    base.baseUrl = this.baseUrlFor(base.provider);
    return base;
  }

  /** Creates a starter config file in the first workspace folder and opens it. */
  async createConfigFile(): Promise<vscode.Uri | undefined> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      void vscode.window.showWarningMessage('Open a folder first — the A2UI config file lives in your workspace.');
      return undefined;
    }
    const uri = vscode.Uri.joinPath(folder.uri, 'a2ui.config.json');
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(CONFIG_TEMPLATE, 'utf8'));
    }
    await vscode.window.showTextDocument(uri);
    await this.reload();
    return uri;
  }

  dispose(): void {
    for (const d of this.disposables.splice(0)) d.dispose();
    this.emitter.dispose();
  }
}
