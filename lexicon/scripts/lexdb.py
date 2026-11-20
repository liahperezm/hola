"""Shared helpers for writing to the Hola lexicon database."""
import re
import sqlite3
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "scripts" / "schema.sql"


def normalize(term: str) -> str:
    """Lowercase, strip accents (keeps ñ), drop punctuation: '¿Qué onda?' -> 'que onda'."""
    t = term.lower().replace("ñ", "\0")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    t = t.replace("\0", "ñ")
    t = re.sub(r"[^\w\s/'-]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def kind_for(term: str, default_multi: str = "phrase") -> str:
    core = re.sub(r"[¿?¡!]", "", term).strip()
    return "word" if " " not in core else default_multi


def connect(path) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.execute("PRAGMA foreign_keys = ON")
    con.executescript(SCHEMA.read_text())
    return con


def get_entry(con, term, kind, pos=None) -> int:
    row = con.execute(
        "SELECT id FROM entries WHERE term=? AND kind=? AND pos IS ?", (term, kind, pos)
    ).fetchone()
    if row:
        return row[0]
    return con.execute(
        "INSERT INTO entries(term, normalized, kind, pos) VALUES (?,?,?,?)",
        (term, normalize(term), kind, pos),
    ).lastrowid


def add_sense(con, entry_id, gloss_en, countries, *, register="neutral", source="curated",
              literal_en=None, example_es=None, example_en=None, notes=None, false_friend=False) -> int:
    """Insert a sense, or merge countries into an identical existing sense."""
    row = con.execute(
        "SELECT id FROM senses WHERE entry_id=? AND gloss_en=? AND register=? AND source=?",
        (entry_id, gloss_en, register, source),
    ).fetchone()
    if row:
        sid = row[0]
        if notes:
            con.execute("UPDATE senses SET notes = coalesce(notes, ?) WHERE id=?", (notes, sid))
        if false_friend:
            con.execute("UPDATE senses SET is_false_friend=1 WHERE id=?", (sid,))
    else:
        sid = con.execute(
            """INSERT INTO senses(entry_id, gloss_en, register, literal_en, example_es, example_en,
                                  notes, is_false_friend, source) VALUES (?,?,?,?,?,?,?,?,?)""",
            (entry_id, gloss_en, register, literal_en or None, example_es or None, example_en or None,
             notes or None, int(false_friend), source),
        ).lastrowid
    con.executemany(
        "INSERT OR IGNORE INTO sense_countries(sense_id, country_code) VALUES (?,?)",
        [(sid, c) for c in dict.fromkeys(countries)],
    )
    return sid
