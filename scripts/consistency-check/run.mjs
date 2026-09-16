#!/usr/bin/env node
// Consistency check between components/Preview.tsx and utils/daxGenerator.ts
// (see scripts/consistency-check/config.mjs for the full design writeup).
//
// Usage:
//   node scripts/consistency-check/run.mjs --staged        (pre-commit hook)
//   node scripts/consistency-check/run.mjs --range <ref>   (CI: diff against <ref>...HEAD)
//
// Exit codes: 0 = pass/warn/skip, 1 = block.
// Never blocks due to the TypeSafe API being unreachable — fails open.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WATCHED_FILES, SIDES, REGIONS, QUESTIONS, THRESHOLDS, CACHE_PATH, API_TIMEOUT_MS } from './config.mjs';
import { buildBundle } from './extract.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function sh(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function getChangedFiles() {
  const args = process.argv.slice(2);
  const rangeIdx = args.indexOf('--range');
  if (rangeIdx !== -1 && args[rangeIdx + 1]) {
    const ref = args[rangeIdx + 1];
    return sh(`git diff --name-only ${ref}...HEAD`).split('\n').filter(Boolean);
  }
  // default: --staged
  return sh('git diff --cached --name-only').split('\n').filter(Boolean);
}

function log(msg) {
  process.stdout.write(`[typesafe-consistency] ${msg}\n`);
}

function readWatchedFiles() {
  const contents = {};
  for (const rel of WATCHED_FILES) {
    const abs = path.join(REPO_ROOT, rel);
    if (existsSync(abs)) contents[rel] = readFileSync(abs, 'utf8');
  }
  return contents;
}

function hashBundle(bundle) {
  return createHash('sha256').update(JSON.stringify(bundle)).digest('hex');
}

function readCache() {
  const abs = path.join(REPO_ROOT, CACHE_PATH);
  if (!existsSync(abs)) return null;
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(entry) {
  writeFileSync(path.join(REPO_ROOT, CACHE_PATH), JSON.stringify(entry, null, 2));
}

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TypeSafe request timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function evaluateNoul(name, value) {
  const t = THRESHOLDS[name];
  if (value <= t.block_max) return { level: 'block', reason: `${name}=${value.toFixed(2)} (confidently mismatched)` };
  if (value <= t.warn_max) return { level: 'warn', reason: `${name}=${value.toFixed(2)} (leaning mismatched, not confident)` };
  return { level: 'pass', reason: `${name}=${value.toFixed(2)}` };
}

function evaluateScore(name, score, confidence) {
  const t = THRESHOLDS[name];
  if (score >= t.block_min_score && confidence >= t.block_min_confidence) {
    return { level: 'block', reason: `${name}=${score.toFixed(2)} confidence=${confidence.toFixed(2)}` };
  }
  if (score >= t.warn_min_score || (score >= t.block_min_score && confidence < t.block_min_confidence)) {
    return { level: 'warn', reason: `${name}=${score.toFixed(2)} confidence=${confidence.toFixed(2)} (below block confidence bar)` };
  }
  return { level: 'pass', reason: `${name}=${score.toFixed(2)} confidence=${confidence.toFixed(2)}` };
}

async function main() {
  const changed = getChangedFiles();
  const relevant = changed.filter((f) => WATCHED_FILES.includes(f));

  if (relevant.length === 0) {
    log('no watched files changed, skipping');
    return 0;
  }

  log(`relevant files changed: ${relevant.join(', ')}`);

  const contents = readWatchedFiles();
  const { bundle, missing } = buildBundle(contents, SIDES, REGIONS);

  if (missing.length > 0) {
    log(`BLOCK: region(s) missing entirely on one side: ${missing.join(', ')}`);
    log('A whole feature region disappeared from one file without a counterpart change on the other side.');
    log('If this is intentional (e.g. removing a feature from both), update the TS-CONSISTENCY sentinels accordingly.');
    return 1;
  }

  const hash = hashBundle(bundle);
  const cache = readCache();
  if (cache && cache.hash === hash && cache.verdict === 'pass') {
    log('unchanged since last successful check, skipping API call');
    return 0;
  }

  let response;
  try {
    const { TypeSafeClient } = await import('@typesafe-ai/sdk');
    const client = new TypeSafeClient();
    response = await withTimeout(
      client.systemOne({
        state: bundle,
        questions: {
          visualTypesMatch: QUESTIONS.visualTypesMatch,
          fieldsMatch: QUESTIONS.fieldsMatch,
          aggregationLogicMatch: QUESTIONS.aggregationLogicMatch,
          regressionRisk: QUESTIONS.regressionRisk,
        },
      }),
      API_TIMEOUT_MS
    );
  } catch (err) {
    log(`WARNING: TypeSafe check unavailable (${err.message}) — allowing commit through (fail-open)`);
    return 0;
  }

  const a = response.answers;
  const results = [
    evaluateNoul('visualTypesMatch', a.visualTypesMatch.noul),
    evaluateNoul('fieldsMatch', a.fieldsMatch.noul),
    evaluateScore('aggregationLogicMatch', a.aggregationLogicMatch.score, a.aggregationLogicMatch.confidence),
    evaluateScore('regressionRisk', a.regressionRisk.score, a.regressionRisk.confidence),
  ];

  const verdict = results.some((r) => r.level === 'block')
    ? 'block'
    : results.some((r) => r.level === 'warn')
    ? 'warn'
    : 'pass';

  log(`verdict: ${verdict.toUpperCase()}`);
  for (const r of results) log(`  - [${r.level}] ${r.reason}`);

  writeCache({ hash, verdict, checkedAt: new Date().toISOString() });

  if (verdict === 'block') {
    log('');
    log('Blocking commit. If this is a false positive, fix it or bypass with: git commit --no-verify');
    return 1;
  }

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    // Any unexpected internal error also fails open — this check should
    // never be the reason a commit is stuck for reasons unrelated to the
    // actual consistency question.
    console.error(`[typesafe-consistency] unexpected error, allowing commit through: ${err.stack}`);
    process.exit(0);
  });
