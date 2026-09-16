import { execSync } from 'node:child_process';

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
}

export function getChangedFiles(cwd, range) {
  return sh(`git diff --name-only ${range}`, cwd)
    .trim()
    .split('\n')
    .filter(Boolean);
}

// Per-file patch (not the full file) — this classifies the CHANGE, not the
// file as a whole. Truncates long diffs and says so explicitly in the text
// fed to the model, so it never silently reasons over a partial diff
// without knowing it's partial.
export function getFileDiff(cwd, range, path, maxLines) {
  let patch;
  try {
    patch = sh(`git diff ${range} -- ${JSON.stringify(path)}`, cwd);
  } catch (err) {
    return `(failed to read diff: ${err.message})`;
  }
  const lines = patch.split('\n');
  if (lines.length <= maxLines) return patch;
  const truncated = lines.slice(0, maxLines).join('\n');
  return `${truncated}\n\n... (truncated, ${lines.length - maxLines} more lines not shown)`;
}
