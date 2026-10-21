import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
const skillName = read('SKILL.md').match(/^name: *(.+)$/m)[1].trim();

// Plugin installs key their cache and update check on this version, so a
// release that forgets to bump it ships new files under the old version.
test('the plugin version is the newest released version in the changelog', () => {
  const released = read('CHANGELOG.md').match(/^## (\d+\.\d+\.\d+) - \d{4}-\d{2}-\d{2}$/m)[1];
  assert.equal(plugin.version, released);
});

// The root SKILL.md is the plugin's only skill; renaming one without the other
// changes the /horizons:horizons command every installed user types.
test('the plugin, its marketplace entry and the skill share one name', () => {
  assert.equal(plugin.name, skillName);
  assert.deepEqual(marketplace.plugins.map(entry => [entry.name, entry.source]), [[skillName, './']]);
});
