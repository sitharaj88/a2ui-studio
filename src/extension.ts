import * as vscode from 'vscode';
import { JsonStreamExtractor, validateEnvelope } from './a2ui';
import { registerA2uiPreviewTool } from './a2uiTool';
import { ConfigService } from './config';
import { A2uiPreviewProvider } from './editorProvider';
import { PlaygroundPanel } from './panel';
import { PROVIDER_LABELS, ProviderId, secretKeyFor } from './providers';

const EXAMPLE_STREAM = `{"version":"v0.9.1","createSurface":{"surfaceId":"hello_card","catalogId":"https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json","theme":{"primaryColor":"#0E8385"}}}
{"version":"v0.9.1","updateComponents":{"surfaceId":"hello_card","components":[{"id":"root","component":"Card","child":"col"},{"id":"col","component":"Column","children":["title","subtitle","divider","name_field","greet_btn"]},{"id":"title","component":"Text","text":"Hello, A2UI!","variant":"h2"},{"id":"subtitle","component":"Text","text":"Edit this file and press the preview button in the editor title bar.","variant":"caption"},{"id":"divider","component":"Divider","axis":"horizontal"},{"id":"name_field","component":"TextField","label":"Your name","value":{"path":"/user/name"},"variant":"shortText"},{"id":"greet_label","component":"Text","text":"Greet"},{"id":"greet_btn","component":"Button","child":"greet_label","variant":"primary","action":{"event":{"name":"greet","context":{"name":{"path":"/user/name"}}}}}]}}
{"version":"v0.9.1","updateDataModel":{"surfaceId":"hello_card","path":"/user","value":{"name":"World"}}}
`;

export function activate(context: vscode.ExtensionContext): void {
  const configService = new ConfigService(context);
  context.subscriptions.push(configService);

  // Status bar: shows the active profile or provider/model at a glance.
  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  statusItem.command = 'a2ui.openPlayground';
  const updateStatusBar = () => {
    const eff = configService.effective();
    const label = eff.activeProfile
      ? eff.activeProfile
      : `${PROVIDER_LABELS[eff.provider]}${eff.model ? ` · ${eff.model}` : ''}`;
    statusItem.text = `$(sparkle) A2UI: ${label}`;
    statusItem.tooltip = new vscode.MarkdownString(
      [
        '**A2UI Studio**',
        '',
        `Provider: ${PROVIDER_LABELS[eff.provider]}`,
        `Model: ${eff.model || 'auto'}`,
        eff.activeProfile ? `Profile: ${eff.activeProfile} (a2ui.config.json)` : 'Source: VS Code settings',
        '',
        '_Click to open the playground._'
      ].join('\n')
    );
    statusItem.show();
  };
  updateStatusBar();
  context.subscriptions.push(statusItem, configService.onDidChange(updateStatusBar));

  // Live split-preview editor for .a2ui.json(l) files.
  context.subscriptions.push(A2uiPreviewProvider.register(context, configService));

  // Copilot agent tool: validate a generated stream and open it in Studio.
  registerA2uiPreviewTool(context, configService);

  context.subscriptions.push(
    vscode.commands.registerCommand('a2ui.openPlayground', () => {
      PlaygroundPanel.show(context, configService);
    }),

    vscode.commands.registerCommand('a2ui.openSettings', () => {
      const panel = PlaygroundPanel.show(context, configService);
      setTimeout(() => panel.showView('settings'), 150);
    }),

    vscode.commands.registerCommand('a2ui.openConfigFile', async () => {
      const uri = configService.configFileUri;
      if (uri) await vscode.window.showTextDocument(uri);
      else await configService.createConfigFile();
    }),

    vscode.commands.registerCommand('a2ui.previewFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showWarningMessage('Open an A2UI JSON/JSONL file first, then run Preview.');
        return;
      }
      const name = editor.document.fileName.split(/[\\/]/).pop() ?? 'file';
      const panel = PlaygroundPanel.show(context, configService);
      // Give a fresh webview a beat to boot before piping messages in.
      setTimeout(() => panel.previewStream(editor.document.getText(), name), 300);
    }),

    vscode.commands.registerCommand('a2ui.setApiKey', async () => {
      const pick = await vscode.window.showQuickPick(
        (Object.entries(PROVIDER_LABELS) as Array<[ProviderId, string]>)
          .filter(([id]) => id !== 'copilot' && id !== 'ollama')
          .map(([id, label]) => ({ id, label })),
        { placeHolder: 'Which provider is this API key for?' }
      );
      if (!pick) return;
      const key = await vscode.window.showInputBox({
        prompt: `Enter your ${pick.label} API key (stored securely in VS Code secret storage). Leave empty to remove.`,
        password: true,
        ignoreFocusOut: true
      });
      if (key === undefined) return;
      if (key === '') {
        await context.secrets.delete(secretKeyFor(pick.id));
        void vscode.window.showInformationMessage(`${pick.label} API key removed.`);
      } else {
        await context.secrets.store(secretKeyFor(pick.id), key.trim());
        void vscode.window.showInformationMessage(`${pick.label} API key saved.`);
      }
    }),

    vscode.commands.registerCommand('a2ui.previewText', (jsonl: string, sourceName?: string) => {
      const panel = PlaygroundPanel.show(context, configService);
      setTimeout(() => panel.previewStream(String(jsonl ?? ''), sourceName || 'Copilot Agent'), 300);
    }),

    vscode.commands.registerCommand('a2ui.newExampleFile', async () => {
      const doc = await vscode.workspace.openTextDocument({
        language: 'jsonl',
        content: EXAMPLE_STREAM
      });
      await vscode.window.showTextDocument(doc);
      void vscode.window.showInformationMessage(
        'Save this as hello.a2ui.jsonl, then use "A2UI: Preview Current File" to render it.'
      );
    })
  );
}

export function deactivate(): void {}
