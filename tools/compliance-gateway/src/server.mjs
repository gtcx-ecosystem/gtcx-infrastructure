/**
 * @fileoverview AI Compliance Gateway Server
 *
 * Natural language interface to GTCX protocol handlers.
 * Routes compliance queries to the correct protocol endpoints
 * using Claude as the reasoning layer.
 *
 * Endpoints:
 *   POST /v1/query    — natural language compliance query
 *   GET  /health      — liveness
 *   GET  /v1/tools    — list available tools
 *
 * Environment:
 *   ANTHROPIC_API_KEY    — Claude API key
 *   PROTOCOL_BASE_URL    — Protocol service URL (default: cluster-internal)
 *   PORT                 — Server port (default: 8500)
 *   MODEL                — Claude model (default: claude-sonnet-4-20250514)
 */

import { createServer } from 'node:http';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { tools, toolCount } from './tools.mjs';
import { systemPrompt } from './system-prompt.mjs';

const PORT = Number(process.env.PORT ?? 8500);
const MODEL = process.env.MODEL ?? 'claude-sonnet-4-20250514';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

async function handleQuery(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = await readBody(req);
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' });
  }

  const { query, jurisdiction, context } = parsed;
  if (!query || typeof query !== 'string') {
    return sendJson(res, 400, { error: 'Missing "query" field' });
  }

  const userMessage = [
    query,
    jurisdiction ? `Jurisdiction: ${jurisdiction}` : '',
    context ? `Additional context: ${JSON.stringify(context)}` : '',
  ].filter(Boolean).join('\n');

  try {
    const result = await generateText({
      model: anthropic(MODEL),
      system: systemPrompt,
      prompt: userMessage,
      tools,
      maxSteps: 5,
      temperature: 0,
    });

    const toolCalls = result.steps
      .flatMap((step) => step.toolCalls || [])
      .map((call) => ({
        tool: call.toolName,
        args: call.args,
      }));

    const toolResults = result.steps
      .flatMap((step) => step.toolResults || [])
      .map((r) => ({
        tool: r.toolName,
        result: r.result,
      }));

    sendJson(res, 200, {
      answer: result.text,
      toolCalls,
      toolResults,
      model: MODEL,
      usage: result.usage,
    });
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      type: 'compliance-gateway.query.failed',
      error: err?.message,
      query: query.substring(0, 200),
    }));
    sendJson(res, 500, { error: 'Query failed', detail: err?.message });
  }
}

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url ?? '/';
    if (url === '/v1/query') {
      await handleQuery(req, res);
    } else if (url === '/health') {
      sendJson(res, 200, { status: 'healthy', tools: toolCount, model: MODEL });
    } else if (url === '/v1/tools') {
      sendJson(res, 200, {
        count: toolCount,
        tools: Object.entries(tools).map(([name, t]) => ({
          name,
          description: t.description,
        })),
      });
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', message: err?.message }));
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(JSON.stringify({
    level: 'info',
    message: 'Compliance Gateway listening',
    port: PORT,
    tools: toolCount,
    model: MODEL,
  }));
});

export { server };
