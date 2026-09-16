---
description: Triage changed files with TypeSafe before a full code review — classify risk/category per file so only the files that matter get a full read.
---

Run the PR triage script, then use its output to scope your own review — do not review every changed file in full; use the triage verdict to decide where to actually spend attention.

1. Run: `node scripts/pr-triage/run.mjs $ARGUMENTS`
   - No arguments: diffs against `origin/main...HEAD`.
   - Arguments are passed straight through (e.g. `/triage --range origin/develop`, `/triage --files a.ts,b.tsx`).
2. Read `.triage-report.json` (written by the script) for the structured verdict per file — don't parse the console output, the JSON file is authoritative.
3. For every file listed under `readFull`: open and actually read it in full before commenting on it.
4. For every file listed under `skim`: do NOT open it in full. Mention it by name in your summary with its reported category/risk, but don't spend review effort on its contents unless something in a `read_full` file's diff specifically implicates it.
5. If `jevOk` is `false` in the report, every file will be listed under `readFull` (fail-open) — say so explicitly so the user knows the triage step itself didn't run, not that everything happened to be risky.
6. Then proceed with the actual code review of the `readFull` files, using whatever review depth/format the user asked for (or `/code-review` conventions if they didn't specify one).
