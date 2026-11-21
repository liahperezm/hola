// node lexicon/scripts/viewer_search.test.cjs
const assert = require("node:assert/strict");
const { match } = require("./viewer_search.js");

const s = match;
const PROVERB = "a caballo regalado no se le mira el diente";

const cases = [
  ["the way it's said", s("a caballo regalao no se le miran lo diente", PROVERB) >= 0.9],
  ["exact", s(PROVERB, PROVERB) === 1],
  ["one word finds the phrase", s("caballo", PROVERB) > 0.5],
  ["start of a word", s("cabal", PROVERB) > 0.5],
  ["dropped d", s("verdá", "verdad") === 1],
  ["yeísmo, seseo, h", s("yave", "llave") === 1 && s("sapato", "zapato") === 1 && s("ablar", "hablar") === 1],
  ["typo", s("quilonbo", "quilombo") > 0.5],
  ["exact ranks above near", s("verdá", "verdad") > s("verdá", "burda")],
  ["unrelated phrase scores low", s("a caballo regalao no se le miran lo diente", "más vale tarde que nunca") < 0.3],
  ["unrelated word", s("gato", "perro") === 0],
  ["short word needs a real match", s("de", "verdad") === 0],
];
let failed = 0;
for (const [name, ok] of cases) {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (!ok) failed++;
}
assert.equal(failed, 0);
