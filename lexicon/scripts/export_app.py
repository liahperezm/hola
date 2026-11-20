"""Generate src/lib/lexicon.generated.ts from lexicon/data/concepts.json.

Usage: python3 lexicon/scripts/export_app.py

Only concepts listed in APP_CONCEPTS go into the app, with the neutral Spanish
meaning the app shows and the guide that lists them (None = translator and
search only). Vulgar and offensive terms are kept and labeled in `registers`. Terms are
dropped when they are everyday Spanish words with another common meaning: the translator swaps
every word it knows, so "padre" (MX: cool) would turn "mi padre" into "mi genial".
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "lexicon" / "data" / "concepts.json"
OUT = ROOT / "src" / "lib" / "lexicon.generated.ts"

# Countries the app supports (src/lib/dialects.ts).
APP_DIALECTS = ["DO", "CO", "AR", "MX", "VE", "PR", "CU", "ES", "CL", "UY", "PE"]

# concept key -> (meaning in neutral Spanish, guide or None, existing app concept id or None)
APP_CONCEPTS: dict[str, tuple[str, str | None, str | None]] = {
    # Merged into concepts the app already has: adds the countries/words it lacks.
    "bus": ("autobús", "viaje", "autobus"),
    "car": ("carro", "viaje", "carro"),
    "ticket": ("boleto", "viaje", "boleto"),
    "computer": ("computadora", "oficina", "computadora"),
    "cell_phone": ("teléfono celular", "oficina", "celular"),
    "pen": ("bolígrafo", "oficina", "boligrafo"),
    "juice": ("jugo", "comida", "jugo"),
    "avocado": ("aguacate", "comida", "aguacate"),
    "peach": ("durazno", "comida", "durazno"),
    "strawberry": ("fresa", "comida", "fresa"),
    "banana": ("banana", "comida", "banana"),
    "beans": ("frijoles", "comida", "frijoles"),
    "corn_cob": ("mazorca de maíz", "comida", "maiz"),
    "popcorn": ("palomitas de maíz", "comida", "palomitas"),
    "cake": ("pastel", "comida", "pastel"),
    "money_slang": ("dinero", "basicos", "dinero"),
    "kid": ("niño", "basicos", "nino"),
    "cool": ("genial", "basicos", "genial"),
    "job_noun": ("trabajo", "oficina", "trabajo"),
    "party": ("fiesta", "basicos", "fiesta"),
    "whats_up": ("¿cómo estás?", "basicos", "como-estas"),
    # New concepts.
    "drive": ("manejar", "viaje", None),
    "traffic_jam": ("embotellamiento", "viaje", None),
    "gas_station": ("gasolinera", "viaje", None),
    "gasoline": ("gasolina", "viaje", None),
    "car_trunk": ("maletero", "viaje", None),
    "sidewalk": ("acera", "viaje", None),
    "pool": ("piscina", "viaje", None),
    "apartment": ("apartamento", "viaje", None),
    "pineapple": ("piña", "comida", None),
    "papaya": ("papaya", "comida", None),
    "potato": ("papa", "comida", None),
    "green_beans": ("judías verdes", "comida", None),
    "drinking_straw": ("pajita", "comida", None),
    "sandwich": ("sándwich", "comida", None),
    "hot_dog": ("hot dog", "comida", None),
    "butter": ("mantequilla", "comida", None),
    "beer": ("cerveza", "comida", None),
    "coffee_black": ("café negro", "comida", None),
    "cocktail_snacks": ("aperitivos", "comida", None),
    "chili_pepper": ("chile", "comida", None),
    "pig_pork": ("cerdo", "comida", None),
    "stamp": ("estampilla", "oficina", None),
    "backpack": ("mochila", "oficina", None),
    "faucet": ("grifo", None, None),
    "fridge": ("refrigerador", None, None),
    "light_bulb": ("bombilla", None, None),
    "trash_can": ("basurero", None, None),
    "tshirt": ("camiseta", None, None),
    "sweater": ("suéter", None, None),
    "jacket": ("chaqueta", None, None),
    "jeans": ("jeans", None, None),
    "swimsuit": ("traje de baño", None, None),
    "sneakers": ("zapatillas deportivas", None, None),
    "glasses": ("lentes", None, None),
    "kite": ("cometa", None, None),
    "pacifier": ("chupete", None, None),
    "baby": ("bebé", None, None),
    "boyfriend": ("novio", None, None),
    "blond": ("rubio", None, None),
    "hangover": ("resaca", None, None),
    "boring": ("aburrido", None, None),
    "dog_informal": ("perro", None, None),
    "mosquito": ("mosquito", None, None),
    "turkey": ("pavo", None, None),
    "store_corner": ("tienda", None, None),
    "nightclub": ("discoteca", None, None),
    "foreigner": ("extranjero", None, None),
    "cigarette": ("cigarrillo", None, None),
    "friend_dude": ("amigo", "basicos", None),
    "for_real": ("de verdad", "basicos", "verdad"),
    "ok_agreed": ("de acuerdo", "basicos", None),
    "right_now": ("ahora mismo", "basicos", None),
    "no_way": ("¡no me digas!", "basicos", None),
    "watch_out": ("¡cuidado!", "basicos", None),
    "understand_slang": ("¿entiendes?", "basicos", None),
    "excuse_me_pardon": ("¿perdón?", "basicos", None),
    "thing_stuff": ("cosa", None, None),
    "a_lot": ("mucho", None, None),
    "drunk": ("borracho", None, None),
    "police_slang": ("policía", None, None),
    "stingy": ("tacaño", None, None),
    "snob": ("esnob", None, None),
    "tacky": ("de mal gusto", None, None),
    "to_mess_up": ("equivocarse", None, None),
    "laziness": ("pereza", None, None),
    "broke": ("sin dinero", None, None),
    "annoyed": ("enojarse", None, None),
    "embarrassment": ("qué vergüenza", None, None),
    "gossip_person": ("chismoso", None, None),
    "to_flirt": ("coquetear", None, None),
    "to_hang_out": ("pasar el rato", None, None),
    "work_verb": ("trabajar", "oficina", None),
    "to_eat_slang": ("comer", None, None),
    "house_slang": ("casa", None, None),
    "fun_great_time": ("pasarlo bien", None, None),
    "ride_lift": ("llevar a alguien en carro", "viaje", None),
    "coat_hanger": ("gancho de ropa", None, None),
    "earrings": ("aretes", None, None),
}

# Everyday words with another common meaning. Never put these in the translator.
AMBIGUOUS = {
    "padre", "pasta", "plata", "cuartos", "reales", "billete", "harina", "manzana", "llave", "tomar", "coger",
    "agarrar", "piso", "taco", "cola", "tráfico", "bomba", "maleta", "pluma", "caño", "timbre", "polo", "fría",
    "caña", "chino", "bicho", "nene", "tío", "tía", "colega", "carnal", "pata", "causa", "socio", "mano",
    "che", "fino", "brutal", "bárbaro", "de más", "full", "paja", "pancho", "completo", "papagayo", "bobo",
    "tenis", "aros", "pendientes", "almacén", "bodega", "boliche", "cochino", "gancho", "cruda", "ratón",
    "goma", "pelado", "mono", "macho", "gringo", "catire", "flaco", "flaca", "guagua", "chucho", "chiva",
    "micro", "auto", "carro", "camión", "camioneta", "bus", "cometa", "tapas", "vaqueros", "malla",
    "chaleco", "franela", "foco", "bombita", "sello", "deportivas", "chela", "pola", "birra", "guiso",
    "pega", "camello", "pinchar", "chamba", "curro", "listo", "sale", "dale", "ya", "va", "papa", "piña",
    "tinto", "torta", "grifo", "chompa", "moquito", "pisco", "kiosco", "abasto", "disco", "antro", "cueva",
    "vereda", "andén", "baúl", "piti", "gabacho", "yuma", "musiú", "guiri", "jeva", "jevo",
    "celular", "máquina", "pasaje", "mola", "nítido", "joda", "tono", "¡habla!", "épale", "tapón", "perro",
    "tabaco", "buzo", "chavo", "chava", "lana", "despensa", "vale", "órale", "bien", "cantidad", "harto",
    "un buen", "una banda", "un toco", "una pila", "burda", "buco", "al toque", "de una", "simón", "ta",
    "tató", "ofi", "cheque", "poli", "tira", "cana", "paco", "tombo", "jara", "chota", "madero", "pasma",
    "duro", "agarrado", "codo", "picarse", "calentarse", "seco", "limpio", "bruja", "arrancado", "misio",
    "chiro", "vuelta", "chisme", "cacharro", "rancho", "jalar", "tragar", "papear", "queli", "gao",
    "levantar", "afilar", "caerle", "liarla", "regarla", "pifiarla", "embarrarla", "curado", "jumo",
    "bolo", "pedo", "mamado", "corroncho", "grasa", "plancha", "cafre", "fresa", "cheto", "concheto",
    "cuico", "sapo", "metiche", "socio", "llave", "mae", "maje", "bo", "compa", "ñaño", "fren",
    "cuate", "hueva", "fiaca", "galbana", "ladilla", "flojera", "mamera", "vacilar", "rolar",
    "quedar", "juntarse", "gozar", "parchar", "colgador", "armador", "percha", "perchero", "candongas",
    "pantallas", "zarcillos", "bola", "botella", "pon", "jalón", "raite", "cola", "aventón",
    "¿cómo?", "¿qué?", "¿ah?", "¿sabes?", "cachar", "manyar", "¡ojo!", "¡guarda!", "¡atento!",
    "¡aguas!", "¡pilas!", "¡abusado!", "¡chuta!", "¡asu!", "¡chuleta!", "¡chuzo!", "¡acho!",
    "ahorita", "ya mismo", "enseguida", "un montón", "coroto", "vaina", "pegar", "cantón", "¡wepa!", "agüitarse",
}
# Kept despite another meaning because the regional sense dominates in that country.
KEEP_IN = {("AR", "birra"), ("UY", "birra"), ("ES", "birra"), ("MX", "chela"), ("PE", "chela"), ("CL", "chela"),
           ("CO", "pola"), ("CO", "tinto"), ("MX", "torta"), ("PE", "grifo"), ("PE", "chompa"),
           ("AR", "vereda"), ("UY", "vereda"), ("CL", "vereda"), ("PE", "vereda"), ("CO", "andén"),
           ("AR", "baúl"), ("UY", "baúl"), ("CO", "baúl"), ("MX", "antro"), ("AR", "boliche"), ("UY", "boliche"),
           ("MX", "foco"), ("PE", "foco"), ("ES", "vaqueros"), ("ES", "tapas"), ("AR", "malla"), ("UY", "malla"),
           ("CL", "chaleco"), ("VE", "franela"), ("ES", "sello"), ("CU", "yuma"), ("ES", "guiri"),
           ("VE", "musiú"), ("MX", "chamba"), ("PE", "chamba"), ("ES", "curro"), ("CL", "guagua"),
           ("PE", "guagua"), ("ES", "chucho"), ("MX", "chucho"), ("PR", "jeva"), ("DO", "jeva"),
           ("CU", "jeva"), ("VE", "jeva"), ("PR", "jevo"), ("DO", "jevo"), ("CU", "jevo"), ("VE", "jevo"),
           ("MX", "güero"), ("VE", "catire"),
           ("ES", "piti"), ("ES", "deportivas")}

# Vulgar and offensive words are included and labeled in the app.
MARKED_REGISTERS = {"vulgar", "offensive"}


def slug(text: str) -> str:
    t = "".join(c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ]+", "-", t).strip("-")


def split_term(term: str) -> list[str]:
    """'novio / novia' -> ['novio', 'novia']; drops parenthesised notes and prefixes like 're-'."""
    if "(" in term or term.endswith("-"):
        return []
    return [t.strip() for t in term.split("/") if t.strip()]


def main():
    concepts = {c["key"]: c for c in json.loads(DATA.read_text())["concepts"]}
    missing = set(APP_CONCEPTS) - set(concepts)
    if missing:
        raise SystemExit(f"Unknown concept keys: {missing}")

    out = []
    dropped = 0
    for key, (meaning, guide, existing) in APP_CONCEPTS.items():
        terms: dict[str, list[str]] = {}
        registers: dict[str, str] = {}
        for v in concepts[key]["v"]:
            term, countries = v[0], v[1].split()
            register = v[3] if len(v) > 3 else "neutral"
            for word in split_term(term):
                if register in MARKED_REGISTERS:
                    registers[word] = register
                for code in countries:
                    if code not in APP_DIALECTS:
                        continue
                    low = word.lower()
                    if low == meaning.lower() or (low in AMBIGUOUS and (code, low) not in KEEP_IN):
                        dropped += 1
                        continue
                    lst = terms.setdefault(code, [])
                    if word not in lst:
                        lst.append(word)
        if not terms:
            continue
        # Labeled words go last, so a country's default translation is a neutral word when it has one.
        for code, words in terms.items():
            words.sort(key=lambda w: w in registers)
        item = {"id": existing or slug(meaning), "meaning": meaning, "terms": terms}
        used = {w for ws in terms.values() for w in ws}
        if any(w in registers for w in used):
            item["registers"] = {w: r for w, r in registers.items() if w in used}
        if guide:
            item["guide"] = guide
        if existing:
            item["mergeInto"] = existing
        out.append(item)

    body = "[\n" + "".join(f"  {json.dumps(c, ensure_ascii=False)},\n" for c in out) + "]"
    OUT.write_text(
        "// Generated by lexicon/scripts/export_app.py from lexicon/data/concepts.json.\n"
        "// Do not edit by hand: change the data and re-run the script.\n"
        'import type { ImportedConcept } from "./dictionary";\n\n'
        f"export const IMPORTED_CONCEPTS: ImportedConcept[] = {body};\n"
    )
    n_terms = sum(len(w) for c in out for w in c["terms"].values())
    print(f"{len(out)} concepts ({sum('mergeInto' in c for c in out)} merged), {n_terms} terms, "
          f"{dropped} dropped -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
