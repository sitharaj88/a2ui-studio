import * as vscode from 'vscode';
import { JsonStreamExtractor, validateEnvelope } from './a2ui';
import { ConfigService } from './config';

export interface A2uiPreviewSurfaceInput {
  jsonl: string;
  sourceName?: string;
}

class A2uiPreviewSurfaceTool implements vscode.LanguageModelTool<A2uiPreviewSurfaceInput> {
  constructor(private readonly configService: ConfigService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<A2uiPreviewSurfaceInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.PreparedToolInvocation> {
    const sourceName = options.input.sourceName?.trim() || 'Copilot Agent';
    return {
      invocationMessage: `Opening the A2UI Studio preview from ${sourceName}.`,
      confirmationMessages: {
        title: 'Open A2UI Studio preview',
        message: new vscode.MarkdownString(`Open the generated A2UI surface from **${sourceName}** in A2UI Studio?`)
      }
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<A2uiPreviewSurfaceInput>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (token.isCancellationRequested) {
      throw new Error('Opening the A2UI preview was cancelled.');
    }

    const jsonl = options.input.jsonl.trim();
    if (!jsonl) {
      throw new Error('The A2UI preview requires a non-empty JSONL stream.');
    }

    const extractor = new JsonStreamExtractor();
    const objects = [...extractor.push(jsonl), ...extractor.finish()];
    const allowUnknown = !!this.configService.effective().catalog;
    const validJsonl = objects
      .filter((object) => validateEnvelope(object, { allowUnknownComponents: allowUnknown }).ok)
      .map((object) => JSON.stringify(object))
      .join('\n');

    if (!validJsonl) {
      throw new Error('The supplied JSONL contains no valid A2UI messages.');
    }

    await vscode.commands.executeCommand(
      'a2ui.previewText',
      validJsonl,
      options.input.sourceName?.trim() || 'Copilot Agent'
    );

    const messageCount = validJsonl.split('\n').length;
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(
        `Opened A2UI Studio with ${messageCount} valid A2UI message${messageCount === 1 ? '' : 's'}.`
      )
    ]);
  }
}

export function registerA2uiPreviewTool(
  context: vscode.ExtensionContext,
  configService: ConfigService
): void {
  context.subscriptions.push(
    vscode.lm.registerTool('a2ui_preview_surface', new A2uiPreviewSurfaceTool(configService))
  );
}
