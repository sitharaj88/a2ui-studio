import * as vscode from 'vscode';

/** Shared webview HTML for the studio panel and the custom preview editor. */
export function webviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  mode: 'studio' | 'editor'
): string {
  const uri = (...parts: string[]) =>
    webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', ...parts));
  const nonce = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:; media-src https: data:; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${uri('styles.css')}">
<title>A2UI Studio</title>
</head>
<body data-a2ui-mode="${mode}">
<div id="app"></div>
<script nonce="${nonce}" src="${uri('examples.js')}"></script>
<script nonce="${nonce}" src="${uri('main.js')}"></script>
</body>
</html>`;
}

/** Default values for the VS Code theme variables used by exported HTML. */
export const EXPORT_VSCODE_VARS = `:root{
--vscode-editor-background:#1e1e1e;--vscode-editor-foreground:#d4d4d4;
--vscode-descriptionForeground:#9d9d9d;--vscode-widget-border:#454545;
--vscode-editorWidget-background:#252526;--vscode-input-background:#3c3c3c;
--vscode-input-foreground:#cccccc;--vscode-input-border:#3c3c3c;
--vscode-focusBorder:#6c8eef;--vscode-errorForeground:#f48771;
--vscode-font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
--vscode-editor-font-family:ui-monospace,Menlo,Consolas,monospace;
--vscode-symbolIcon-propertyForeground:#7cacf8;
--vscode-debugTokenExpression-string:#ce9178;
--vscode-debugTokenExpression-number:#b5cea8;
--vscode-debugTokenExpression-boolean:#569cd6;
}
html,body{height:auto!important;overflow:auto!important;}
body{display:grid;place-items:start center;padding:44px 20px;min-height:100vh;}
`;
