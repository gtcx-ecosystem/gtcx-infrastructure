#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const path = '02-ops/pm/backlog.json';
if (!existsSync(join(process.cwd(), path))) {
  console.error('pm:status — run pnpm pm:sync first');
  process.exit(1);
}
const b = JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'));
console.log(`repo: ${b.repo}`);
console.log(`updated: ${b.updated}`);
if (b.active) {
  console.log(`active: ${b.active.storyId} — ${b.active.title ?? ''} (${b.active.status})`);
} else {
  console.log('active: (none)');
}
const pending = b.stories.filter((s) => s.status === 'pending' || s.status === 'in_progress');
console.log(`backlog: ${pending.length} pending/in_progress of ${b.stories.length} parsed`);
if (b.crossRepoRefs?.length) {
  console.log(`cross-repo refs: ${b.crossRepoRefs.length}`);
}
