#!/usr/bin/env node
import { runAll, hasErrors } from './lib/check-domain.mjs';

const results = runAll();
let exit = 0;
for (const [domain, errors] of Object.entries(results)) {
  if (errors.length) {
    console.error(`workspace:${domain} FAILED`);
    for (const e of errors) console.error(`  - ${e}`);
    exit = 1;
  } else {
    console.log(`workspace:${domain} OK`);
  }
}
process.exit(exit);
