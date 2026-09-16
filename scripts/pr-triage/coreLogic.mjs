// Minimal glob matcher (`*` and `**`) — no dependency, the patterns in
// config.mjs are simple enough not to need a real glob library.

function globToRegExp(glob) {
  let out = '^';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        out += '.*';
        i++;
      } else {
        out += '[^/]*';
      }
    } else if ('.+^${}()|[]\\'.includes(c)) {
      out += `\\${c}`;
    } else {
      out += c;
    }
  }
  return new RegExp(out + '$');
}

export function isCoreLogicFile(path, patterns) {
  return patterns.some((p) => globToRegExp(p).test(path));
}
