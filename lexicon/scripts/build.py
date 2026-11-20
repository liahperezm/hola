"""Build hola_es.db (SQLite) and hola_es.json from the curated data/ files.

Usage: python3 scripts/build.py [--out build/]
Then optionally: python3 scripts/import_wiktionary.py <kaikki.jsonl> --db build/hola_es.db
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lexdb import ROOT, add_sense, connect, get_entry, kind_for  # noqa: E402

DATA = ROOT / "data"


def codes(s: str) -> list[str]:
    return s.split()


def load(con):
    countries = json.loads((DATA / "countries.json").read_text())
    con.executemany(
        "INSERT OR REPLACE INTO countries VALUES (?,?,?,?,?,?,?,?)",
        [(c["code"], c["name_es"], c["name_en"], c["demonym_es"], c["dialect_zone"],
          c["voseo"], int(c["vosotros"]), c["notes"]) for c in countries],
    )
    valid = {c["code"] for c in countries}

    def check(cs, where):
        bad = set(cs) - valid
        if bad:
            raise SystemExit(f"Unknown country code(s) {bad} in {where}")
        return cs

    # 1. Concepts: one meaning -> regional terms
    for c in json.loads((DATA / "concepts.json").read_text())["concepts"]:
        cid = con.execute(
            "INSERT INTO concepts(key, name_en, category) VALUES (?,?,?)", (c["key"], c["en"], c["cat"])
        ).lastrowid
        for v in c["v"]:
            term, cs = v[0], check(codes(v[1]), c["key"])
            note = v[2] if len(v) > 2 and v[2] else None
            reg = v[3] if len(v) > 3 else "neutral"
            eid = get_entry(con, term, kind_for(term))
            sid = add_sense(con, eid, c["en"], cs, register=reg, notes=note)
            con.execute("INSERT OR IGNORE INTO concept_senses VALUES (?,?)", (cid, sid))

    # 2. Regional slang by country
    slang = json.loads((DATA / "regional_slang.json").read_text())
    for key, items in slang.items():
        if key.startswith("_"):
            continue
        cs = check(codes(key), key)
        for it in items:
            term, reg, gloss = it[0], it[1], it[2]
            ex = it[3] if len(it) > 3 else None
            note = it[4] if len(it) > 4 else None
            eid = get_entry(con, term, kind_for(term, "idiom"))
            add_sense(con, eid, gloss, cs, register=reg, example_es=ex, notes=note)

    # 3. False friends: same word, different meaning by country
    for w in json.loads((DATA / "false_friends.json").read_text())["words"]:
        eid = get_entry(con, w["t"], kind_for(w["t"]))
        multi = len(w["s"]) > 1
        for s in w["s"]:
            add_sense(con, eid, s[2], check(codes(s[0]), w["t"]), register=s[1],
                      notes=s[3] if len(s) > 3 else None, false_friend=multi)

    # 4. Idioms and proverbs
    for term, kind, cs, reg, gloss, lit, ex, note in json.loads((DATA / "idioms.json").read_text())["idioms"]:
        eid = get_entry(con, term, kind)
        add_sense(con, eid, gloss, check(codes(cs), term), register=reg, literal_en=lit,
                  example_es=ex, notes=note)


def export_json(con, path: Path):
    con.row_factory = None
    out = {"countries": [], "entries": [], "concepts": []}
    cols = [d[1] for d in con.execute("PRAGMA table_info(countries)")]
    out["countries"] = [dict(zip(cols, r)) for r in con.execute("SELECT * FROM countries")]
    for eid, term, kind, pos in con.execute("SELECT id, term, kind, pos FROM entries ORDER BY normalized"):
        senses = []
        for sid, gloss, reg, lit, ex, exen, notes, ff, src in con.execute(
            "SELECT id, gloss_en, register, literal_en, example_es, example_en, notes, is_false_friend, source "
            "FROM senses WHERE entry_id=? ORDER BY id", (eid,)
        ).fetchall():
            cs = [r[0] for r in con.execute("SELECT country_code FROM sense_countries WHERE sense_id=?", (sid,))]
            s = {"meaning_en": gloss, "register": reg, "countries": cs}
            for k, v in (("literal_en", lit), ("example_es", ex), ("example_en", exen), ("notes", notes)):
                if v:
                    s[k] = v
            if ff:
                s["false_friend"] = True
            if src != "curated":
                s["source"] = src
            senses.append(s)
        e = {"term": term, "kind": kind, "senses": senses}
        if pos:
            e["pos"] = pos
        out["entries"].append(e)
    for cid, key, name, cat in con.execute("SELECT id, key, name_en, category FROM concepts").fetchall():
        terms = con.execute(
            """SELECT e.term, s.register, group_concat(sc.country_code, ' '), s.notes
               FROM concept_senses cs JOIN senses s ON s.id=cs.sense_id JOIN entries e ON e.id=s.entry_id
               JOIN sense_countries sc ON sc.sense_id=s.id WHERE cs.concept_id=? GROUP BY s.id""", (cid,)
        ).fetchall()
        out["concepts"].append({
            "key": key, "meaning_en": name, "category": cat,
            "terms": [{"term": t, "register": r, "countries": c.split(), **({"notes": n} if n else {})}
                      for t, r, c, n in terms],
        })
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "build"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    db = out / "hola_es.db"
    db.unlink(missing_ok=True)
    con = connect(db)
    with con:
        load(con)
    export_json(con, out / "hola_es.json")
    q = lambda s: con.execute(s).fetchone()[0]  # noqa: E731
    print(f"entries={q('SELECT count(*) FROM entries')} senses={q('SELECT count(*) FROM senses')} "
          f"concepts={q('SELECT count(*) FROM concepts')} "
          f"false_friend_senses={q('SELECT count(*) FROM senses WHERE is_false_friend=1')}")
    print(f"wrote {db} and {out / 'hola_es.json'}")


if __name__ == "__main__":
    main()
