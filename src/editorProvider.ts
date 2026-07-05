import * as vscode from 'vscode';
import { JsonStreamExtractor, validateEnvelope } from './a2ui';
import { ConfigService } from './config';
import { webviewHtml } from './webviewHtml';

/**
 * Live split-preview editor for *.a2ui.json / *.a2ui.jsonl files: the JSON
 * stream renders as interactive surfaces and re-renders as you type.
 */
export class A2uiPreviewProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'a2ui.preview';

  static register(context: vscode.ExtensionContext, configService: ConfigService): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      A2uiPreviewProvider.viewType,
      new A2uiPreviewProvider(context, configService),
      { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: true }
    );
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService
  ) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): void {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    panel.webview.html = webviewHtml(panel.webview, this.context.extensionUri, 'editor');

    const update = () => {
      const allowUnknown = !!this.configService.effective().catalog;
      const extractor = new JsonStreamExtractor();
      const text = document.getText();
      const objects = [...extractor.push(text), ...extractor.finish()];
      panel.webview.postMessage({ type: 'resetSurfaces' });
      let valid = 0;
      for (const obj of objects) {
        const result = validateEnvelope(obj, { allowUnknownComponents: allowUnknown });
        if (result.ok) {
          valid++;
          void panel.webview.postMessage({ type: 'a2ui', envelope: obj });
        } else {
          void panel.webview.postMessage({ type: 'invalid', envelope: obj, errors: result.errors });
        }
      }
      void panel.webview.postMessage({
        type: 'status',
        state: 'idle',
        text: `${valid} message${valid === 1 ? '' : 's'} rendered · edits re-render live`
      });
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;
      clearTimeout(timer);
      timer = setTimeout(update, 250);
    });

    panel.webview.onDidReceiveMessage((msg) => {
      switch (msg?.type) {
        case 'ready':
          update();
          break;
        case 'openExternal':
          if (typeof msg.url === 'string' && /^https?:\/\//i.test(msg.url)) {
            void vscode.env.openExternal(vscode.Uri.parse(msg.url));
          }
          break;
      }
    });

    panel.onDidDispose(() => {
      clearTimeout(timer);
      changeSub.dispose();
    });
  }
}
