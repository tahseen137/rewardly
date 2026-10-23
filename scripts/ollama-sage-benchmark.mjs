#!/usr/bin/env node

/**
 * Ollama Sage Benchmark
 *
 * Load-tests a Gemma model on Ollama to determine if it can handle
 * concurrent Sage users for the Rewardly app.
 *
 * Usage:
 *   node scripts/ollama-sage-benchmark.mjs --url http://192.168.2.188:11434
 *   node scripts/ollama-sage-benchmark.mjs --url http://localhost:11434 --model gemma3:9b
 *   node scripts/ollama-sage-benchmark.mjs --url http://192.168.2.188:11434 --levels 1,5,10,50 --format json
 */

import os from 'node:os';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: null, // auto-detect first gemma model
  concurrencyLevels: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  requestTimeout: 180_000,
  warmupRequests: 2,
  cooldownMs: 2000,
  maxOutputTokens: 1024,
  temperature: 0.7,
  think: false, // disable thinking for Sage (faster, no reasoning overhead)
  targetTtfb: 400,
  targetTotalTime: 3000,
  targetErrorRate: 0.01,
  format: 'text',
  output: null,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--url' && next) { config.baseUrl = next; i++; }
    else if (arg === '--model' && next) { config.model = next; i++; }
    else if (arg === '--levels' && next) {
      config.concurrencyLevels = next.split(',').map(Number).filter(n => n > 0);
      i++;
    }
    else if (arg === '--format' && next) { config.format = next; i++; }
    else if (arg === '--output' && next) { config.output = next; i++; }
    else if (arg === '--timeout' && next) { config.requestTimeout = parseInt(next); i++; }
    else if (arg === '--think') { config.think = true; }
    else if (arg === '--no-think') { config.think = false; }
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Ollama Sage Benchmark - Load test Gemma for Rewardly Sage

Usage: node scripts/ollama-sage-benchmark.mjs [options]

