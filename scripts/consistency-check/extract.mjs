// Pulls named regions out of source files via sentinel comments:
//   // TS-CONSISTENCY:BEGIN <regionId>      (or {/* ... */} inside JSX)
//   ...
//   // TS-CONSISTENCY:END
//
// Plain text extraction, no AST — the sentinels exist precisely so this
// doesn't need to understand code structure. Same regionId may appear
// multiple times in one file; occurrences are concatenated in file order.

// Line-based (not a single regex on raw text) so it doesn't care whether the
// sentinel is a "//" comment or a JSX "{/* ... */}" comment — it only looks
// for the marker text within each line.
const BEGIN_RE = /TS-CONSISTENCY:BEGIN\s+(\S+)/;
const END_RE = /TS-CONSISTENCY:END\b/;

export function extractRegions(fileContent) {
  const regions = {};
  let currentId = null;
  let buffer = [];

  for (const line of fileContent.split('\n')) {
    if (currentId === null) {
      const m = BEGIN_RE.exec(line);
      if (m) currentId = m[1];
      continue;
    }
    const nested = BEGIN_RE.exec(line);
    if (nested) {
      throw new Error(
        `Nested TS-CONSISTENCY:BEGIN "${nested[1]}" found before region "${currentId}" was closed with END`
      );
    }
    if (END_RE.test(line)) {
      const body = buffer.join('\n').trim();
      regions[currentId] = regions[currentId] ? `${regions[currentId]}\n\n---\n\n${body}` : body;
      currentId = null;
      buffer = [];
      continue;
    }
    buffer.push(line);
  }

  if (currentId !== null) {
    throw new Error(`Unterminated TS-CONSISTENCY region "${currentId}" (no matching END marker found)`);
  }

  return regions;
}

// Builds { generator: { regionId: text }, preview: { regionId: text } } from
// a map of { relativePath: fileContent } plus the SIDES config.
export function buildBundle(fileContents, sides, knownRegions) {
  const bundle = {};
  const missing = [];

  for (const [side, paths] of Object.entries(sides)) {
    const merged = {};
    for (const path of paths) {
      const content = fileContents[path];
      if (content === undefined) continue; // file wasn't read (e.g. deleted) — handled by caller
      const regions = extractRegions(content);
      for (const [regionId, body] of Object.entries(regions)) {
        merged[regionId] = merged[regionId] ? `${merged[regionId]}\n\n---\n\n${body}` : body;
      }
    }
    bundle[side] = merged;

    for (const regionId of knownRegions) {
      if (!merged[regionId] || merged[regionId].trim() === '') {
        missing.push(`${side}.${regionId}`);
      }
    }
  }

  return { bundle, missing };
}
