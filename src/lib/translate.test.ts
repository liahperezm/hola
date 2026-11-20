import { describe, expect, it } from "vitest";
import { allEntries, getEntry, guideRows } from "./dictionary";
import { isSingleTerm, translateWithDictionary } from "./translate";

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

  it("recognises a single term", () => {
    expect(
      isSingleTerm(translateWithDictionary("A la brigandina", "DO", "CO")),
    ).toBe(true);
    expect(
      isSingleTerm(translateWithDictionary("Lo hizo a la brigandina", "DO", "CO")),
    ).toBe(false);
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

  it("has unique ids", () => {
    const ids = allEntries().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