Options:
  --url <url>         Ollama base URL (default: http://localhost:11434)
  --model <name>      Model name (default: auto-detect first gemma model)
  --levels <list>     Comma-separated concurrency levels (default: 1,5,10,25,50,100,250,500,1000)
  --format <fmt>      Output format: text or json (default: text)
  --output <file>     Write JSON results to file
  --timeout <ms>      Request timeout in ms (default: 180000)
  --think             Enable model thinking/reasoning (slower, more thorough)
  --no-think          Disable thinking (default, faster for Sage)
  --help              Show this help
`);
      process.exit(0);
    }
  }

  return config;
}

// ============================================================================
// Sage-Realistic Prompt Data
// ============================================================================

const SYSTEM_PROMPT = `You are Sage, a friendly credit card rewards expert helping users in Canada maximize their rewards.

## User's Card Portfolio
- American Express Cobalt Card (Amex) - Amex Membership Rewards (points worth ~2.1c each via transfer to Aeroplan)
  Rewards: Base: 1x points; Bonuses: Groceries: 5x points, Dining: 5x points, Streaming: 3x points, Transit: 2x points, Gas: 2x points

- TD Aeroplan Visa Infinite (TD) - Aeroplan (points worth ~2.0c each via Air Canada flights)
  Rewards: Base: 1x points; Bonuses: Gas: 1.5x points, Groceries: 1.5x points

- Scotiabank Gold American Express (Scotiabank) - Scene+ (points worth ~1.0c each via travel or groceries)
  Rewards: Base: 1x points; Bonuses: Dining: 5x points, Entertainment: 3x points, Groceries: 3x points

- CIBC Aventura Visa Infinite (CIBC) - Aventura (points worth ~1.0c each via travel bookings)
  Rewards: Base: 1x points; Bonuses: Travel: 2x points, Transit: 2x points

## User's Point Balances
- Aeroplan: 45,200 points
- Amex Membership Rewards: 23,800 points
- Scene+: 12,500 points

## User's Preferences
- Preferred reward type: points
- New card suggestions: enabled

## Canadian Point Valuations (use these for calculations)
- Aeroplan: 2.0c per point (transfers to Air Canada)
- Amex Membership Rewards: 2.1c per point (transfers to Aeroplan, Marriott, others)
- TD Rewards: 0.5c per point (travel portal or statement credit)
- RBC Avion: 2.1c per point (travel bookings)
- CIBC Aventura: 1.0c per point (travel or cash back)
- Scene+: 1.0c per point (movies, travel, groceries)
- PC Optimum: 0.1c per point (groceries and gas)

## Your Style
- Be concise: Keep responses to 2-3 short paragraphs max
- Show the math: When recommending a card, calculate the return (e.g., "5x points x 2.1c = 10.5% back")
- Be specific: Name the exact card and category bonus
- Be helpful: Explain WHY it's the best choice in one sentence

## Response Format
1. Answer the question directly (1-2 sentences)
2. Show the calculation if it's a card recommendation
3. Add one insight if relevant

Keep it short, show the math, be their rewards buddy.`;

const USER_MESSAGES = [
  // Category-specific (from SageScreen categoryChips)
  "What's my best card for groceries?",
  "What's my best card for dining?",
  "What's my best card for gas?",
  "What's my best card for travel?",
  "What's my best card for online shopping?",
  "What's my best card for entertainment?",
  "What's my best card for pharmacy?",
  "What's my best card for home improvement?",
  // Quick actions (from SageService QUICK_ACTIONS)
  "What's my best card for dining and restaurants?",
  "Which card should I use for grocery shopping?",
  "What's the best card in my wallet for travel purchases?",
  "Compare all my cards side-by-side and show me which is best for each category.",
  "Compare my Cobalt vs Gold card - which one is better overall?",
  "What's the best way to redeem my points for maximum value?",
  // Suggested prompts (from SageScreen WelcomeScreen)
  "How can I fly to London for free?",
  "What's the best card for Costco?",
  "Should I get the Cobalt or Gold card?",
  "How do I maximize my grocery rewards?",
  "What cards have welcome bonuses right now?",
  // Spending-specific
  "I'm spending $200 at Costco this weekend, which card?",
  "What card should I use for a $3000 flight to Tokyo?",
  "Best card for a $150 dinner tonight?",
  "I need to fill up gas, probably $80 - which card?",
  "Buying a $500 laptop online, which card is best?",
  // Redemption & strategy
  "How should I use my 45,000 Aeroplan points?",
  "Is it better to transfer Amex points to Aeroplan or Marriott?",
  "What's my total rewards balance worth in dollars?",
  "Should I cancel my CIBC Aventura card or keep it?",
  "What new card should I get next to fill gaps in my wallet?",
];

// Conversation history samples for multi-turn simulation
const HISTORY_SAMPLES = [
  [
    { role: 'user', content: "What's my best card for groceries?" },
    { role: 'assistant', content: "Your Amex Cobalt Card is the clear winner for groceries with 5x points. At 2.1c per point, that's 5 x 2.1c = 10.5% back on every grocery purchase. Your TD Aeroplan Visa earns 1.5x (3.0%) and Scotia Gold earns 3x Scene+ (3.0%), so Cobalt dominates." },
  ],
  [
    { role: 'user', content: 'Compare my cards for dining.' },
    { role: 'assistant', content: "For dining, it's a tie between two strong cards:\n\n1. Amex Cobalt: 5x MR = 10.5% back (5 x 2.1c)\n2. Scotia Gold: 5x Scene+ = 5.0% back (5 x 1.0c)\n\nCobalt wins because MR points are worth more than double Scene+ points. Use Cobalt everywhere that accepts Amex, and Scotia Gold as your Visa backup." },
    { role: 'user', content: 'What about for a restaurant that only takes Visa?' },
    { role: 'assistant', content: "If the restaurant only takes Visa, use your TD Aeroplan Visa Infinite. It earns 1x Aeroplan (2.0c) = 2.0% back on dining, which beats your CIBC Aventura's 1x (1.0%). Scotia Gold earns 5x on dining but it's an Amex, so TD Aeroplan is your best Visa option here." },
  ],
];

function getRandomMessage() {
  const msg = USER_MESSAGES[Math.floor(Math.random() * USER_MESSAGES.length)];
  // Add random suffix to defeat caching
  const suffix = ` (ref: ${Math.floor(Math.random() * 10000)})`;
  return msg + suffix;
}

function getRandomHistory() {
  if (Math.random() < 0.4) return []; // 40% no history
  return HISTORY_SAMPLES[Math.floor(Math.random() * HISTORY_SAMPLES.length)];
}

// ============================================================================
// Statistics Utilities
// ============================================================================

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function formatMs(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function padRight(str, len) {
  return String(str).padEnd(len);
}

function padLeft(str, len) {
  return String(str).padStart(len);
}

// ============================================================================
// Core Request Functions
// ============================================================================

async function makeStreamingRequest(config, systemPrompt, userMessage, history, signal) {
  const start = performance.now();
  let ttfbFirst = 0;      // Time to first token (thinking or content)
  let ttfbContent = 0;    // Time to first actual content token (what user sees)
  let fullContent = '';
  let thinkingContent = '';
  let evalCount = 0;
  let evalDuration = 0;
  let promptEvalCount = 0;
  let promptEvalDuration = 0;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      options: {
        temperature: config.temperature,
        num_predict: config.maxOutputTokens,
      },
      think: config.think,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let gotFirstToken = false;
  let gotFirstContent = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        const hasThinking = chunk.message?.thinking;
        const hasContent = chunk.message?.content;

        // Track first token of any kind (thinking or content)
        if (!gotFirstToken && (hasThinking || hasContent)) {
          ttfbFirst = performance.now() - start;
          gotFirstToken = true;
        }

        // Track first actual content token (what user would see in streaming UI)
        if (!gotFirstContent && hasContent) {
          ttfbContent = performance.now() - start;
          gotFirstContent = true;
        }

        // Accumulate thinking tokens
        if (hasThinking) {
          thinkingContent += chunk.message.thinking;
        }

        // Accumulate content tokens
        if (hasContent) {
          fullContent += chunk.message.content;
        }

        if (chunk.done) {
          evalCount = chunk.eval_count || 0;
          evalDuration = chunk.eval_duration || 0;
          promptEvalCount = chunk.prompt_eval_count || 0;
          promptEvalDuration = chunk.prompt_eval_duration || 0;
        }
      } catch { /* partial JSON, skip */ }
    }
  }

  const totalTime = performance.now() - start;
  const tokensGenerated = evalCount || Math.ceil((fullContent.length + thinkingContent.length) / 4);
  const genSeconds = evalDuration > 0 ? evalDuration / 1e9 : (totalTime - ttfbFirst) / 1000;
  const tokensPerSecond = genSeconds > 0 ? tokensGenerated / genSeconds : 0;

  return {
    success: true,
    ttfb: ttfbFirst,
    ttfbContent: ttfbContent || ttfbFirst, // fallback if no separate content phase
    totalTime,
    tokensGenerated,
    promptTokens: promptEvalCount,
    tokensPerSecond,
    responseLength: fullContent.length,
    thinkingLength: thinkingContent.length,
    error: null,
    statusCode: response.status,
  };
}

async function makeNonStreamingRequest(config, systemPrompt, userMessage, history, signal) {
  const start = performance.now();

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.maxOutputTokens,
      },
      think: config.think,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const totalTime = performance.now() - start;

  const evalCount = data.eval_count || 0;
  const evalDuration = data.eval_duration || 0;
  const promptEvalCount = data.prompt_eval_count || 0;
  const content = data.message?.content || '';
  const thinking = data.message?.thinking || '';

  const tokensGenerated = evalCount || Math.ceil((content.length + thinking.length) / 4);
  const genSeconds = evalDuration > 0 ? evalDuration / 1e9 : totalTime / 1000;
  const tokensPerSecond = genSeconds > 0 ? tokensGenerated / genSeconds : 0;

  return {
    success: true,
    ttfb: totalTime, // no streaming, TTFB = total
    ttfbContent: totalTime,
    totalTime,
    tokensGenerated,
    promptTokens: promptEvalCount,
    tokensPerSecond,
    responseLength: content.length,
    thinkingLength: thinking.length,
    error: null,
    statusCode: response.status,
  };
}

async function safeFetch(fn, config, signal) {
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), config.requestTimeout);

    // Combine external signal with timeout
    if (signal) {
      signal.addEventListener('abort', () => ac.abort());
    }

    const history = getRandomHistory();
    const message = getRandomMessage();
    const result = await fn(config, SYSTEM_PROMPT, message, history, ac.signal);

    clearTimeout(timeout);
    return result;
  } catch (err) {
    const errorType = classifyError(err);
    return {
      success: false,
      ttfb: 0,
      ttfbContent: 0,
      totalTime: 0,
      tokensGenerated: 0,
      promptTokens: 0,
      tokensPerSecond: 0,
      responseLength: 0,
      thinkingLength: 0,
      error: errorType,
      statusCode: 0,
    };
  }
}

function classifyError(err) {
  const msg = err.message || String(err);
  if (err.name === 'AbortError' || msg.includes('abort')) return 'TIMEOUT';
  if (msg.includes('ECONNREFUSED')) return 'CONN_REFUSED';
  if (msg.includes('ECONNRESET') || msg.includes('socket')) return 'CONN_RESET';
  if (msg.includes('503')) return 'SERVER_OVERLOADED';
  if (msg.includes('500')) return 'SERVER_ERROR';
  if (msg.includes('HTTP')) return msg;
  return `ERROR: ${msg.slice(0, 80)}`;
}

// ============================================================================
// Concurrency Pool
// ============================================================================

async function runPool(tasks, concurrency) {
  const results = [];
  let idx = 0;
  let active = 0;

  return new Promise((resolve) => {
    function next() {
      while (active < concurrency && idx < tasks.length) {
        const taskIdx = idx++;
        active++;
        tasks[taskIdx]().then((result) => {
          results[taskIdx] = result;
          active--;
          if (results.filter(r => r !== undefined).length === tasks.length) {
            resolve(results);
          } else {
            next();
          }
        });
      }
    }
    next();
  });
}

// ============================================================================
// Phase 1: Connectivity & Model Discovery
// ============================================================================

async function checkConnectivity(config) {
  console.log('\n' + '='.repeat(70));
  console.log('  PHASE 1: Connectivity & Model Discovery');
  console.log('='.repeat(70));

  // Check Ollama is running
  let ollamaVersion = 'unknown';
  try {
    const resp = await fetch(config.baseUrl, { signal: AbortSignal.timeout(5000) });
    const text = await resp.text();
    ollamaVersion = text.trim() || 'running';
    console.log(`\n  Ollama status: ${ollamaVersion}`);
  } catch (err) {
    console.error(`\n  FATAL: Cannot reach Ollama at ${config.baseUrl}`);
    console.error(`  Error: ${err.message}`);
    console.error(`\n  Make sure Ollama is running and accessible from this machine.`);
    process.exit(1);
  }

  // List models
  let models = [];
  try {
    const resp = await fetch(`${config.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    models = data.models || [];
    console.log(`  Available models: ${models.map(m => m.name).join(', ') || 'none'}`);
  } catch (err) {
    console.error(`  Warning: Could not list models: ${err.message}`);
  }

  // Auto-detect model if not specified
  if (!config.model) {
    const gemmaModel = models.find(m => m.name.toLowerCase().includes('gemma'));
    if (gemmaModel) {
      config.model = gemmaModel.name;
      console.log(`  Auto-detected model: ${config.model}`);
    } else if (models.length > 0) {
      config.model = models[0].name;
      console.log(`  No Gemma model found. Using first available: ${config.model}`);
    } else {
      console.error(`\n  FATAL: No models available. Run: ollama pull gemma3`);
      process.exit(1);
    }
  } else {
    const exists = models.some(m => m.name === config.model || m.name.startsWith(config.model));
    if (!exists) {
      console.error(`\n  WARNING: Model "${config.model}" not found in available models.`);
      console.error(`  Available: ${models.map(m => m.name).join(', ')}`);
      console.error(`  Will attempt to use it anyway (Ollama may auto-pull).\n`);
    }
  }

  // Get model details
  let modelInfo = {};
  try {
    const resp = await fetch(`${config.baseUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: config.model }),
      signal: AbortSignal.timeout(10000),
    });
    modelInfo = await resp.json();
  } catch { /* non-fatal */ }

  // Print hardware info
  const cpus = os.cpus();
  const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
  const freeMem = (os.freemem() / (1024 ** 3)).toFixed(1);

  console.log('\n  --- Hardware ---');
  console.log(`  CPU: ${cpus[0]?.model || 'unknown'} (${cpus.length} cores)`);
  console.log(`  RAM: ${freeMem}GB free / ${totalMem}GB total`);
  console.log(`  Platform: ${os.platform()} ${os.arch()}`);

  if (modelInfo.details) {
    console.log('\n  --- Model ---');
    console.log(`  Name: ${config.model}`);
    if (modelInfo.details.parameter_size) console.log(`  Parameters: ${modelInfo.details.parameter_size}`);
    if (modelInfo.details.quantization_level) console.log(`  Quantization: ${modelInfo.details.quantization_level}`);
    if (modelInfo.details.family) console.log(`  Family: ${modelInfo.details.family}`);
  }

  // Query remote hardware info via Ollama ps endpoint
  let remoteInfo = '';
  try {
    const resp = await fetch(`${config.baseUrl}/api/ps`, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    if (data.models?.[0]) {
      const m = data.models[0];
      const sizeMB = m.size ? (m.size / (1024 ** 2)).toFixed(0) : '?';
      const vramMB = m.size_vram ? (m.size_vram / (1024 ** 2)).toFixed(0) : '?';
      remoteInfo = `  Model loaded: ${sizeMB}MB total, ${vramMB}MB in VRAM`;
    }
  } catch { /* non-fatal */ }
  if (remoteInfo) console.log(remoteInfo);

  console.log('\n  --- Benchmark Config ---');
  console.log(`  Target TTFB: <${config.targetTtfb}ms`);
  console.log(`  Target total: <${config.targetTotalTime}ms`);
  console.log(`  Thinking: ${config.think ? 'ENABLED (slower, model reasons before answering)' : 'DISABLED (faster, recommended for Sage)'}`);
  console.log(`  Concurrency levels: ${config.concurrencyLevels.join(', ')}`);
  console.log(`  Request timeout: ${config.requestTimeout / 1000}s`);

  return { ollamaVersion, modelInfo, hardware: { cpu: cpus[0]?.model, cores: cpus.length, totalMem, freeMem } };
}

// ============================================================================
// Phase 2: Baseline
// ============================================================================

async function runBaseline(config) {
  console.log('\n' + '='.repeat(70));
  console.log('  PHASE 2: Single-Request Baseline');
  console.log('='.repeat(70));

  // Warmup
  console.log(`\n  Warming up (${config.warmupRequests} requests)...`);
  for (let i = 0; i < config.warmupRequests; i++) {
    await safeFetch(makeStreamingRequest, config);
    process.stdout.write('.');
  }
  console.log(' done');

  // Streaming baseline
  console.log('  Running streaming baseline (3 requests)...');
  const streamResults = [];
  for (let i = 0; i < 3; i++) {
    const r = await safeFetch(makeStreamingRequest, config);
    streamResults.push(r);
    if (r.success) {
      process.stdout.write(`. (${formatMs(r.totalTime)}) `);
    } else {
      process.stdout.write(`x (${r.error}) `);
    }
  }
  console.log();

  // Non-streaming baseline
  console.log('  Running non-streaming baseline (3 requests)...');
  const nonStreamResults = [];
  for (let i = 0; i < 3; i++) {
    const r = await safeFetch(makeNonStreamingRequest, config);
    nonStreamResults.push(r);
    if (r.success) {
      process.stdout.write(`. (${formatMs(r.totalTime)}) `);
    } else {
      process.stdout.write(`x (${r.error}) `);
    }
  }
  console.log();

  const streamOk = streamResults.filter(r => r.success);
  const nonStreamOk = nonStreamResults.filter(r => r.success);

  function summarize(results) {
    if (results.length === 0) return { avgTtfb: 0, avgTtfbContent: 0, avgTotal: 0, avgTokens: 0, avgTps: 0, avgLen: 0, avgThinkLen: 0 };
    return {
      avgTtfb: mean(results.map(r => r.ttfb)),
      avgTtfbContent: mean(results.map(r => r.ttfbContent || r.ttfb)),
      avgTotal: mean(results.map(r => r.totalTime)),
      avgTokens: mean(results.map(r => r.tokensGenerated)),
      avgTps: mean(results.map(r => r.tokensPerSecond)),
      avgLen: mean(results.map(r => r.responseLength)),
      avgThinkLen: mean(results.map(r => r.thinkingLength || 0)),
    };
  }

  const streamSummary = summarize(streamOk);
  const nonStreamSummary = summarize(nonStreamOk);

  console.log('\n  ' + '-'.repeat(66));
  console.log('  ' + padRight('Mode', 14) + padLeft('Avg TTFB', 12) + padLeft('Avg Total', 12) +
    padLeft('Avg Tokens', 12) + padLeft('Tok/sec', 10) + padLeft('Resp Len', 10));
  console.log('  ' + '-'.repeat(66));
  console.log('  ' + padRight('Streaming', 14) +
    padLeft(formatMs(streamSummary.avgTtfb), 12) +
    padLeft(formatMs(streamSummary.avgTotal), 12) +
    padLeft(Math.round(streamSummary.avgTokens), 12) +
    padLeft(streamSummary.avgTps.toFixed(1), 10) +
    padLeft(Math.round(streamSummary.avgLen), 10));
  console.log('  ' + padRight('Non-stream', 14) +
    padLeft(formatMs(nonStreamSummary.avgTtfb), 12) +
    padLeft(formatMs(nonStreamSummary.avgTotal), 12) +
    padLeft(Math.round(nonStreamSummary.avgTokens), 12) +
    padLeft(nonStreamSummary.avgTps.toFixed(1), 10) +
    padLeft(Math.round(nonStreamSummary.avgLen), 10));
  console.log('  ' + '-'.repeat(66));

  const ttfbOk = streamSummary.avgTtfb < config.targetTtfb;
  const totalOk = streamSummary.avgTotal < config.targetTotalTime;
  console.log(`\n  TTFB vs target (${config.targetTtfb}ms): ${ttfbOk ? 'PASS' : 'FAIL'} (${formatMs(streamSummary.avgTtfb)})`);
  console.log(`  Total vs target (${formatMs(config.targetTotalTime)}): ${totalOk ? 'PASS' : 'FAIL'} (${formatMs(streamSummary.avgTotal)})`);

  if (!ttfbOk || !totalOk) {
    console.log('\n  NOTE: Single-request already exceeds Gemini targets.');
    console.log('  This is expected for local LLM inference. Continuing benchmark...');
  }

  return { streaming: streamSummary, nonStreaming: nonStreamSummary, streamResults: streamOk, nonStreamResults: nonStreamOk };
}

// ============================================================================
// Phase 3: Concurrency Ramp
// ============================================================================

async function runConcurrencyLevel(config, concurrency) {
  // Use fewer requests at high concurrency to keep runtime practical
  // Low concurrency: enough samples for stable stats. High: one batch is enough.
  const requestCount = concurrency <= 10 ? Math.max(concurrency * 3, 10)
    : concurrency <= 100 ? Math.max(concurrency, 20)
    : concurrency; // at 250+, one full batch is sufficient

  const tasks = Array.from({ length: requestCount }, () => {
    return () => safeFetch(makeStreamingRequest, config);
  });

  const wallStart = performance.now();
  const results = await runPool(tasks, concurrency);
  const wallTime = performance.now() - wallStart;

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);

  const errorBreakdown = {};
  for (const f of failures) {
    errorBreakdown[f.error] = (errorBreakdown[f.error] || 0) + 1;
  }

  const ttfbs = successes.map(r => r.ttfb).sort((a, b) => a - b);
  const totals = successes.map(r => r.totalTime).sort((a, b) => a - b);
  const tps = successes.map(r => r.tokensPerSecond).sort((a, b) => a - b);
  const tokens = successes.map(r => r.tokensGenerated);

  const mem = process.memoryUsage();

  return {
    concurrency,
    requestCount,
    wallTimeMs: wallTime,
    successCount: successes.length,
    errorCount: failures.length,
    errorRate: failures.length / requestCount,
    errorBreakdown,
    throughput: successes.length / (wallTime / 1000),
    ttfb: {
      avg: mean(ttfbs), p50: percentile(ttfbs, 50), p95: percentile(ttfbs, 95), p99: percentile(ttfbs, 99),
      min: ttfbs[0] || 0, max: ttfbs[ttfbs.length - 1] || 0,
    },
    totalTime: {
      avg: mean(totals), p50: percentile(totals, 50), p95: percentile(totals, 95), p99: percentile(totals, 99),
      min: totals[0] || 0, max: totals[totals.length - 1] || 0,
    },
    tokensPerSec: {
      avg: mean(tps), p50: percentile(tps, 50), p95: percentile(tps, 95),
    },
    avgTokensGenerated: mean(tokens),
    heapMB: (mem.heapUsed / (1024 ** 2)).toFixed(1),
  };
}

async function runConcurrencyRamp(config) {
  console.log('\n' + '='.repeat(70));
  console.log('  PHASE 3: Concurrency Ramp');
  console.log('='.repeat(70));

  const allResults = [];

  for (const level of config.concurrencyLevels) {
    const reqCount = Math.max(level * 2, 20);
    console.log(`\n  --- Concurrency: ${level} (${reqCount} requests) ---`);

    const startTime = performance.now();
    const result = await runConcurrencyLevel(config, level);
    allResults.push(result);

    // Print per-level summary
    console.log(`  Completed in ${formatMs(result.wallTimeMs)} | ` +
      `${result.successCount}/${result.requestCount} OK | ` +
      `${(result.errorRate * 100).toFixed(1)}% errors | ` +
      `${result.throughput.toFixed(2)} req/s`);
    console.log(`  TTFB:  avg=${formatMs(result.ttfb.avg)} p50=${formatMs(result.ttfb.p50)} p95=${formatMs(result.ttfb.p95)} p99=${formatMs(result.ttfb.p99)}`);
    console.log(`  Total: avg=${formatMs(result.totalTime.avg)} p50=${formatMs(result.totalTime.p50)} p95=${formatMs(result.totalTime.p95)} p99=${formatMs(result.totalTime.p99)}`);
    console.log(`  Tok/s: avg=${result.tokensPerSec.avg.toFixed(1)} p50=${result.tokensPerSec.p50.toFixed(1)} | Heap: ${result.heapMB}MB`);

    if (Object.keys(result.errorBreakdown).length > 0) {
      console.log(`  Errors: ${Object.entries(result.errorBreakdown).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    }

    // Early termination
    if (result.errorRate > 0.5) {
      console.log(`\n  STOPPING: Error rate ${(result.errorRate * 100).toFixed(0)}% > 50% threshold. Server is saturated.`);
      break;
    }
    if (result.totalTime.p95 > 60000) {
      console.log(`\n  STOPPING: p95 latency ${formatMs(result.totalTime.p95)} > 60s. Server cannot keep up.`);
      break;
    }

    // Cooldown
    if (level !== config.concurrencyLevels[config.concurrencyLevels.length - 1]) {
      await new Promise(r => setTimeout(r, config.cooldownMs));
    }
  }

  return allResults;
}

// ============================================================================
// Phase 4: Summary & Verdict
// ============================================================================

function printSummary(config, meta, baseline, rampResults) {
  console.log('\n' + '='.repeat(70));
  console.log('  PHASE 4: Summary & Verdict');
  console.log('='.repeat(70));

  // Summary table
  const header = `  ${padRight('Conc', 6)}${padLeft('Req/s', 8)}${padLeft('TTFB p50', 10)}${padLeft('TTFB p95', 10)}${padLeft('Total p50', 11)}${padLeft('Total p95', 11)}${padLeft('Err %', 8)}${padLeft('Tok/s', 8)}`;
  console.log('\n' + header);
  console.log('  ' + '-'.repeat(header.length - 2));

  for (const r of rampResults) {
    const errPct = (r.errorRate * 100).toFixed(1) + '%';
    console.log(
      `  ${padRight(r.concurrency, 6)}` +
      `${padLeft(r.throughput.toFixed(2), 8)}` +
      `${padLeft(formatMs(r.ttfb.p50), 10)}` +
      `${padLeft(formatMs(r.ttfb.p95), 10)}` +
      `${padLeft(formatMs(r.totalTime.p50), 11)}` +
      `${padLeft(formatMs(r.totalTime.p95), 11)}` +
      `${padLeft(errPct, 8)}` +
      `${padLeft(r.tokensPerSec.avg.toFixed(1), 8)}`
    );
  }

  // Find max viable concurrency (strict: meets Gemini targets)
  let maxStrict = 0;
  for (const r of rampResults) {
    if (r.ttfb.p95 < config.targetTtfb &&
        r.totalTime.p95 < config.targetTotalTime &&
        r.errorRate < config.targetErrorRate) {
      maxStrict = r.concurrency;
    }
  }

  // Relaxed targets (2x Gemini latency, 5% error rate)
  let maxRelaxed = 0;
  for (const r of rampResults) {
    if (r.totalTime.p95 < config.targetTotalTime * 3 &&
        r.errorRate < 0.05) {
      maxRelaxed = r.concurrency;
    }
  }

  // Functional max (any success, <10s p95, <20% errors)
  let maxFunctional = 0;
  for (const r of rampResults) {
    if (r.totalTime.p95 < 10000 && r.errorRate < 0.20) {
      maxFunctional = r.concurrency;
    }
  }

  const baselineTps = baseline.streaming.avgTps;

  console.log('\n  ' + '='.repeat(66));
  console.log('  VERDICT');
  console.log('  ' + '='.repeat(66));

  if (maxStrict >= 1000) {
    console.log('\n  YES - Mac Mini CAN handle 1000 concurrent Sage users!');
    console.log(`  Meets Gemini-equivalent targets at 1000 concurrent.`);
  } else {
    console.log('\n  NO - Mac Mini CANNOT handle 1000 concurrent Sage users.');
    console.log(`\n  Capacity breakdown:`);
    console.log(`    Strict  (Gemini-equivalent: TTFB<${config.targetTtfb}ms, total<${formatMs(config.targetTotalTime)}, err<1%): ${maxStrict || '<1'} concurrent`);
    console.log(`    Relaxed (3x latency OK, err<5%):                                     ${maxRelaxed || '<1'} concurrent`);
    console.log(`    Functional (total<10s, err<20%):                                      ${maxFunctional || '<1'} concurrent`);
    console.log(`    Baseline throughput: ${baselineTps.toFixed(1)} tokens/sec`);

    const serversStrict = maxStrict > 0 ? Math.ceil(1000 / maxStrict) : '1000+';
    const serversRelaxed = maxRelaxed > 0 ? Math.ceil(1000 / maxRelaxed) : '1000+';

    console.log('\n  ' + '-'.repeat(66));
    console.log('  SCALING OPTIONS for 1000 concurrent users');
    console.log('  ' + '-'.repeat(66));

    console.log(`
  Option 1: Multiple Mac Minis (strict targets)
    Servers needed: ~${serversStrict}
    Each Mac Mini handles: ~${maxStrict || '<1'} concurrent users
    Requires: load balancer (nginx/HAProxy)

  Option 2: Multiple Mac Minis (relaxed targets)
    Servers needed: ~${serversRelaxed}
    Each Mac Mini handles: ~${maxRelaxed || '<1'} concurrent users
    Acceptable if users tolerate ~${formatMs(config.targetTotalTime * 3)} responses

  Option 3: Cloud GPU
    NVIDIA A100 80GB: ~50-100x faster than Mac Mini for LLM inference
    Estimate: 2-5 A100 instances could handle 1000 concurrent
    Providers: RunPod ($2/hr), Lambda, AWS p4d ($32/hr)
    Monthly cost: ~$1,500-$5,000

  Option 4: Smaller/Quantized Model
    If using a larger model, try a smaller variant:
    - 2B params: ~5-10x faster, lower quality
    - 4-bit quantization: ~2x faster, minimal quality loss
    Run this benchmark with --model gemma3:2b to compare

  Option 5: Stay with Gemini Flash (RECOMMENDED for 1000 users)
    Current cost: ~$0.10/1M input tokens, $0.40/1M output tokens
    1000 users x 10 msgs/day x 3K input + 500 output tokens
    = ~$0.45/day = ~$14/month
    Latency: ${config.targetTtfb}ms TTFB, ${formatMs(config.targetTotalTime)} total
    No infrastructure to manage`);
  }

  // Thermal degradation check
  if (rampResults.length >= 3) {
    const firstTps = rampResults[0].tokensPerSec.avg;
    const lastTps = rampResults[rampResults.length - 1].tokensPerSec.avg;
    if (lastTps < firstTps * 0.7 && lastTps > 0) {
      console.log(`\n  WARNING: Token throughput degraded ${((1 - lastTps / firstTps) * 100).toFixed(0)}% during benchmark`);
      console.log('  (from ' + firstTps.toFixed(1) + ' to ' + lastTps.toFixed(1) + ' tok/s)');
      console.log('  This may indicate thermal throttling on the Mac Mini.');
    }
  }

  console.log('\n' + '='.repeat(70));
}

function buildJsonReport(config, meta, baseline, rampResults) {
  // Find capacity levels
  let maxStrict = 0, maxRelaxed = 0, maxFunctional = 0;
  for (const r of rampResults) {
    if (r.ttfb.p95 < config.targetTtfb && r.totalTime.p95 < config.targetTotalTime && r.errorRate < config.targetErrorRate) maxStrict = r.concurrency;
    if (r.totalTime.p95 < config.targetTotalTime * 3 && r.errorRate < 0.05) maxRelaxed = r.concurrency;
    if (r.totalTime.p95 < 10000 && r.errorRate < 0.20) maxFunctional = r.concurrency;
  }

  return {
    meta: {
      model: config.model,
      ollamaVersion: meta.ollamaVersion,
      hardware: meta.hardware,
      timestamp: new Date().toISOString(),
      targets: { ttfbMs: config.targetTtfb, totalTimeMs: config.targetTotalTime, errorRate: config.targetErrorRate },
    },
    baseline: {
      streaming: baseline.streaming,
      nonStreaming: baseline.nonStreaming,
    },
    concurrency: Object.fromEntries(rampResults.map(r => [r.concurrency, r])),
    verdict: {
      canHandle1000: maxStrict >= 1000,
      maxConcurrencyStrict: maxStrict,
      maxConcurrencyRelaxed: maxRelaxed,
      maxConcurrencyFunctional: maxFunctional,
      serversNeededStrict: maxStrict > 0 ? Math.ceil(1000 / maxStrict) : null,
      serversNeededRelaxed: maxRelaxed > 0 ? Math.ceil(1000 / maxRelaxed) : null,
      baselineTokensPerSec: baseline.streaming.avgTps,
    },
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log('\n' + '='.repeat(70));
  console.log('  OLLAMA SAGE BENCHMARK');
  console.log('  Testing if Gemma can handle 1000 concurrent Rewardly Sage users');
  console.log('='.repeat(70));
  console.log(`  Target: ${config.baseUrl}`);
  console.log(`  Model:  ${config.model || 'auto-detect'}`);
  console.log(`  Date:   ${new Date().toISOString()}`);

  // Phase 1
  const meta = await checkConnectivity(config);

  // Phase 2
  const baseline = await runBaseline(config);

  // Phase 3
  const rampResults = await runConcurrencyRamp(config);

  // Phase 4
  printSummary(config, meta, baseline, rampResults);

  // JSON output
  if (config.format === 'json' || config.output) {
    const report = buildJsonReport(config, meta, baseline, rampResults);
    const json = JSON.stringify(report, null, 2);

    if (config.output) {
      const fs = await import('node:fs');
      fs.writeFileSync(config.output, json);
      console.log(`\n  JSON report saved to: ${config.output}`);
    }

    if (config.format === 'json') {
      console.log(json);
    }
  }

  console.log('\n  Benchmark complete.\n');
}

main().catch((err) => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
