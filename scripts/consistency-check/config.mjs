// Single source of truth for the Preview.tsx <-> daxGenerator.ts consistency
// check: which files/regions are compared, the exact Jev questions asked
// about them, and the thresholds that decide pass/warn/block.
//
// Scope (deliberately v1, cards + donuts only — see chat history for why
// bars and categorical cards are excluded): the three areas where the two
// implementations hand-duplicate logic instead of sharing a module.
//
// Regions are extracted from sentinel comments in the source files:
//   // TS-CONSISTENCY:BEGIN <regionId>   (or {/* ... */} inside JSX)
//   ...
//   // TS-CONSISTENCY:END
// The same regionId may appear multiple times in one file (e.g. the ring
// AND the progress-bar both feed progressRingFormula in Preview.tsx) —
// the extractor concatenates all occurrences in file order.

export const SIDES = {
  generator: ['utils/daxGenerator.ts'],
  preview: ['components/Preview.tsx', 'utils/gaugeMath.ts'],
};

// Files that, when staged/changed, should trigger the check at all.
export const WATCHED_FILES = [...SIDES.generator, ...SIDES.preview];

export const REGIONS = ['progressRingFormula', 'comparisonTrend', 'donutModeFormula'];

export const QUESTIONS = {
  visualTypesMatch: {
    type: 'noul',
    instructions:
      "Do Preview.tsx and daxGenerator.ts render/generate the exact same set of " +
      "card/donut sub-types, under the same conditions for choosing each one " +
      "(e.g. progress vs ring vs default; completeness vs distribution donut)? " +
      "Ignore differences that are just about WHERE a live value comes from " +
      "(a hardcoded preview test field vs a live DAX measure) — only the set of " +
      "supported types and the branching condition that selects between them matters.",
    criteria: {
      true: 'Same sub-types, same selection conditions in both files',
      false: 'A sub-type exists in one file but not the other, or the condition to select it differs',
    },
  },

  fieldsMatch: {
    type: 'noul',
    instructions:
      "Do both implementations read from the same set of user-configurable fields " +
      "for each visual element (e.g. progressMeasure/progressTarget, " +
      "completenessMeasure/completenessTarget, centerTextValueMeasure, comparison " +
      "measurePlaceholder)? A preview-only stand-in field (progressValue, " +
      "previewPercent, slice.value) that plays the same role as production's live " +
      "measure for the same visual element is NOT a mismatch by itself.",
    criteria: {
      true: 'Same fields play the same roles in both implementations',
      false:
        'A field used in one implementation has no counterpart role in the other, ' +
        'or two different fields are being used for what should be the same value',
    },
  },

  aggregationLogicMatch: {
    type: 'score',
    instructions:
      "Compare the paired formulas (progress/ring percentage, donut completeness " +
      "percentage, donut distribution total, comparison up/down threshold). How " +
      "equivalent is the actual computation, ignoring that one side is DAX and the " +
      "other is JS?",
    criteria: [
      'Mathematically equivalent, including edge cases (clamping, rounding, zero/blank handling)',
      'Same general approach but a minor edge case differs (e.g. different clamp bound, different rounding)',
      'Same general approach but an edge case is handled with different user-visible outcomes (e.g. one side hides at a value the other renders differently for)',
      'Computes a materially different result',
    ],
  },

  regressionRisk: {
    type: 'score',
    instructions:
      "Given all of the above, how likely is this divergence to cause a visible " +
      "production regression (something the user sees differently between the " +
      "editor preview and the exported DAX visual)?",
    criteria: [
      'No user-visible risk — cosmetic/dev-only or preview-only difference',
      'Low risk — edge case unlikely to occur with typical data',
      'Medium risk — plausible with real data, user-visible but not severe',
      'High risk — likely to occur and clearly wrong/misleading when it does',
    ],
  },
};

export const THRESHOLDS = {
  // Noul: the value itself is the signal (no separate confidence field).
  // Below block_max => confidently "false" (mismatch) => block-eligible.
  // Between block_max and warn_max => leaning mismatch but too uncertain to block.
  visualTypesMatch: { block_max: 0.3, warn_max: 0.5 },
  fieldsMatch: { block_max: 0.3, warn_max: 0.5 },

  // Score: level index (0-based) + the real confidence field.
  // Never block on a low-confidence read — route to a warning instead.
  aggregationLogicMatch: { block_min_score: 2, block_min_confidence: 0.6, warn_min_score: 1 },
  regressionRisk: { block_min_score: 2, block_min_confidence: 0.6, warn_min_score: 1 },
};

export const CACHE_PATH = '.typesafe-consistency-cache.json';
export const API_TIMEOUT_MS = 8000;
