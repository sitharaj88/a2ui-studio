// Self-contained test runner: transpiles pure src modules on the fly and
// exercises the JSON stream extractor, envelope validator, surface linter and
// Claude request shaping. Run with `npm test`.
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

function load(file, stubs = {}) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'ES2022' } }).outputText;
  const mod = { exports: {} };
  const req = (name) => (name in stubs ? stubs[name] : name.startsWith('./') ? load(name.slice(2) + '.ts', stubs) : require(name));
  new Function('module', 'exports', 'require', js)(mod, mod.exports, req);
  return mod.exports;
}
const { JsonStreamExtractor, validateEnvelope, SurfaceTracker, childReferences } = load('a2ui.ts');
const { buildClaudeRequest, isLegacyClaude, supportsRefusalFallback, estimateClaudeCost } = load('claudeRequest.ts');
const { buildGlmRequest, parseGlmChunk, glmBaseUrl } = load('glm.ts');
const { matchCopilotModel } = load('providers.ts', { vscode: {}, '@anthropic-ai/sdk': class {} });

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) pass++;
  else {
    fail++;
    console.log('FAIL:', name);
  }
}

// 1. Clean JSONL split across arbitrary chunk boundaries
const stream = `{"version":"v0.9.1","createSurface":{"surfaceId":"s1","catalogId":"c"}}
{"version":"v0.9.1","updateComponents":{"surfaceId":"s1","components":[{"id":"root","component":"Column","children":["t"]},{"id":"t","component":"Text","text":"hi \\"quoted\\" {brace}"}]}}
{"version":"v0.9.1","updateDataModel":{"surfaceId":"s1","path":"/a","value":{"b":[1,2,3]}}}`;
for (const chunkSize of [1, 3, 7, 50, 10000]) {
  const ex = new JsonStreamExtractor();
  const objs = [];
  for (let i = 0; i < stream.length; i += chunkSize) objs.push(...ex.push(stream.slice(i, i + chunkSize)));
  objs.push(...ex.finish());
  check(`chunk=${chunkSize} count`, objs.length === 3);
  check(`chunk=${chunkSize} valid`, objs.every((o) => validateEnvelope(o).ok));
}

// 2. Markdown fences + prose around JSON
const messy = 'Here is your UI:\n```json\n{"version":"v0.9.1","createSurface":{"surfaceId":"x","catalogId":"c"}}\n```\nDone!';
const ex2 = new JsonStreamExtractor();
const objs2 = [...ex2.push(messy), ...ex2.finish()];
check('fenced extraction', objs2.length === 1 && objs2[0].createSurface.surfaceId === 'x');

