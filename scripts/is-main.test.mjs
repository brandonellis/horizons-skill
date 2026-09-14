import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('CLI modules import without side effects from stdin and eval, including nonexistent argv paths', () => {
  const modules = ['roadmap-pipeline.mjs', 'package-skill.mjs', 'summarize-evals.mjs'];
  const source = modules.map(name => `await import(${JSON.stringify(new URL(name, import.meta.url).href)});`).join('\n') + '\nconsole.log("imported");';
  for (const args of [['--input-type=module', '-'], ['--input-type=module', '-e', source], ['--input-type=module', '-e', source, '/does-not-exist/horizons']]) {
    assert.equal(execFileSync(process.execPath, args, { input: source, encoding: 'utf8' }).trim(), 'imported');
  }
});
