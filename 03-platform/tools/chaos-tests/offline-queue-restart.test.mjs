/**
 * @fileoverview Chaos test — offline audit queue survives process restart.
 *
 * Validates ADR-024 requirement: "records written before SIGKILL must be
 * available after restart". Simulates crash by stopping the queue process,
 * creating a fresh queue instance on the same directory, and verifying
 * that pending records drain in order.
 *
 * Gate: M2 Hardening — Global South Resilience cap lift.
 */

import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { createDiskQueue } from '../compliance-gateway/03-platform/src/disk-queue.mjs';

const FIXTURE_RECORDS = [
  { id: 'r-001', type: 'auth.success', tenantId: 'zw', signature: 'sig1' },
  { id: 'r-002', type: 'query.throttled', tenantId: 'zw', signature: 'sig2' },
  { id: 'r-003', type: 'auth.failure', tenantId: 'mz', signature: 'sig3' },
  { id: 'r-004', type: 'policy.adapted', tenantId: 'zw', signature: 'sig4' },
  { id: 'r-005', type: 'query.success', tenantId: 'bw', signature: 'sig5' },
];

describe('offline queue restart survival', () => {
  let queueDir;

  before(() => {
    queueDir = mkdtempSync(resolve(tmpdir(), 'gtcx-chaos-queue-'));
  });

  after(() => {
    try {
      rmSync(queueDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it('survives process restart and drains all queued records', async () => {
    const drained = [];
    const failingSink = {
      emit(record) {
        throw new Error('NATS is down');
      },
    };

    // Phase 1: enqueue records while sink is failing (simulates outage)
    const queue1 = createDiskQueue({
      dir: queueDir,
      drainIntervalMs: 100,
    });
    queue1.startDrain(failingSink);

    for (const record of FIXTURE_RECORDS) {
      queue1.enqueue(record);
    }

    // Allow a few drain attempts to fail
    await delay(350);
    queue1.stopDrain();

    const statsBeforeRestart = queue1.getStats();
    assert.ok(
      statsBeforeRestart.pendingRecords > 0 || statsBeforeRestart.pendingBytes > 0,
      'records should be pending in queue before restart',
    );

    // Phase 2: simulate process restart — new queue instance, same directory
    const workingSink = {
      emit(record) {
        drained.push(record);
      },
    };

    const queue2 = createDiskQueue({
      dir: queueDir,
      drainIntervalMs: 100,
    });
    queue2.startDrain(workingSink);

    // Wait for drain to complete
    await waitForDrain(queue2, { timeoutMs: 5000, intervalMs: 100 });
    queue2.stopDrain();

    // Phase 3: assertions
    assert.strictEqual(
      drained.length,
      FIXTURE_RECORDS.length,
      `expected ${FIXTURE_RECORDS.length} drained records, got ${drained.length}`,
    );

    for (let i = 0; i < FIXTURE_RECORDS.length; i++) {
      assert.deepStrictEqual(
        drained[i],
        FIXTURE_RECORDS[i],
        `record ${i} should match after restart drain`,
      );
    }

    const statsAfterDrain = queue2.getStats();
    assert.strictEqual(
      statsAfterDrain.pendingBytes,
      0,
      'queue should be empty after full drain',
    );
  });

  it('does not duplicate records when drain is interrupted mid-batch', async () => {
    const drained = [];
    let failAfter = 2;

    const flakySink = {
      emit(record) {
        if (failAfter-- > 0) {
          drained.push(record);
          return;
        }
        throw new Error('intermittent failure');
      },
    };

    const queue = createDiskQueue({
      dir: queueDir,
      drainIntervalMs: 50,
    });
    queue.startDrain(flakySink);

    // Enqueue 4 records
    for (let i = 0; i < 4; i++) {
      queue.enqueue({ id: `batch-${i}`, seq: i });
    }

    // Wait for first drain attempt (2 succeed, then failure)
    await delay(150);

    const statsMid = queue.getStats();
    assert.ok(statsMid.totalDrained >= 2, 'at least two records should have drained before failure');
    assert.ok(statsMid.totalFailed >= 1, 'at least one drain cycle should have failed');

    // Now restore the sink and let it complete
    failAfter = 999;
    await waitForDrain(queue, { timeoutMs: 5000, intervalMs: 50 });
    queue.stopDrain();

    const ids = drained.map((r) => r.id);
    const uniqueIds = [...new Set(ids)];
    assert.strictEqual(
      uniqueIds.length,
      ids.length,
      'no duplicate records should be drained',
    );
    assert.strictEqual(
      ids.length,
      4,
      'all 4 records should eventually drain',
    );
  });

  it('compacts queue file after full drain', async () => {
    const sink = {
      emit(record) {
        // success
      },
    };

    const queue = createDiskQueue({
      dir: queueDir,
      drainIntervalMs: 50,
    });
    queue.startDrain(sink);

    queue.enqueue({ id: 'compact-test' });
    await waitForDrain(queue, { timeoutMs: 2000, intervalMs: 50 });
    queue.stopDrain();

    const stats = queue.getStats();
    assert.strictEqual(stats.pendingBytes, 0, 'queue should be empty after drain');
  });
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDrain(queue, opts = {}) {
  const { timeoutMs = 5000, intervalMs = 100 } = opts;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const stats = queue.getStats();
    if (stats.pendingBytes === 0 && !stats.draining) {
      return;
    }
    await delay(intervalMs);
  }
  throw new Error(`Queue did not drain within ${timeoutMs}ms`);
}
