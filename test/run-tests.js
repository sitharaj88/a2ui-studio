// Self-contained test runner: transpiles src/a2ui.ts on the fly and exercises
// the JSON stream extractor and envelope validator. Run with `npm test`.
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'a2ui.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'ES2022' } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
const { JsonStreamExtractor, validateEnvelope } = mod.exports;

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

// 4. Incomplete JSON stays buffered
const ex3 = new JsonStreamExtractor();
check('partial buffered', ex3.push('{"version":"v0.9.1","createSurf').length === 0);
check('completes later', ex3.push('ace":{"surfaceId":"y","catalogId":"c"}}').length === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
