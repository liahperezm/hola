# Hola — Spanish lexicon by country

A database of Spanish words, slang, idioms and proverbs, each meaning tagged with the countries where it is used and its register (neutral → vulgar/offensive).

## What's inside

| Layer | Source | Size | Purpose |
|---|---|---|---|
| **Curated core** (`data/*.json`) | Written for Hola | ~1,300 entries / ~1,700 meanings, 22 countries | High-value learner content: regional vocabulary, slang, false friends, idioms |
| **Full lexicon** (optional) | Wiktionary via Kaikki.org | hundreds of thousands of senses | "Every word" coverage, auto-tagged by region |

Curated files:

- `data/countries.json` — 21 Spanish-speaking countries + US, with dialect zone, voseo and vosotros usage. `ALL` = understood everywhere.
- `data/concepts.json` — 105 meanings, each mapped to its word in every country (bus → *autobús* ES, *camión* MX, *guagua* CU/PR/DO, *colectivo* AR, *micro* CL…).
- `data/regional_slang.json` — ~750 slang words and expressions grouped by country.
- `data/false_friends.json` — 65 words that change meaning (sometimes to something vulgar) between countries, such as *coger*, *concha*, *bicho*, *papaya*, *pena* and *ahorita*.
- `data/idioms.json` — 125 idioms and proverbs, each with a literal translation and regional variants.

## How the app uses it

The app does not read this folder at runtime. `lexicon/scripts/export_app.py` turns the
concepts in `data/concepts.json` into `src/lib/lexicon.generated.ts`, which
`src/lib/dictionary.ts` merges with the hand-made dictionary (hand-made words always come first):

```bash
python3 lexicon/scripts/export_app.py && pnpm test
```

The script only exports the concepts listed in `APP_CONCEPTS`, for every country the app lists (all 22 in `countries.json`), and it
drops vulgar or offensive words and everyday words with another common meaning (the `AMBIGUOUS` list).
The translator swaps every word it knows, so *padre* (Mexico: "cool") would turn "mi padre" into
"mi genial".

False friends that are vulgar in one of the app's countries are exported by a second script, so the
translator writes them the way a listener there hears them ("Voy a coger un taxi" for Uruguay is
"Voy a tener sexo con un taxi"):

```bash
python3 lexicon/scripts/export_false_friends.py && pnpm test
```

