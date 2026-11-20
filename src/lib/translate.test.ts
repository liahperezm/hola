import { describe, expect, it } from "vitest";
import { allEntries, getEntry, guideRows, wordOfTheDay } from "./dictionary";
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
