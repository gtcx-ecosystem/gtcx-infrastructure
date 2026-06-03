#!/usr/bin/env node
/**
 * @fileoverview NATS JetStream integration test for audit-flush.
 *
 * Spins up the docker-compose test broker, publishes one signed record
 * to gtcx.audit.compliance-gateway.integration-test, asserts a durable
 * consumer reads it back, verifies the chain, and tears down.
 *
 * Exit codes:
 *   0 — success
 *   1 — test assertion failure
 *   2 — broker unreachable / setup failure
 *
 * Invoked from validate.sh --full as a gate.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateKeyPair,
  createChain,
  createRecord,
  append,
  verifyChain,
  fromNdjson,
} from '@gtcx/audit-signer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const COMPOSE_FILE = resolve(__dirname, 'docker-compose.test.yml');
const NATS_URL = 'nats://127.0.0.1:14222';
const SUBJECT = 'gtcx.audit.compliance-gateway.integration-test';
const STREAM_NAME = 'gtcx-audit-integration';
const DURABLE_NAME = 'audit-flush-integration';

function log(msg) {
  process.stdout.write(`[nats-integration] ${msg}\n`);
}

function fail(msg, code = 1) {
  process.stderr.write(`[nats-integration] FAIL: ${msg}\n`);
  process.exit(code);
}

function compose(args, ignoreFailure = false) {
  const res = spawnSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
  if (res.status !== 0 && !ignoreFailure) {
    fail(`docker compose ${args.join(' ')} exited ${res.status}`, 2);
  }
  return res.status;
}

async function waitForBroker() {
  const natsMod = await import('nats');
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const nc = await natsMod.connect({ servers: NATS_URL, timeout: 2000 });
      await nc.flush();
      await nc.close();
      log('broker reachable');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  fail('broker not reachable after 30s', 2);
}

async function setupStream(natsMod) {
  const nc = await natsMod.connect({ servers: NATS_URL });
  const jsm = await nc.jetstreamManager();
  try {
    await jsm.streams.delete(STREAM_NAME);
  } catch { /* not exists */ }
  await jsm.streams.add({
    name: STREAM_NAME,
    subjects: ['gtcx.audit.>'],
    storage: 'file',
    retention: 'limits',
    max_age: 5 * 60 * 1_000_000_000, // 5 min, in nanoseconds
  });
  await jsm.consumers.add(STREAM_NAME, {
    durable_name: DURABLE_NAME,
    ack_policy: 'explicit',
    deliver_policy: 'all',
  });
  log('stream + consumer ready');
  return nc;
}

async function publishSignedRecord(nc) {
  const { privateKey, publicKey } = generateKeyPair();
  const chain = createChain();
  const record = createRecord({
    actor: 'integration-test',
    action: 'query:success',
    target: 'roundtrip',
    payload: { tenantId: 'integration-test' },
  });
  const signed = append(chain, record, privateKey, publicKey);
  nc.publish(SUBJECT, JSON.stringify(signed));
  await nc.flush();
  log(`published record id=${signed.id}`);
  return signed;
}

async function consumeAndVerify(natsMod, expectedRecord) {
  const nc = await natsMod.connect({ servers: NATS_URL });
  const js = nc.jetstream();
  const consumer = await js.consumers.get(STREAM_NAME, DURABLE_NAME);
  const iter = await consumer.consume({ max_messages: 1 });

  const deadline = Date.now() + 10_000;
  for await (const m of iter) {
    const body = m.data.toString('utf-8');
    const parsed = JSON.parse(body);
    if (parsed.id !== expectedRecord.id) {
      m.nak();
      fail(`mismatched record id: got ${parsed.id}, expected ${expectedRecord.id}`);
    }
    m.ack();

    const reconstructed = fromNdjson(JSON.stringify(parsed));
    const verification = verifyChain(reconstructed);
    if (!verification.valid) {
      fail(`reconstructed chain verification failed: ${verification.reason}`);
    }
    log(`record verified: id=${parsed.id}`);
    await iter.stop();
    await nc.close();
    return;
    /* eslint-disable-next-line no-unreachable */
    if (Date.now() > deadline) {
      fail('timeout waiting for record');
    }
  }
}

async function main() {
  log('starting docker compose');
  compose(['up', '-d']);

  try {
    await waitForBroker();
    const natsMod = await import('nats');
    const nc = await setupStream(natsMod);
    const signed = await publishSignedRecord(nc);
    await nc.close();
    await consumeAndVerify(natsMod, signed);
    log('integration test passed');
  } finally {
    log('tearing down docker compose');
    compose(['down', '--volumes'], true);
  }
}

main().catch((err) => fail(err.message ?? String(err)));
