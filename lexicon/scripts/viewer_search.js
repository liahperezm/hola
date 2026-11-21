// Search used by hola_lexicon.html (inlined by export_viewer.py) and tested by
// viewer_search.test.mjs. It finds an entry even when the query is written
// the way people speak: "a caballo regalao no se le miran lo diente" finds
// "a caballo regalado no se le mira el diente".

const ARTICLES = new Set(["el", "la", "lo", "los", "las", "un", "una", "unos", "unas"]);

/** Lowercase, no accents, no punctuation. */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A spelling-tolerant key for one word: the same key for "regalado" and
 * "regalao", "dientes" and "diente", "verdad" and "verdá", "llave" and "yave".
 */
function wordKey(w) {
  if (ARTICLES.has(w)) return "∅";
  let k = w
    .replace(/h/g, "")
    .replace(/v/g, "b")
    .replace(/ll/g, "y")
    .replace(/qu/g, "k")
    .replace(/c([ei])/g, "s$1")
    .replace(/z/g, "s")
    .replace(/g([ei])/g, "j$1")
    .replace(/c/g, "k")
    .replace(/([aeio])d([oa]s?)$/, "$1$2") // regalado → regalao
    .replace(/d$/, "") // verdad → verda
    .replace(/s$/, ""); // dientes → diente
  return k || w;
}

function keys(text) {
  return norm(text).split(" ").filter(Boolean).map(wordKey);
}

function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const NEAR = 0.6;

/** Same word, allowing a typo or a conjugation ending (mira / miran). */
function sameWord(a, b) {
  if (a === b) return true;
  const max = Math.min(a.length, b.length) >= 6 ? 2 : Math.min(a.length, b.length) >= 3 ? 1 : 0;
  return max > 0 && lev(a, b, max) <= max;
}

/**
 * Words of a and b that match in the same order (longest common subsequence).
 * An exact word counts 1, a near one NEAR, so exact matches rank first.
 */
function matchedInOrder(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const x = a[i - 1], y = b[j - 1];
      const w = x === y ? 1 : sameWord(x, y) ? NEAR : 0;
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], w ? dp[i - 1][j - 1] + w : 0);
    }
  return dp[a.length][b.length];
}

/**
 * How well a query matches a term or phrase, from 0 to 1. Phrases score by how
 * many words match in order; one- or two-word queries also match the start of
 * a longer phrase ("caballo" finds the proverb).
 */
function score(queryKeys, termKeys) {
  if (!queryKeys.length || !termKeys.length) return 0;
  const hits = matchedInOrder(queryKeys, termKeys);
  if (queryKeys.length <= 2) {
    // Every query word must be in the term, at least as a near match.
    if (hits < queryKeys.length * NEAR - 1e-9) {
      const last = queryKeys[queryKeys.length - 1];
      const prefix = last.length >= 3 && termKeys.some((t) => t.startsWith(last));
      if (!(prefix && hits >= (queryKeys.length - 1) * NEAR - 1e-9)) return 0;
      return 0.55;
    }
    if (hits === termKeys.length && hits === queryKeys.length) return 1;
    // Mostly how much of the query matched, a little how much of the term.
    return 0.5 + 0.3 * (hits / queryKeys.length) + 0.2 * (hits / termKeys.length);
  }
  return (2 * hits) / (queryKeys.length + termKeys.length);
}

/**
 * Best of the spelling-tolerant score and a plain "contains" match, so that
 * typing the start of a word ("cabal") also works.
 */
function match(query, term) {
  const q = norm(query);
  if (!q) return 0;
  const fuzzy = score(keys(q), keys(term));
  const plain = norm(term).includes(q) ? (norm(term) === q ? 1 : 0.7) : 0;
  return Math.max(fuzzy, plain);
}

if (typeof module !== "undefined") module.exports = { norm, wordKey, keys, score, match };