// 3. Envelope validation
check('missing key invalid', !validateEnvelope({ foo: 1 }).ok);
check('two keys invalid', !validateEnvelope({ createSurface: { surfaceId: 'a', catalogId: 'c' }, deleteSurface: { surfaceId: 'a' } }).ok);
check('unknown component invalid', !validateEnvelope({ updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'FancyGrid' }] } }).ok);
check(
  'unknown component ok with custom catalog',
  validateEnvelope(
    { updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'FancyGrid' }] } },
    { allowUnknownComponents: true }
  ).ok
);
check('good deleteSurface valid', validateEnvelope({ deleteSurface: { surfaceId: 's' } }).ok);
check(
  'duplicate ids invalid',
  !validateEnvelope({ updateComponents: { surfaceId: 's', components: [{ id: 'a', component: 'Text' }, { id: 'a', component: 'Text' }] } }).ok
);
check(
  'card with children invalid',
  !validateEnvelope({ updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Card', children: ['x'] }] } }).ok
);
check(
  'button without child invalid',
  !validateEnvelope({ updateComponents: { surfaceId: 's', components: [{ id: 'b', component: 'Button' }] } }).ok
);

// 4. Incomplete JSON stays buffered
const ex3 = new JsonStreamExtractor();
check('partial buffered', ex3.push('{"version":"v0.9.1","createSurf').length === 0);
check('completes later', ex3.push('ace":{"surfaceId":"y","catalogId":"c"}}').length === 1);

// 5. Child references cover every structural property
check(
  'childReferences',
  JSON.stringify(
    childReferences({
      component: 'Modal', trigger: 't', content: 'c', child: 'k', children: { path: '/x', componentId: 'tpl' },
      tabs: [{ child: 'tab1' }], pages: [{ child: 'p1' }], steps: [{ child: 's1' }], items: [{ child: 'i1' }, { title: 'no child' }]
    })
  ) === JSON.stringify(['tpl', 'k', 't', 'c', 'tab1', 'p1', 's1', 'i1'])
);

// 6. Surface linter: cross-message structure
const tracker = new SurfaceTracker();
tracker.apply({ createSurface: { surfaceId: 'app', catalogId: 'c' } });
tracker.apply({ updateComponents: { surfaceId: 'app', components: [{ id: 'root', component: 'Column', children: ['title', 'missing'] }] } });
tracker.apply({ updateComponents: { surfaceId: 'app', components: [{ id: 'title', component: 'Text', text: 'hi' }] } });
const lint1 = tracker.lint();
check('lint dangling ref', lint1.length === 1 && lint1[0].includes('"missing"'));
check('lint is incremental', tracker.lint().length === 0);
tracker.apply({ updateComponents: { surfaceId: 'app', components: [{ id: 'missing', component: 'Text', text: 'now defined' }] } });
check('lint resolves once defined', tracker.lint().length === 0);
tracker.apply({ createSurface: { surfaceId: 'noroot', catalogId: 'c' } });
tracker.apply({ updateComponents: { surfaceId: 'noroot', components: [{ id: 'a', component: 'Text' }] } });
check('lint missing root', tracker.lint().some((e) => e.includes('"root"')));
tracker.apply({ updateComponents: { surfaceId: 'ghost', components: [{ id: 'root', component: 'Text' }] } });
check('lint orphan update', tracker.lint().some((e) => e.includes('without a preceding createSurface')));
tracker.apply({ deleteSurface: { surfaceId: 'ghost' } });
check('lint after delete', tracker.lint().length === 0);

// 7. Claude model-family detection
check('opus 5 current', !isLegacyClaude('claude-opus-5'));
check('sonnet 5 current', !isLegacyClaude('claude-sonnet-5'));
check('opus 4.8 current', !isLegacyClaude('claude-opus-4-8'));
check('sonnet 4.6 current', !isLegacyClaude('claude-sonnet-4-6'));
check('fable current', !isLegacyClaude('claude-fable-5-1'));
check('bedrock opus 5 current', !isLegacyClaude('anthropic.claude-opus-5'));
check('haiku 4.5 legacy', isLegacyClaude('claude-haiku-4-5'));
check('dated haiku 4.5 legacy', isLegacyClaude('claude-haiku-4-5-20251001'));
check('sonnet 4 dated legacy', isLegacyClaude('claude-sonnet-4-20250514'));
check('opus 4.1 legacy', isLegacyClaude('claude-opus-4-1-20250805'));
check('3.5 sonnet legacy', isLegacyClaude('claude-3-5-sonnet-20241022'));
check('3 opus legacy', isLegacyClaude('claude-3-opus-20240229'));
check('unknown alias current', !isLegacyClaude('my-gateway-alias'));
check('fallback opus 5', supportsRefusalFallback('claude-opus-5'));
check('no fallback sonnet 5', !supportsRefusalFallback('claude-sonnet-5'));

// 8. Claude request shaping
const history = [
  { role: 'system', content: 'SYSTEM' },
  { role: 'user', content: 'first' },
  { role: 'assistant', content: '{}' },
  { role: 'user', content: 'second' }
];
const opus = buildClaudeRequest({ model: 'claude-opus-5', messages: history, maxTokens: 16000, effort: 'xhigh', showThinking: true, refusalFallback: true, temperature: 0.7 });
check('opus: no temperature', opus.params.temperature === undefined);
check('opus: adaptive summarized', opus.params.thinking.type === 'adaptive' && opus.params.thinking.display === 'summarized');
check('opus: effort', opus.params.output_config.effort === 'xhigh');
check('opus: fallback default', opus.params.fallbacks === 'default' && opus.betas.includes('server-side-fallback-2026-07-01'));
check('opus: system cached', opus.params.system[0].text === 'SYSTEM' && opus.params.system[0].cache_control.type === 'ephemeral');
check('opus: no system role in messages', opus.params.messages.every((m) => m.role !== 'system'));
check('opus: last user cached', Array.isArray(opus.params.messages[2].content) && opus.params.messages[2].content[0].cache_control.type === 'ephemeral');
check('opus: earlier turns plain', typeof opus.params.messages[0].content === 'string');
check('opus: summary', opus.summary.includes('effort xhigh') && opus.summary.includes('refusal fallback'));

const sonnet = buildClaudeRequest({ model: 'claude-sonnet-5', messages: history, maxTokens: 8000, effort: 'medium', showThinking: false, refusalFallback: true });
check('sonnet: omitted thinking', sonnet.params.thinking.display === 'omitted');
check('sonnet: no fallback', sonnet.params.fallbacks === undefined && sonnet.betas.length === 0);

const haiku = buildClaudeRequest({ model: 'claude-haiku-4-5', messages: history, maxTokens: 4000, effort: 'high', showThinking: true, refusalFallback: true, temperature: 0.4 });
check('haiku: temperature kept', haiku.params.temperature === 0.4);
check('haiku: no thinking/effort', haiku.params.thinking === undefined && haiku.params.output_config === undefined);

// 9. Cost estimate
const cost = estimateClaudeCost('claude-sonnet-5', { input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 });
check('cost sonnet input', Math.abs(cost - 2) < 1e-9);
check('cost unknown model', estimateClaudeCost('mystery', { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 }) === undefined);

// 10. GLM request shaping
const glm = buildGlmRequest({ model: 'glm-5.3', messages: history, maxTokens: 200000, temperature: 1.4, reasoningEffort: 'high' });
check('glm: thinking on', glm.thinking.type === 'enabled' && glm.reasoning_effort === 'high' && glm.stream === true);
check('glm: system role preserved', glm.messages[0].role === 'system' && glm.messages.length === 4);
check('glm: temperature clamped', glm.temperature === 1);
check('glm: max_tokens clamped', glm.max_tokens === 131072);
check('glm: no temperature when unset', buildGlmRequest({ model: 'glm-5.3', messages: history, reasoningEffort: 'low' }).temperature === undefined);
check('glm: coding endpoint', glmBaseUrl('coding') === 'https://api.z.ai/api/coding/paas/v4');
check('glm: general endpoint', glmBaseUrl('general') === 'https://api.z.ai/api/paas/v4');
check('glm: override wins', glmBaseUrl('coding', 'https://open.bigmodel.cn/api/coding/paas/v4/') === 'https://open.bigmodel.cn/api/coding/paas/v4');
const chunk = parseGlmChunk({ choices: [{ delta: { content: '{"a":1}', reasoning_content: 'plan' } }] });
check('glm: parse chunk', chunk.text === '{"a":1}' && chunk.reasoning === 'plan');
check('glm: parse empty', JSON.stringify(parseGlmChunk({ choices: [{ delta: {} }] })) === '{}' && JSON.stringify(parseGlmChunk({})) === '{}');

// 11. Copilot model matching
const copilotModels = [
  { id: 'claude-opus-4.8', family: 'claude-opus-4.8', name: 'Claude Opus 4.8' },
  { id: 'gpt-5.4', family: 'gpt-5.4', name: 'GPT-5.4' },
  { id: 'gpt-5.4-mini', family: 'gpt-5.4-mini', name: 'GPT-5.4 mini' },
  { id: 'oswe-vscode-modelD', family: 'oswe-vscode-modelD', name: 'OSWE' }
];
check('copilot: exact family', matchCopilotModel(copilotModels, 'gpt-5.4').id === 'gpt-5.4');
check('copilot: exact by name, case-insensitive', matchCopilotModel(copilotModels, 'claude opus 4.8').id === 'claude-opus-4.8');
check('copilot: renamed family variant', matchCopilotModel(copilotModels, 'oswe-vscode').id === 'oswe-vscode-modelD');
check('copilot: longer request narrows to base', matchCopilotModel(copilotModels, 'oswe-vscode-modelD-preview').id === 'oswe-vscode-modelD');
check('copilot: ambiguous prefix refused', matchCopilotModel(copilotModels, 'gpt-5') === undefined);
check('copilot: unknown refused', matchCopilotModel(copilotModels, 'llama') === undefined);
check('copilot: empty refused', matchCopilotModel(copilotModels, '') === undefined);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
