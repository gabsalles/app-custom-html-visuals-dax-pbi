// Single source of truth for the PR/changed-files triage layer: which paths
// count as "core chart logic" (a plain lookup, no Jev involved), the two
// Jev questions asked per file, and the thresholds that turn their answers
// into a read_full / skim recommendation.
//
// This is separate from scripts/consistency-check/ (which compares two
// specific files to each other). This tool classifies an arbitrary set of
// changed files so a human/Claude knows where to actually spend attention
// before a full review. On-demand only — no hook, no CI, run via /triage
// or `npm run triage`.

// Glob-ish patterns (supports * and **) — deliberately a fixed allowlist,
// not an LLM judgment: knowing which files ARE the chart/DAX engine is an
// exact fact about this repo, not something that needs semantic understanding.
export const CORE_LOGIC_PATTERNS = [
  'components/Preview.tsx',
  'utils/daxGenerator.ts',
  'utils/categoricalDax.ts',
  'utils/categoricalCards.ts',
  'utils/gaugeMath.ts',
  'utils/chartTypes/**',
  'utils/conditionalFormatting.ts',
  'utils/valueFormatDax.ts',
];

export const QUESTIONS = {
  risk: {
    type: 'score',
    instructions:
      "How likely is this specific diff to cause a production regression, " +
      "based only on what's visible in the patch? Consider blast radius, " +
      "whether it removes or weakens a guard, validation, or test assertion, " +
      "and whether the diff's intent is clear or ambiguous from the patch alone.",
    criteria: [
      'Low — cosmetic, docs, config, or mechanically safe (formatting, rename, comment-only, lockfile bump)',
      'Medium — real logic change but a narrow/well-tested path, or a moderate diff with clear intent',
      'High — touches shared/critical logic, wide blast radius, removes or weakens a guard/assertion, or the intent is unclear from the diff alone',
    ],
  },
  category: {
    type: 'choice',
    instructions: 'Classify what kind of change this diff mostly is.',
    criteria: {
      logic: 'Business logic, calculations, control flow, data transformations',
      styling: 'CSS/visual-only — className, style props, no behavior change',
      config: 'Build config, package.json, tsconfig, env, CI/workflow files',
      generated: 'Auto-generated artifacts, lockfiles, snapshots',
      docs: 'Comments, README, markdown, docstrings only',
      tests: 'Test files only',
    },
  },
};

export const THRESHOLDS = {
  // Deliberately asymmetric vs. the consistency-checker's block logic: this
  // only ever RECOMMENDS more reading, it never blocks anything, so it errs
  // toward over-including rather than requiring high confidence. A
  // medium-risk file the model is unsure about is exactly the file a human
  // should look at, not skip because the model wasn't confident either.
  risk_full_min_score: 1, // >= "Medium", no confidence gate
  logic_category_always_full: true,
};

export const DEFAULT_BASE_REF = 'origin/main';
export const BATCH_CHAR_BUDGET = 40000;
export const MAX_DIFF_LINES_PER_FILE = 400;
export const API_TIMEOUT_MS = 15000;
export const REPORT_PATH = '.triage-report.json';
