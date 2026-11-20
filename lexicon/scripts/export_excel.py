"""Write lexicon/build/Hola_lexico.xlsx: the whole lexicon as an Excel workbook.

Usage:
  python3 lexicon/scripts/build.py
  python3 lexicon/scripts/export_excel.py      (needs: pip install openpyxl)
"""
from __future__ import annotations

import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "lexicon" / "build"

KIND = {"word": "Palabra", "phrase": "Frase", "idiom": "Modismo", "proverb": "Refrán"}
FONT = Font(name="Arial", size=10)
BOLD = Font(name="Arial", size=10, bold=True)
HEAD = Font(name="Arial", size=10, bold=True, color="FFFFFF")
HEAD_FILL = PatternFill("solid", fgColor="1B1D4F")
REG_FILL = {"vulgar": "FFF0BF", "offensive": "FFE1E1", "slang": "E9E6FF", "informal": "E0EFFF"}
WRAP = Alignment(wrap_text=True, vertical="top")


def app_words() -> set[tuple[str, str]]:
    pairs = set()
    for line in (ROOT / "src" / "lib" / "lexicon.generated.ts").read_text().splitlines():
        if line.startswith("  {"):
            c = json.loads(line.strip().rstrip(","))
            for code, words in c["terms"].items():
                pairs |= {(code, w) for w in words}
    return pairs


def add_sheet(wb, title, headers, rows, widths, reg_col=None):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for r in rows:
        ws.append(r)
    for c in ws[1]:
        c.font, c.fill = HEAD, HEAD_FILL
        c.alignment = Alignment(vertical="center", wrap_text=True)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font, c.alignment = FONT, WRAP
        if reg_col is not None and row[reg_col].value in REG_FILL:
            row[reg_col].fill = PatternFill("solid", fgColor=REG_FILL[row[reg_col].value])
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "B2"
    ws.auto_filter.ref = ws.dimensions


def main():
    d = json.loads((BUILD / "hola_es.json").read_text())
    app = app_words()
    name = {c["code"]: c["name_es"] for c in d["countries"]}

    def names(codes):
        return ", ".join("General" if c == "ALL" else name[c] for c in codes)

    entries, false_friends = [], []
    for e in d["entries"]:
        parts = [p.strip() for p in e["term"].split("/")]
        for s in e["senses"]:
            in_app = sorted({c for c in s["countries"] for p in parts if (c, p) in app})
            entries.append([e["term"], KIND[e["kind"]], s["meaning_en"], s["register"], names(s["countries"]),
                            s.get("example_es", ""), s.get("notes", ""), "Sí" if s.get("false_friend") else "",
                            names(in_app)])
            if s.get("false_friend"):
                false_friends.append([e["term"], names(s["countries"]), s["meaning_en"], s["register"],
                                      s.get("notes", "")])

    idioms = [[t, KIND[k], m, lit, names(cs.split()), ex, n]
              for t, k, cs, _reg, m, lit, ex, n in
              json.loads((ROOT / "lexicon" / "data" / "idioms.json").read_text())["idioms"]]

    codes = [c["code"] for c in d["countries"] if c["code"] != "ALL"]
    matrix = []
    for c in d["concepts"]:
        row = [c["meaning_en"], c["category"],
               ", ".join(t["term"] for t in c["terms"] if "ALL" in t["countries"]) or "—"]
        for code in codes:
            words = [t["term"] + ("" if t["register"] == "neutral" else f" ({t['register']})")
                     for t in c["terms"] if code in t["countries"]]
            row.append(", ".join(words) or "—")
        matrix.append(row)

    wb = Workbook()
    ws = wb.active
    ws.title = "Léame"
    n_terms = len({e["term"] for e in d["entries"]})
    for row in [
        ("Léxico de Hola", ""), ("", ""), ("Pestaña", "Qué contiene"),
        ("Por concepto", "Cada fila es un significado; cada columna, cómo se dice en ese país (— = sin palabra propia)."),
        ("Todas las entradas", "Cada palabra, frase y modismo con su significado en inglés, registro y países. "
                               "Usa los filtros del encabezado."),
        ("Falsos amigos", "Palabras que cambian de significado (a veces a algo vulgar) según el país."),
        ("Modismos y refranes", "Expresiones con traducción literal y variantes regionales."),
        ("Países", "Los 22 países, zona dialectal y uso de vos/vosotros."), ("", ""),
        ("Registro", "Colores de la columna Registro: amarillo = vulgar, rosa = ofensivo, lila = jerga (slang), "
                     "azul = informal."),
        ("En la app para", "Países para los que la app Hola ya usa esa palabra."),
        ("Totales", f"{n_terms} entradas, {len(entries)} significados, {len(matrix)} conceptos, "
                    f"{len(false_friends)} significados de falsos amigos, {len(idioms)} modismos y refranes."),
        ("Revisión", "Contenido curado, todavía sin revisión de hablantes nativos: conviene revisar cada país "
                     "antes de publicarlo."),
    ]:
        ws.append(row)
    for row in ws.iter_rows():
        for c in row:
            c.font, c.alignment = FONT, WRAP
    ws["A1"].font = Font(name="Arial", size=16, bold=True, color="1B1D4F")
    for ref in ("A3", "B3", "A10", "A11", "A12", "A13"):
        ws[ref].font = BOLD
    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 95

    add_sheet(wb, "Por concepto", ["Significado (inglés)", "Categoría", "General"] + [name[c] for c in codes],
              matrix, [24, 13, 18] + [16] * len(codes))
    add_sheet(wb, "Todas las entradas", ["Término", "Tipo", "Significado (inglés)", "Registro", "Países", "Ejemplo",
                                         "Notas", "Falso amigo", "En la app para"],
              entries, [28, 11, 40, 11, 34, 32, 40, 10, 24], reg_col=3)
    add_sheet(wb, "Falsos amigos", ["Palabra", "Países", "Significado en esos países (inglés)", "Registro", "Notas"],
              false_friends, [18, 40, 48, 11, 44], reg_col=3)
    add_sheet(wb, "Modismos y refranes", ["Expresión", "Tipo", "Significado (inglés)", "Traducción literal", "Países",
                                          "Ejemplo", "Variantes y notas"], idioms, [40, 11, 40, 36, 24, 36, 48])
    add_sheet(wb, "Países", ["Código", "País", "Nombre en inglés", "Gentilicio", "Zona dialectal", "Voseo",
                             "Usa vosotros", "Notas"],
              [[c["code"], c["name_es"], c["name_en"], c["demonym_es"] or "", c["dialect_zone"], c["voseo"],
                "Sí" if c["vosotros"] else "No", c["notes"]] for c in d["countries"]],
              [8, 22, 22, 30, 32, 30, 12, 60])

    out = BUILD / "Hola_lexico.xlsx"
    wb.save(out)
    print(f"{len(entries)} entries, {len(matrix)} concepts, {len(false_friends)} false-friend senses, "
          f"{len(idioms)} idioms -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
