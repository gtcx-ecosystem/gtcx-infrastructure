#!/usr/bin/env node
import { syncProductManagement } from './lib/pm-sync-core.mjs';

const backlog = syncProductManagement();
console.log(
  JSON.stringify(
    {
      ok: true,
      repo: backlog.repo,
      active: backlog.active?.storyId ?? null,
      storyCount: backlog.stories.length,
      crossRepoCount: backlog.crossRepoRefs.length,
      output: '02-ops/pm/backlog.json',
    },
    null,
    2,
  ),
);
