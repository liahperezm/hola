#!/usr/bin/env python3
"""Export the false friends the app warns about.

Reads lexicon/data/false_friends.json and writes src/lib/false-friends.generated.ts
with the words that are vulgar in at least one of the app's countries, so the
translator can warn before someone says "coger" in Argentina.

    python3 lexicon/scripts/export_false_friends.py && pnpm test
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "lexicon/data/false_friends.json"
TARGET = ROOT / "src/lib/false-friends.generated.ts"

APP_COUNTRIES = ["AR", "BO", "CL", "CO", "CR", "CU", "EC", "SV", "ES", "US", "GT", "GQ", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "DO", "UY", "VE"]
WARN_REGISTERS = {"vulgar", "offensive"}

# Words left out: "madre" is only vulgar inside set expressions, so a warning on
# every "madre" would be noise.
SKIP = {"madre"}

# Extra written forms to look for, beyond the word and its plural.
FORMS = {
    "coger": [
        "cojo", "coges", "coge", "cogemos", "cogen", "cogí", "cogiste", "cogió",
        "cogimos", "cogieron", "cogía", "cogías", "cogían", "coja", "cojas",
        "cojan", "cogiendo", "cogido", "cogida", "cógelo", "cógela", "cogerlo",
        "cogerla", "cogeré", "cogerá",
    ],
}

# What the vulgar sense means, in Spanish, by sense index in false_friends.json.
MEANING_ES = {
    "coger": {1: "tener sexo"},
    "concha": {2: "los genitales femeninos"},
    "pija": {1: "el pene"},
    "bicho": {2: "el pene"},
    "papaya": {1: "los genitales femeninos"},
    "pendejo": {0: "idiota (insulto fuerte)", 2: "vello púbico"},
    "chaqueta": {1: "masturbación"},
    "arrecho": {1: "excitado sexualmente"},
    "polla": {0: "el pene"},
    "cajeta": {1: "los genitales femeninos"},
    "bollo": {1: "los genitales femeninos"},
    "pinche": {0: "maldito, de mala calidad"},
    "paja": {1: "masturbación"},
    "chucha": {0: "¡carajo! (exclamación)"},
    "pico": {1: "el pene"},
    "chimba": {0: "genial (en su origen, los genitales femeninos)"},
    "huevón": {0: "idiota, vago", 2: "vago"},
}


# What a listener in that country hears, written into the translation: "Voy a
# coger un taxi" becomes "Voy a tener sexo con un taxi" for Uruguay. Nouns give
# their gender so the article before them agrees ("la pija" -> "el pene").
LITERAL_ES = {
    "concha": {2: ("vulva", "f")},
    "pija": {1: ("pene", "m")},
    "bicho": {2: ("pene", "m")},
    "papaya": {1: ("vulva", "f")},
    "pendejo": {0: ("idiota", "m"), 2: ("vello púbico", "m")},
    "chaqueta": {1: ("masturbación", "f")},
    "arrecho": {1: ("excitado sexualmente", None)},
    "polla": {0: ("pene", "m")},
    "cajeta": {1: ("vulva", "f")},
    "bollo": {1: ("vulva", "f")},
    "pinche": {0: ("maldito", None)},
    "paja": {1: ("masturbación", "f")},
    "chucha": {0: ("carajo", None)},
    "pico": {1: ("pene", "m")},
    "chimba": {0: ("genial", None)},
    "huevón": {0: ("idiota", None), 2: ("vago", None)},
}

# Verbs: the literal replacement for each written form.
LITERAL_FORMS = {
    "coger": {
        "coger": "tener sexo con", "cojo": "tengo sexo con", "coges": "tienes sexo con",
        "coge": "tiene sexo con", "cogemos": "tenemos sexo con", "cogen": "tienen sexo con",
        "cogí": "tuve sexo con", "cogiste": "tuviste sexo con", "cogió": "tuvo sexo con",
        "cogimos": "tuvimos sexo con", "cogieron": "tuvieron sexo con", "cogía": "tenía sexo con",
        "cogías": "tenías sexo con", "cogían": "tenían sexo con", "coja": "tenga sexo con",
        "cojas": "tengas sexo con", "cojan": "tengan sexo con", "cogiendo": "teniendo sexo con",
        "cogido": "tenido sexo con", "cogida": "tenido sexo con", "cógelo": "ten sexo con él",
        "cógela": "ten sexo con ella", "cogerlo": "tener sexo con él",
        "cogerla": "tener sexo con ella", "cogeré": "tendré sexo con", "cogerá": "tendrá sexo con",
    },
}


def senses(word, base):
    out = []
    for i, sense in enumerate(word["s"]):
        codes = sense[0].split()
        countries = [c for c in codes if c in APP_COUNTRIES]
        out.append(
            {
                "countries": countries,
                "everywhereElse": "ALL" in codes,
                "register": sense[1],
            }
        )
        if sense[1] in WARN_REGISTERS:
            meaning = MEANING_ES.get(base, {}).get(i)
            if not meaning:
                raise SystemExit(f"No Spanish meaning for {base} sense {i}: add it to MEANING_ES")
            out[-1]["meaning"] = meaning
            literal = LITERAL_ES.get(base, {}).get(i)
            if literal:
                out[-1]["literal"] = literal[0]
                if literal[1]:
                    out[-1]["gender"] = literal[1]
            elif base not in LITERAL_FORMS:
                raise SystemExit(f"No literal Spanish for {base} sense {i}: add it to LITERAL_ES")
    return out


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    entries = []
    for word in data["words"]:
        forms = [f.strip() for f in word["t"].split("/") if f.strip()]
        if forms[0] in SKIP:
            continue
        s = senses(word, forms[0])
        vulgar_here = any(
            x["register"] in WARN_REGISTERS and (x["countries"] or x["everywhereElse"])
            for x in s
        )
        if not vulgar_here:
            continue
        entry = {
            "word": forms[0],
            "forms": forms + FORMS.get(forms[0], []),
            "senses": s,
        }
        if forms[0] in LITERAL_FORMS:
            entry["literalForms"] = LITERAL_FORMS[forms[0]]
        entries.append(entry)

    lines = [
        "// Generated by lexicon/scripts/export_false_friends.py from",
        "// lexicon/data/false_friends.json. Do not edit by hand.",
        'import type { FalseFriend } from "./false-friends";',
        "",
        "export const FALSE_FRIENDS: FalseFriend[] = [",
    ]
    for e in entries:
        lines.append("  " + json.dumps(e, ensure_ascii=False) + ",")
    lines += ["];", ""]
    TARGET.write_text("\n".join(lines), encoding="utf-8")
    print(f"{len(entries)} false friends -> {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
