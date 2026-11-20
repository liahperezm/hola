"""Import the full Spanish lexicon from Wiktionary (Kaikki.org extract) into hola_es.db.

Source file (English-Wiktionary extraction of all Spanish entries, JSON Lines):
  https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl
License: Wiktionary content is CC BY-SA 4.0 — the app must credit Wiktionary and share-alike
any redistributed database. See README.

Usage:
  python3 scripts/build.py
  python3 scripts/import_wiktionary.py path/to/kaikki.org-dictionary-Spanish.jsonl --db build/hola_es.db
Options:
  --include-forms   also import inflected-form senses ("plural of X"); skipped by default
  --limit N         stop after N lines (for testing)
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lexdb import add_sense, connect, get_entry  # noqa: E402

LATAM = "MX GT SV HN NI CR PA CU DO PR CO VE EC PE BO CL AR UY PY US".split()
CENTRAL_AMERICA = "GT SV HN NI CR PA".split()
CARIBBEAN = "CU DO PR".split()

# Wiktionary regional labels -> country codes. Matched case-insensitively against sense tags,
# the parenthesised qualifiers in raw_glosses, and category names ("Mexican Spanish").
REGION_MAP = {
    "spain": ["ES"], "peninsular": ["ES"], "castilian": ["ES"], "european spanish": ["ES"],
    "canary islands": ["ES"], "canarian": ["ES"], "andalusia": ["ES"], "andalusian": ["ES"], "madrid": ["ES"],
    "mexico": ["MX"], "mexican": ["MX"], "northern mexico": ["MX"],
    "guatemala": ["GT"], "guatemalan": ["GT"],
    "el salvador": ["SV"], "salvadoran": ["SV"], "salvadorian": ["SV"],
    "honduras": ["HN"], "honduran": ["HN"],
    "nicaragua": ["NI"], "nicaraguan": ["NI"],
    "costa rica": ["CR"], "costa rican": ["CR"],
    "panama": ["PA"], "panamanian": ["PA"],
    "cuba": ["CU"], "cuban": ["CU"],
    "dominican republic": ["DO"], "dominican": ["DO"],
    "puerto rico": ["PR"], "puerto rican": ["PR"],
    "colombia": ["CO"], "colombian": ["CO"],
    "venezuela": ["VE"], "venezuelan": ["VE"],
    "ecuador": ["EC"], "ecuadorian": ["EC"],
    "peru": ["PE"], "peruvian": ["PE"],
    "bolivia": ["BO"], "bolivian": ["BO"],
    "chile": ["CL"], "chilean": ["CL"],
    "argentina": ["AR"], "argentine": ["AR"], "argentinian": ["AR"], "lunfardo": ["AR"],
    "uruguay": ["UY"], "uruguayan": ["UY"],
    "paraguay": ["PY"], "paraguayan": ["PY"],
    "equatorial guinea": ["GQ"], "equatoguinean": ["GQ"],
    "united states": ["US"], "new mexico": ["US"], "texas": ["US"], "spanglish": ["US"],
    "rioplatense": ["AR", "UY"], "river plate": ["AR", "UY"],
    "central america": CENTRAL_AMERICA, "central american": CENTRAL_AMERICA,
    "caribbean": CARIBBEAN, "antilles": CARIBBEAN,
    "andes": ["PE", "BO", "EC"], "andean": ["PE", "BO", "EC"],
    "latin america": LATAM, "latin american": LATAM, "americas": LATAM, "south america":
        "CO VE EC PE BO CL AR UY PY".split(),
}
# Longest labels first so "northern mexico" wins over "mexico", "dominican republic" over "dominican".
_REGION_RE = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(REGION_MAP, key=len, reverse=True)) + r")\b", re.I
)

REGISTER_TAGS = [  # first match wins, most severe first
    ("offensive", {"offensive", "derogatory", "pejorative", "ethnic slur", "slur"}),
    ("vulgar", {"vulgar"}),
    ("slang", {"slang"}),
    ("informal", {"colloquial", "informal", "familiar"}),
    ("formal", {"formal", "literary"}),
    ("archaic", {"archaic", "obsolete", "dated", "historical"}),
]
SKIP_POS = {"name", "character", "symbol", "letter", "punct", "romanization", "suffix", "prefix", "infix"}
IDIOM_POS = {"phrase", "proverb", "prep_phrase"}


def regions_for(sense: dict, entry: dict) -> list[str]:
    texts = list(sense.get("tags", []))
    for rg in sense.get("raw_glosses", []):
        texts += re.findall(r"^\(([^)]*)\)", rg)  # leading "(Mexico, colloquial)"
    texts += [c.get("name", "") if isinstance(c, dict) else c for c in sense.get("categories", [])]
    found: list[str] = ["US"] if "US" in sense.get("tags", []) else []
    for t in texts:
        t = t.replace("-", " ")
        for m in _REGION_RE.findall(t):
            found += REGION_MAP[m.lower()]
    return list(dict.fromkeys(found)) or ["ALL"]


def register_for(sense: dict) -> str:
    tags = {t.lower() for t in sense.get("tags", [])}
    for rg in sense.get("raw_glosses", []):
        for q in re.findall(r"^\(([^)]*)\)", rg):
            tags |= {x.strip().lower() for x in q.split(",")}
    for reg, keys in REGISTER_TAGS:
        if tags & keys:
            return reg
    return "neutral"


def kind_for(entry: dict, sense: dict) -> str:
    pos = entry.get("pos", "")
    if pos == "proverb" or "proverb" in sense.get("tags", []):
        return "proverb"
    if pos in IDIOM_POS or "idiomatic" in sense.get("tags", []):
        return "idiom"
    return "phrase" if " " in entry["word"].strip() else "word"


def run(path: Path, db: Path, include_forms: bool, limit: int | None):
    con = connect(db)
    n_lines = n_senses = 0
    with con, path.open(encoding="utf-8") as fh:
        for line in fh:
            n_lines += 1
            if limit and n_lines > limit:
                break
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            if e.get("lang_code") not in (None, "es") or e.get("pos") in SKIP_POS or not e.get("word"):
                continue
            for s in e.get("senses", []):
                if not include_forms and ("form_of" in s or "form-of" in s.get("tags", [])):
                    continue
                glosses = s.get("glosses") or []
                if not glosses:
                    continue
                gloss = "; ".join(glosses)[:500]
                ex = next((x for x in s.get("examples", []) if x.get("text")), {})
                eid = get_entry(con, e["word"], kind_for(e, s), e.get("pos"))
                add_sense(
                    con, eid, gloss, regions_for(s, e), register=register_for(s), source="wiktionary",
                    example_es=ex.get("text"), example_en=ex.get("english") or ex.get("translation"),
                )
                n_senses += 1
            if n_lines % 50000 == 0:
                print(f"  {n_lines:,} lines, {n_senses:,} senses…", flush=True)
    q = lambda s: con.execute(s).fetchone()[0]  # noqa: E731
    print(f"Imported {n_senses:,} senses from {n_lines:,} lines. "
          f"DB now has {q('SELECT count(*) FROM entries'):,} entries / {q('SELECT count(*) FROM senses'):,} senses.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("jsonl", type=Path)
    ap.add_argument("--db", type=Path, default=Path(__file__).resolve().parent.parent / "build" / "hola_es.db")
    ap.add_argument("--include-forms", action="store_true")
    ap.add_argument("--limit", type=int)
    a = ap.parse_args()
    run(a.jsonl, a.db, a.include_forms, a.limit)
