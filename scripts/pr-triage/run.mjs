#!/usr/bin/env node
// On-demand triage of changed files before a full code review — NOT a
// hook, NOT wired into CI. Run via `npm run triage` or the /triage slash
// command. See scripts/pr-triage/config.mjs for the full design writeup.
//
// Usage:
//   node scripts/pr-triage/run.mjs                  (diffs DEFAULT_BASE_REF...HEAD)
//   node scripts/pr-triage/run.mjs --range <ref>    (diffs <ref>...HEAD)
//   node scripts/pr-triage/run.mjs --files a.ts,b.tsx  (explicit file list, no git diff range)
//
// Prints a human-readable report to stdout AND writes REPORT_PATH (JSON)
// for the slash command to consume reliably.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CORE_LOGIC_PATTERNS,
  QUESTIONS,
  THRESHOLDS,
  DEFAULT_BASE_REF,
  BATCH_CHAR_BUDGET,
  MAX_DIFF_LINES_PER_FILE,
  API_TIMEOUT_MS,
  REPORT_PATH,
} from './config.mjs';
import { isCoreLogicFile } from './coreLogic.mjs';
import { getChangedFiles, getFileDiff } from './diff.mjs';
import { packIntoBatches } from './batch.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const rangeIdx = args.indexOf('--range');
  const filesIdx = args.indexOf('--files');
  if (filesIdx !== -1 && args[filesIdx + 1]) {
    return { mode: 'files', files: args[filesIdx + 1].split(',').map((s) => s.trim()).filter(Boolean) };
  }
  const base = rangeIdx !== -1 && args[rangeIdx + 1] ? args[rangeIdx + 1] : DEFAULT_BASE_REF;
  return { mode: 'range', range: `${base}...HEAD` };
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

// Sanitizes a file path into a safe, unique question-key fragment.
function makeKeyMap(paths) {
  const map = new Map(); // key -> path
  const seen = new Set();
  for (const p of paths) {
    let key = p.replace(/[^A-Za-z0-9_]/g, '_');
    let candidate = key;
    let n = 1;
    while (seen.has(candidate)) candidate = `${key}_${n++}`;
    seen.add(candidate);
    map.set(candidate, p);
  }
  return map;
}

function decide(file) {
  if (file.touchesCoreLogic) return { verdict: 'read_full', reason: 'touches core chart/DAX logic' };
  if (file.risk && file.risk.score >= THRESHOLDS.risk_full_min_score) {
    return { verdict: 'read_full', reason: `risk score ${file.risk.score.toFixed(2)} (>= medium)` };
  }
  if (THRESHOLDS.logic_category_always_full && file.category && file.category.choice === 'logic') {
    return { verdict: 'read_full', reason: 'classified as logic change' };
  }
  return { verdict: 'skim', reason: file.category ? `category=${file.category.choice}, low risk` : 'low risk' };
}

async function classifyBatch(batch, client) {
  const keyMap = makeKeyMap(batch.map((f) => f.path));
  const reverse = new Map([...keyMap.entries()].map(([k, v]) => [v, k]));

  const state = { files: {} };
  const questions = {};
  for (const file of batch) {
    state.files[file.path] = file.diff;
    const key = reverse.get(file.path);
    questions[`risk__${key}`] = { ...QUESTIONS.risk, instructions: `${QUESTIONS.risk.instructions} File: ${file.path}. Diff: \`files.${JSON.stringify(file.path)}\`` };
    questions[`category__${key}`] = { ...QUESTIONS.category, instructions: `${QUESTIONS.category.instructions} File: ${file.path}. Diff: \`files.${JSON.stringify(file.path)}\`` };
  }

  const response = await withTimeout(
    client.systemOne({ state, questions, model: 'jev-latest' }),
    API_TIMEOUT_MS
  );

  for (const file of batch) {
    const key = reverse.get(file.path);
    file.risk = response.answers[`risk__${key}`];
    file.category = response.answers[`category__${key}`];
  }
}

async function main() {
  const args = parseArgs();
  const changedPaths =
    args.mode === 'files' ? args.files : getChangedFiles(REPO_ROOT, args.range);

  if (changedPaths.length === 0) {
    log('No changed files to triage.');
    return 0;
  }

  const range = args.mode === 'range' ? args.range : null;
  const files = changedPaths.map((p) => ({
    path: p,
    touchesCoreLogic: isCoreLogicFile(p, CORE_LOGIC_PATTERNS),
    diff: range ? getFileDiff(REPO_ROOT, range, p, MAX_DIFF_LINES_PER_FILE) : '(explicit file list mode — no diff available; treating as needing full read)',
  }));

  // Files with no diff text available (explicit --files mode) skip
  // straight to read_full — there's nothing for Jev to classify.
  const classifiable = files.filter((f) => range !== null);
  const unclassifiable = files.filter((f) => range === null);

  let jevOk = true;
  if (classifiable.length > 0) {
    try {
      const { TypeSafeClient } = await import('@typesafe-ai/sdk');
      const client = new TypeSafeClient();
      const batches = packIntoBatches(classifiable, BATCH_CHAR_BUDGET);
      log(`Triaging ${classifiable.length} file(s) across ${batches.length} Jev call(s)...`);
      for (const batch of batches) {
        await classifyBatch(batch, client);
      }
    } catch (err) {
      jevOk = false;
      log(`WARNING: TypeSafe triage unavailable (${err.message}) — falling back to "review everything".`);
    }
  }

  const results = files.map((f) => {
    if (!jevOk || unclassifiable.includes(f)) {
      return { ...f, verdict: 'read_full', reason: !jevOk ? 'Jev unreachable, failing open' : 'no diff available to classify' };
    }
    const { verdict, reason } = decide(f);
    return { ...f, verdict, reason };
  });

  const readFull = results.filter((r) => r.verdict === 'read_full');
  const skim = results.filter((r) => r.verdict === 'skim');

  log('');
  log(`=== Triage report (${results.length} files) ===`);
  log('');
  log(`read_full (${readFull.length}):`);
  for (const r of readFull) {
    const risk = r.risk ? `risk=${r.risk.score.toFixed(2)}` : 'risk=n/a';
    const cat = r.category ? `category=${r.category.choice}` : '';
    log(`  ${r.path}  [${risk} ${cat}]  — ${r.reason}`);
  }
  log('');
  log(`skim (${skim.length}):`);
  for (const r of skim) {
    const risk = r.risk ? `risk=${r.risk.score.toFixed(2)}` : 'risk=n/a';
    const cat = r.category ? `category=${r.category.choice}` : '';
    log(`  ${r.path}  [${risk} ${cat}]  — ${r.reason}`);
  }
  log('');

  writeFileSync(
    path.join(REPO_ROOT, REPORT_PATH),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        jevOk,
        readFull: readFull.map((r) => r.path),
        skim: skim.map((r) => r.path),
        files: results.map((r) => ({
          path: r.path,
          verdict: r.verdict,
          reason: r.reason,
          touchesCoreLogic: r.touchesCoreLogic,
          risk: r.risk ? { score: r.risk.score, confidence: r.risk.confidence } : null,
          category: r.category ? r.category.choice : null,
        })),
      },
      null,
      2
    )
  );
  log(`Report written to ${REPORT_PATH}`);

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[pr-triage] unexpected error: ${err.stack}`);
    process.exit(1);
  });
