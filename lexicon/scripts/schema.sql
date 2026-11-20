-- Hola app: Spanish lexicon by country
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS countries (
  code          TEXT PRIMARY KEY,      -- ISO 3166-1 alpha-2, plus 'ALL' = pan-Hispanic
  name_es       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  demonym_es    TEXT,
  dialect_zone  TEXT,
  voseo         TEXT,                  -- how 'vos' is used
  vosotros      INTEGER NOT NULL DEFAULT 0,
  notes         TEXT
);

-- One row per headword / expression
CREATE TABLE IF NOT EXISTS entries (
  id          INTEGER PRIMARY KEY,
  term        TEXT NOT NULL,           -- as written, with accents
  normalized  TEXT NOT NULL,           -- lowercase, no accents/punctuation: for search
  kind        TEXT NOT NULL CHECK (kind IN ('word','phrase','idiom','proverb')),
  pos         TEXT,                    -- noun, verb, adj, interj... (mostly from Wiktionary)
  UNIQUE (term, kind, pos)
);
CREATE INDEX IF NOT EXISTS idx_entries_norm ON entries(normalized);

-- One row per meaning of an entry
CREATE TABLE IF NOT EXISTS senses (
  id          INTEGER PRIMARY KEY,
  entry_id    INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  gloss_en    TEXT NOT NULL,           -- meaning in English
  register    TEXT NOT NULL DEFAULT 'neutral'
              CHECK (register IN ('neutral','informal','slang','vulgar','offensive','formal','archaic')),
  literal_en  TEXT,                    -- literal translation (idioms)
  example_es  TEXT,
  example_en  TEXT,
  notes       TEXT,                    -- usage warnings, regional variants
  is_false_friend INTEGER NOT NULL DEFAULT 0,  -- meaning differs dangerously by country
  source      TEXT NOT NULL            -- 'curated' | 'wiktionary'
);
CREATE INDEX IF NOT EXISTS idx_senses_entry ON senses(entry_id);

-- Where each meaning is used
CREATE TABLE IF NOT EXISTS sense_countries (
  sense_id      INTEGER NOT NULL REFERENCES senses(id) ON DELETE CASCADE,
  country_code  TEXT NOT NULL REFERENCES countries(code),
  PRIMARY KEY (sense_id, country_code)
);
CREATE INDEX IF NOT EXISTS idx_sc_country ON sense_countries(country_code);

-- Concepts: one meaning, many regional words ("how do you say 'bus' in Chile?")
CREATE TABLE IF NOT EXISTS concepts (
  id        INTEGER PRIMARY KEY,
  key       TEXT UNIQUE NOT NULL,
  name_en   TEXT NOT NULL,
  category  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS concept_senses (
  concept_id  INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  sense_id    INTEGER NOT NULL REFERENCES senses(id) ON DELETE CASCADE,
  PRIMARY KEY (concept_id, sense_id)
);

-- Convenience view: every meaning with its countries
CREATE VIEW IF NOT EXISTS v_lexicon AS
SELECT e.id AS entry_id, e.term, e.kind, e.pos, s.id AS sense_id, s.gloss_en, s.register,
       s.literal_en, s.example_es, s.example_en, s.notes, s.is_false_friend, s.source,
       group_concat(sc.country_code, ' ') AS countries
FROM entries e
JOIN senses s ON s.entry_id = e.id
LEFT JOIN sense_countries sc ON sc.sense_id = s.id
GROUP BY s.id;
