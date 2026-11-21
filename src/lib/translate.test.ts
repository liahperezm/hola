import { describe, expect, it } from "vitest";
import { allEntries, getEntry, guideRows, wordOfTheDay, unknownPlainWordConcepts } from "./dictionary";
import { warningText } from "./false-friends";
import { translateWithDictionary } from "./translate";

const join = (segments: { text: string }[]) =>
  segments.map((s) => s.text).join("");

describe("translateWithDictionary", () => {
  it("translates the case study sentence from Dominican to Colombian", () => {
    const result = translateWithDictionary(
      "El carajito hizo eso a la brigandina",
      "DO",
      "CO",
    );
    expect(join(result.target)).toBe("El pelado hizo eso a las carreras");
    expect(result.via).toBe("dictionary");
    expect(result.pairs.map((p) => [p.from.text, p.to.text])).toEqual([
      ["carajito", "pelado"],
      ["a la brigandina", "a las carreras"],
    ]);
    expect(result.source.filter((s) => s.highlight).map((s) => s.text)).toEqual(
      ["carajito", "a la brigandina"],
    );
  });

  it("ignores accents and case, and keeps capitals and punctuation", () => {
    const result = translateWithDictionary("¿Cómo tu ta? Ey tú!", "DO", "AR");
    expect(join(result.target)).toBe("¿Cómo andás? Che!");
  });

  it("handles plurals of single words", () => {
    const result = translateWithDictionary("Los carajitos", "DO", "AR");
    expect(join(result.target)).toBe("Los pibes");
  });

  it("falls back to neutral Spanish when the target has no word of its own", () => {
    const result = translateWithDictionary("Tengo laburo", "AR", "DO");
    expect(join(result.target)).toBe("Tengo trabajo");
    expect(result.pairs[0].to.id).toBeUndefined();
  });

  it("reports nothing found for plain Spanish", () => {
    const result = translateWithDictionary("Buenos días a todos", "DO", "CO");
    expect(result.via).toBe("none");
    expect(join(result.target)).toBe("Buenos días a todos");
  });
});

