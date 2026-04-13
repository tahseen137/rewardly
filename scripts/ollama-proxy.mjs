#!/usr/bin/env node

/**
 * Ollama Auth Proxy
 *
 * Lightweight proxy that sits between Cloudflare Tunnel and Ollama,
 * adding API key authentication and basic rate limiting.
 *
 * Usage:
 *   OLLAMA_API_KEY=your-secret-key node scripts/ollama-proxy.mjs
 *
 * Environment variables:
 *   OLLAMA_API_KEY    - Required. Requests must send this in the Authorization header.
 *   OLLAMA_URL        - Ollama backend URL (default: http://localhost:11434)
 *   PROXY_PORT        - Port to listen on (default: 11435)
 *   RATE_LIMIT_RPM    - Max requests per minute per IP (default: 60)
 */

import http from 'node:http';

const CONFIG = {
  apiKey: process.env.OLLAMA_API_KEY,
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  port: parseInt(process.env.PROXY_PORT || '11435'),
  rateLimitRpm: parseInt(process.env.RATE_LIMIT_RPM || '60'),
};

if (!CONFIG.apiKey) {
  console.error('FATAL: OLLAMA_API_KEY environment variable is required.');
  console.error('Usage: OLLAMA_API_KEY=your-secret-key node scripts/ollama-proxy.mjs');
  process.exit(1);
}

// ============================================================================
// Rate Limiter (sliding window per IP)
// ============================================================================

const rateLimits = new Map(); // ip -> { count, resetAt }

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= CONFIG.rateLimitRpm) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now > entry.resetAt) rateLimits.delete(ip);
  }
}, 300_000);

// ============================================================================
// Auth Check
// ============================================================================

function authenticateRequest(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return false;

  // Support both "Bearer <key>" and raw key
  const key = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return key === CONFIG.apiKey;
}

// ============================================================================
// Proxy Handler
// ============================================================================

const server = http.createServer(async (req, res) => {
  const clientIp = req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress;

  // CORS headers for edge function calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check (no auth required)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', proxy: 'ollama-auth-proxy' }));
    return;
  }

  // Auth check
  if (!authenticateRequest(req)) {
    console.log(`[${new Date().toISOString()}] AUTH DENIED from ${clientIp} ${req.method} ${req.url}`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized. Provide Authorization: Bearer <api-key>' }));
    return;
  }

  // Rate limit check
  if (!checkRateLimit(clientIp)) {
    console.log(`[${new Date().toISOString()}] RATE LIMITED ${clientIp}`);
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }));
    return;
  }

  // Proxy to Ollama using http.request (works on all Node versions)
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    console.log(`[${new Date().toISOString()}] ${clientIp} ${req.method} ${req.url} (${body.length}B)`);

    const target = new URL(`${CONFIG.ollamaUrl}${req.url}`);

    const proxyReq = http.request(
      {
        hostname: target.hostname,
        port: target.port || 11434,
        path: target.pathname + target.search,
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Content-Length': body.length,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        });
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] PROXY ERROR: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Failed to reach Ollama backend' }));
    });

    if (body.length > 0) {
      proxyReq.write(body);
    }
    proxyReq.end();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] PROXY ERROR: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'Failed to reach Ollama backend' }));
  }
});

server.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`Ollama Auth Proxy listening on port ${CONFIG.port}`);
  console.log(`Proxying to: ${CONFIG.ollamaUrl}`);
  console.log(`Rate limit: ${CONFIG.rateLimitRpm} req/min per IP`);
  console.log(`Auth: API key required (Authorization: Bearer <key>)`);
  console.log(`Health: http://localhost:${CONFIG.port}/health`);
});
