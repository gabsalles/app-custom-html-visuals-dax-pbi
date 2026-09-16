// Greedy bin-packing: fits as many files as possible per Jev call under a
// char budget, so an N-file PR takes the fewest calls that fit rather than
// either "one call per file" or "one giant call that risks the payload
// limit / gets slow."

export function packIntoBatches(files, charBudget) {
  const batches = [];
  let current = [];
  let currentSize = 0;

  for (const file of files) {
    const size = file.diff.length;
    if (current.length > 0 && currentSize + size > charBudget) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(file);
    currentSize += size;
  }
  if (current.length > 0) batches.push(current);

  return batches;
}