describe("dictionary", () => {
  it("keeps the case study detail for a la brigandina", () => {
    const entry = getEntry("DO.a-la-brigandina");
    expect(entry?.pronunciation).toBe("ah lah bree-gahn-DEE-nah");
    expect(entry?.origin).toContain("Bridge and Dinna");
  });

  it("builds the Básicos guide from Dominican to Argentine", () => {
    const rows = guideRows("basicos", "DO", "AR");
    const pairs = rows.map((r) => [r.from.display, r.to.display]);
    expect(pairs).toContainEqual(["ey tú", "che"]);
    expect(pairs).toContainEqual(["un lío, un arroz con mango", "quilombo"]);
    expect(pairs).toContainEqual(["carajito(a), chamaquito(a)", "pibe(a)"]);
  });

  it("picks a word of the day with a story, stable through the day", () => {
    const morning = wordOfTheDay(new Date(2026, 10, 20, 8));
    const night = wordOfTheDay(new Date(2026, 10, 20, 23));
    expect(morning.id).toBe(night.id);
    expect(morning.origin).toBeTruthy();
    expect(wordOfTheDay(new Date(2026, 10, 21)).id).not.toBe(morning.id);
  });

  it("lists every concept of a guide whatever the countries", () => {
    const a = guideRows("comida", "DO", "AR").map((r) => r.conceptId);
    const b = guideRows("comida", "ES", "PE").map((r) => r.conceptId);
    expect(a).toEqual(b);
    const juice = guideRows("comida", "DO", "AR").find((r) => r.conceptId === "jugo");
    expect([juice?.from.display, juice?.to.display]).toEqual(["jugo", "jugo"]);
  });

  it("has unique ids", () => {
    const ids = allEntries().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("imported lexicon", () => {
  it("translates words from the imported concepts", () => {
    const result = translateWithDictionary("Me tomé una birra en la pileta", "AR", "MX");
    expect(join(result.target)).toBe("Me tomé una chela en la alberca");
  });

  it("adds countries to hand-made concepts without changing their first word", () => {
    expect(join(translateWithDictionary("Quiero un zumo", "ES", "DO").target)).toBe(
      "Quiero un jugo",
    );
  });

  it("leaves everyday words with other meanings alone", () => {
    for (const text of ["Tengo un perro", "La cola del banco", "Una llave y un piso", "Un plato de pasta"]) {
      for (const from of ["MX", "CO", "CL", "AR"] as const) {
        expect(translateWithDictionary(text, from, "ES").via).toBe("none");
      }
    }
  });

  it("lists imported concepts in their guide", () => {
    const rows = guideRows("comida", "AR", "MX").map((r) => [r.from.display, r.to.display]);
    expect(rows).toContainEqual(["birra", "chela"]);
  });
});

describe("vulgar and offensive words", () => {
  it("are in the dictionary and labeled", () => {
    expect(getEntry("MX.chingon")?.register).toBe("vulgar");
    expect(getEntry("MX.naco")?.register).toBe("offensive");
    expect(getEntry("MX.chido")?.register).toBeUndefined();
  });

  it("are understood when translating from them", () => {
    const result = translateWithDictionary("Está chingón", "MX", "AR");
    expect(join(result.target)).toBe("Está copado");
  });

  it("can be a translation, after a country's other words", () => {
    expect(join(translateWithDictionary("Está copado", "AR", "MX").target)).toBe("Está chido");
    expect(join(translateWithDictionary("¡Qué cosito!", "AR", "CL").target)).toBe("¡Qué huevada!");
  });
});

describe("plain words for everyday objects", () => {
  it("translates the plain word when the other country has its own", () => {
    const result = translateWithDictionary(
      "Fui a la gasolinera a por gasolina",
      "ES",
      "AR",
    );
    expect(join(result.target)).toBe("Fui a la estación de servicio a por nafta");
    expect(result.pairs.map((p) => p.to.text)).toEqual([
      "estación de servicio",
      "nafta",
    ]);
  });

  it("leaves plain words alone when both countries say the same", () => {
    const result = translateWithDictionary("Llené el tanque de gasolina", "DO", "MX");
    expect(join(result.target)).toBe("Llené el tanque de gasolina");
    expect(result.source.some((s) => s.highlight)).toBe(false);
  });

  it("never swaps plain words for slang", () => {
    const result = translateWithDictionary("El niño tiene dinero", "DO", "AR");
    expect(join(result.target)).toBe("El niño tiene dinero");
  });

  it("does not touch ambiguous words", () => {
    const result = translateWithDictionary("Mi papá bebe jugo en Chile", "CO", "ES");
    expect(join(result.target)).toBe("Mi papá bebe zumo en Chile");
  });

  it("only lists concepts that exist", () => {
    expect(unknownPlainWordConcepts()).toEqual([]);
  });
});

describe("false friends", () => {
  it("warns when a harmless word is vulgar where the text is going", () => {
    const { warnings } = translateWithDictionary("Cogí el móvil", "ES", "AR");
    expect(warnings).toHaveLength(1);
    expect(warningText(warnings[0])).toBe(
      "En Argentina, «coger» significa: tener sexo.",
    );
  });

  it("does not warn when the word is already vulgar where it comes from", () => {
    expect(translateWithDictionary("Cogí el bus", "AR", "ES").warnings).toEqual([]);
  });

  it("does not warn for ordinary text", () => {
    expect(translateWithDictionary("Qué chévere el carro", "DO", "CO").warnings).toEqual(
      [],
    );
  });

  it("warns about Cuban papaya from the Dominican Republic", () => {
    const { warnings } = translateWithDictionary("Quiero una papaya", "DO", "CU");
    expect(warnings.map((w) => w.word)).toEqual(["papaya"]);
  });
});