It writes `src/lib/false-friends.generated.ts`. The Spanish meanings, the literal replacements (with each
noun's gender, so the article agrees: "la pija" -> "el pene") and verb forms live in the script
(`MEANING_ES`, `LITERAL_ES`, `LITERAL_FORMS`, `FORMS`); the export stops if a vulgar sense is missing one. Harmless meaning changes (*carro*, *pena*, *ahorita*) are not warned about
yet, because their meanings are written in English.

The plain Spanish word for an everyday object (*gasolina*, *acera*, *mochila*) is also translated
when the other country has its own word. Only concepts listed in `PLAIN_WORDS` in
`src/lib/dictionary.ts` get this, so plain words are never swapped for slang (*niño* → *pibe*) and
ambiguous words (*papa*, *bebe*, *Chile*) are left alone.

Slang and idioms are not in the app yet. Their meanings are written in English, and the app
is in Spanish.

The SQLite database and the Wiktionary import below are for analysis and future features. Their output
goes to `lexicon/build/`, which is ignored by git.

## Build the database

```bash
python3 lexicon/scripts/build.py
```

This produces `lexicon/build/hola_es.db` (SQLite) and `build/hola_es.json` (the same data as nested JSON for the app bundle). The build checks every country code.

### Browse everything

```bash
python3 lexicon/scripts/export_viewer.py
```

This writes `lexicon/build/hola_lexicon.html`, a searchable page with filters for country, type, register,
false friends and what's in the app, plus a per-concept table. It also writes `lexicon/build/hola_lexicon.csv`
for spreadsheet review. Run `build.py` first.

Search finds entries the way people write them: "a caballo regalao no se le miran lo diente" finds
*a caballo regalado no se le mira el diente*. It ignores accents, dropped *d* and *s* (*regalao*,
*verdá*, *lo diente*), *ll*/*y*, *b*/*v*, *c*/*s*/*z*, silent *h*, swapped articles and a letter or two of
difference, and checks variants quoted in the notes. The closest match is shown on top with its meaning.
Vulgar and offensive entries always show their meaning, labeled "Vulgar" or "Ofensiva". The search lives in
`lexicon/scripts/viewer_search.js` (tests: `node lexicon/scripts/viewer_search.test.cjs`).

For an Excel workbook with tabs for words by country, all entries, false friends, idioms and countries:

```bash
pip install openpyxl
python3 lexicon/scripts/export_excel.py   # writes lexicon/build/Hola_lexico.xlsx
```

### Add the full Wiktionary lexicon

1. Download `kaikki.org-dictionary-Spanish.jsonl` from https://kaikki.org/dictionary/Spanish/ (about 1 GB).
2. Run:

```bash
python3 lexicon/scripts/import_wiktionary.py path/to/kaikki.org-dictionary-Spanish.jsonl --db lexicon/build/hola_es.db
```

Region labels such as "(Mexico, colloquial)", "Rioplatense", "Central America" and "Andes" are mapped to country codes. Senses with no regional label are tagged `ALL`. Inflected forms ("plural of…") are skipped unless you pass `--include-forms`. Wiktionary senses are kept separate from curated ones (`source = 'wiktionary'`), so the app can rank curated content first.

**License:** Wiktionary content is CC BY-SA 4.0. If Hola ships or redistributes the imported data, the app must credit Wiktionary, and the database must stay under CC BY-SA. The curated core is yours.

## Schema

```
countries(code, name_es, name_en, demonym_es, dialect_zone, voseo, vosotros, notes)
entries(id, term, normalized, kind[word|phrase|idiom|proverb], pos)
senses(id, entry_id, gloss_en, register, literal_en, example_es, example_en, notes, is_false_friend, source)
sense_countries(sense_id, country_code)        -- many-to-many
concepts(id, key, name_en, category)
concept_senses(concept_id, sense_id)
v_lexicon                                      -- view: one row per meaning with its countries
```

Register values: `neutral`, `informal`, `slang`, `vulgar`, `offensive`, `formal`, `archaic`. Hide `vulgar` and `offensive` by default, but show them as warnings on false friends.

## Example queries

```sql
-- How do you say "bus" in each country?
SELECT e.term, group_concat(sc.country_code, ' ') AS countries
FROM concepts c JOIN concept_senses cs ON cs.concept_id = c.id
JOIN senses s ON s.id = cs.sense_id JOIN entries e ON e.id = s.entry_id
JOIN sense_countries sc ON sc.sense_id = s.id
WHERE c.key = 'bus' GROUP BY s.id;

-- All slang for Colombia
SELECT term, gloss_en, register FROM v_lexicon
WHERE ' ' || countries || ' ' LIKE '% CO %' AND register IN ('slang','informal');

-- Words that are safe in Spain but vulgar in Mexico
SELECT DISTINCT e.term FROM entries e
JOIN senses a ON a.entry_id = e.id JOIN sense_countries ac ON ac.sense_id = a.id AND ac.country_code = 'ES'
JOIN senses b ON b.entry_id = e.id JOIN sense_countries bc ON bc.sense_id = b.id AND bc.country_code = 'MX'
WHERE a.register = 'neutral' AND b.register = 'vulgar';

-- Search, ignoring accents
SELECT * FROM v_lexicon WHERE entry_id IN (SELECT id FROM entries WHERE normalized LIKE 'que onda%');
```

## Accuracy and gaps

- The curated data reflects common usage, but slang changes fast and varies by region and generation within each country. Before launch, have a native speaker from each country review that country's entries. Each country can be reviewed on its own.
- Equatorial Guinea and US Spanish have thin curated coverage; the Wiktionary import fills in some of the gap.
- Region-level variation (Canary Islands, Andalusia, northern Mexico, Colombian coast vs. Bogotá) is written in `notes` and is not yet a separate field.
