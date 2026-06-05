#!/usr/bin/env node
import { copyFileSync, existsSync, lstatSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CHECK = process.argv.includes('--check');

const COPY_PAIRS = [['config/toolchain/turbo.json', 'turbo.json']];
const REEXPORT_STUBS = [
  {
    rel: 'tsconfig.json',
    content: `${JSON.stringify({ extends: './config/toolchain/tsconfig.base.json' }, null, 2)}\n`,
  },
];

function read(rel) {
  return readFileSync(join(REPO, rel), 'utf8');
}

let drift = 0;

for (const [from, to] of COPY_PAIRS) {
  if (!existsSync(join(REPO, from))) continue;
  const src = read(from);
  if (CHECK) {
    if (!existsSync(join(REPO, to)) || read(to) !== src) {
      console.log('DRIFT', to);
      drift++;
    }
    continue;
  }
  const dest = join(REPO, to);
  if (existsSync(dest) && lstatSync(dest).isSymbolicLink()) unlinkSync(dest);
  copyFileSync(join(REPO, from), dest);
}

for (const { rel, content } of REEXPORT_STUBS) {
  if (!existsSync(join(REPO, 'config/toolchain/tsconfig.base.json'))) continue;
  if (CHECK) {
    if (!existsSync(join(REPO, rel)) || read(rel) !== content) {
      console.log('DRIFT', rel);
      drift++;
    }
    continue;
  }
  writeFileSync(join(REPO, rel), content, 'utf8');
}

if (CHECK) {
  console.log(drift ? `\n${drift} root stub(s) need sync` : '\nOK — root stubs match config SoR');
  process.exit(drift ? 1 : 0);
}
console.log('sync-root-stubs OK');
