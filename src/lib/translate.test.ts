import { describe, expect, it } from "vitest";
import { sharedText } from "./draft";
import type { DialectCode } from "./dialects";
import { allEntries, getEntry, knownEntry, guideRows, otherWaysByWord, wordOfTheDay, wordOfTheDayPool, unknownPlainWordConcepts, unknownOriginIds } from "./dictionary";
import { suggestCountry } from "./detect";
import { warningText } from "./false-friends";
import { translateAnyCountry, translateWithDictionary, worthAskingAi } from "./translate";

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
  });

  it("never shows the same word two days running, and uses the whole pool", () => {
    const pool = wordOfTheDayPool().length;
    const seen = new Set<string>();
    let previous = "";
    for (let d = 0; d < pool * 4; d++) {
      const id = wordOfTheDay(new Date(2026, 0, 1 + d, 12)).id;
      expect(id).not.toBe(previous);
      previous = id;
      seen.add(id);
    }
    expect(seen.size).toBe(pool);
  });

  it("attaches every origin story to a real word", () => {
    expect(unknownOriginIds()).toEqual([]);
    expect(getEntry("DO.guagua")?.origin).toContain("wagon");
    expect(getEntry("CL.guagua")?.origin).toContain("wawa");
    expect(getEntry("DO.cocaleca")?.definition).toContain("Santo Domingo");
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
    // A plain word never becomes a vulgar one.
    expect(join(translateWithDictionary("¡Qué cosito!", "AR", "CL").target)).toBe("¡Qué cosa!");
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
  it("writes what the listener hears into the translation", () => {
    const result = translateWithDictionary("Voy a coger un taxi", "MX", "UY");
    expect(join(result.target)).toBe("Voy a tener sexo con un taxi");
    expect(result.via).toBe("dictionary");
    expect(result.pairs[0]).toMatchObject({
      from: { text: "coger" },
      to: { text: "tener sexo con" },
    });
  });

  it("conjugates and keeps capitals", () => {
    const result = translateWithDictionary("Cogí el móvil", "ES", "AR");
    expect(join(result.target)).toBe("Tuve sexo con el celu");
  });

  it("makes the article agree with the new word", () => {
    const result = translateWithDictionary("Me gusta la papaya", "DO", "CU");
    expect(join(result.target)).toBe("Me gusta la vulva");
    const pico = translateWithDictionary("Tengo una pija", "ES", "AR");
    expect(join(pico.target)).toBe("Tengo un pene");
  });

  it("leaves words alone where they are harmless", () => {
    const result = translateWithDictionary("Voy a coger el bus", "AR", "ES");
    expect(join(result.target)).toBe("Voy a coger el bus");
  });

  it("explains the meaning for AI translations", () => {
    const [w] = translateWithDictionary("Cogí el bus", "ES", "AR").warnings;
    expect(warningText(w)).toBe("En Argentina, «coger» significa: tener sexo.");
  });
});

describe("agreement with the swapped word", () => {
  const t = (s: string, from: DialectCode, to: DialectCode) =>
    join(translateWithDictionary(s, from, to).target);

  it("changes the article and the adjectives after the noun", () => {
    expect(t("Pásame la pajita roja", "ES", "PA")).toBe("Pásame el carrizo rojo");
    expect(t("Compré una pajita nueva y bonita", "ES", "PA")).toBe(
      "Compré un carrizo nuevo y bonito",
    );
  });

  it("changes an adjective after es / está", () => {
    expect(t("La pajita está rota", "ES", "PA")).toBe("El carrizo está roto");
  });

  it("contracts de + el", () => {
    expect(t("El color de la pajita", "ES", "PA")).toBe("El color del carrizo");
  });

  it("leaves verbs and other words alone", () => {
    expect(t("La pajita cuesta poco", "ES", "PA")).toBe("El carrizo cuesta poco");
  });

  it("does nothing when the gender is the same", () => {
    expect(t("La gasolina está cara", "ES", "AR")).toBe("La nafta está cara");
  });
});

describe("spelling in the translation", () => {
  const t = (s: string, from: DialectCode, to: DialectCode) =>
    join(translateWithDictionary(s, from, to).target);

  it("restores missing accents and ñ", () => {
    expect(t("Una bolsa de plastico para el nino", "DO", "CO")).toBe(
      "Una bolsa de plástico para el niño",
    );
    expect(t("Despues del cafe", "DO", "CO")).toBe("Después del café");
  });

  it("leaves words that are valid both ways", () => {
    expect(t("Esta es mi papa", "DO", "CO")).toBe("Esta es mi papa");
    expect(t("Yo termino el trabajo", "DO", "CO")).toBe("Yo termino el trabajo");
  });
});

describe("singular and plural", () => {
  const t = (s: string, from: DialectCode, to: DialectCode) =>
    join(translateWithDictionary(s, from, to).target);

  it("makes the words before the noun plural when the new word is plural", () => {
    expect(t("Quiero mucha cocaleca", "DO", "ES")).toBe("Quiero muchas palomitas");
  });

  it("and singular the other way", () => {
    expect(t("Quiero muchas palomitas", "ES", "DO")).toBe("Quiero mucha cocaleca");
  });

  it("changes the verb and adjective after the noun too", () => {
    expect(t("La cocaleca está rica", "DO", "MX")).toBe("Las palomitas están ricas");
  });

  it("handles gender and number at once", () => {
    expect(t("Los frijoles están buenos", "MX", "DO")).toBe("Las habichuelas están buenas");
  });

  it("does not treat singular words ending in s as plural", () => {
    expect(t("El autobús está lleno", "ES", "DO")).toBe("La guagua está llena");
  });
});

describe("other countries", () => {
  it("shows each word once, with every country that says it", () => {
    const groups = otherWaysByWord("aguacate", "MX");
    const palta = groups.find((g) => g.text === "palta");
    expect(palta?.dialects.sort()).toEqual(["AR", "BO", "CL", "PE", "UY"]);
    expect(groups.filter((g) => g.text === "palta")).toHaveLength(1);
    expect(groups[0].text).toBe("palta"); // most widely used first
  });
});

describe("sharing into Hola", () => {
  const shared = (q: Record<string, string>) => sharedText(new URLSearchParams(q));

  it("takes the shared text and drops links", () => {
    expect(shared({ text: "Vamos en guagua https://example.com/x" })).toBe("Vamos en guagua");
    expect(shared({ url: "https://example.com" })).toBe("");
  });

  it("uses the title only when there is no text", () => {
    expect(shared({ title: "WhatsApp", text: "Quiero cocaleca" })).toBe("Quiero cocaleca");
    expect(shared({ title: "Quiero cocaleca" })).toBe("Quiero cocaleca");
  });
});


describe("dichos", () => {
  const t = (s: string, from: DialectCode, to: DialectCode) =>
    join(translateWithDictionary(s, from, to).target);

  it("swap a country's expression for the other country's, like words", () => {
    expect(t("Tu primo está como una cabra", "ES", "AR")).toBe("Tu primo está del tomate");
    expect(t("Mañana vamos a hacer novillos", "ES", "PE")).toBe("Mañana vamos a hacer la vaca");
  });

  it("use plain words where the other country has no expression of its own", () => {
    expect(t("No hay tos, mañana lo vemos", "MX", "CO")).toBe("No hay problema, mañana lo vemos");
  });

  it("are listed in their guide", () => {
    const rows = guideRows("dichos", "ES", "AR").map((r) => [r.from.display, r.to.display]);
    expect(rows).toContainEqual(["como una cabra", "del tomate"]);
  });
});

describe("sayings said everywhere", () => {
  it("come out as what they mean, however they were spelled", () => {
    const r = translateWithDictionary("A caballo regalao no se le miran lo diente", "DO", "AR");
    expect(join(r.target)).toBe("No hay que ponerle defectos a lo que te regalan");
    expect(r.pairs[0]).toMatchObject({ from: { text: "a caballo regalado no se le mira el diente" }, meaning: "refrán" });
  });
});

describe("word details", () => {
  it("every word has a pronunciation and an example", () => {
    const missing = allEntries().filter((e) => !e.pronunciation || !e.example).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it("keeps hand-written details over the written-for-all ones", () => {
    expect(getEntry("DO.a-la-brigandina")?.pronunciation).toBe("ah lah bree-gahn-DEE-nah");
    expect(getEntry("AR.del-tomate")?.antonyms).toEqual(["cuerdo"]);
  });
});

describe("sayings with their own version in each country", () => {
  const t = (s: string, from: DialectCode, to: DialectCode) =>
    join(translateWithDictionary(s, from, to).target);

  it("swap the whole saying, never word by word", () => {
    expect(t("Al que le sirva el sombrero que se lo ponga", "DO", "AR")).toBe(
      "Al que le quede el saco, que se lo ponga",
    );
    expect(t("Al que le quede el saco, que se lo ponga", "AR", "ES")).toBe("El que se pica, ajos come");
  });

  it("stay the same where it is said the same", () => {
    expect(t("Al que le quede el saco, que se lo ponga", "AR", "MX")).toBe(
      "Al que le quede el saco, que se lo ponga",
    );
  });
});

describe("words from another country", () => {
  it("are found even when the text's country doesn't use them", () => {
    const r = translateAnyCountry("palta", "MX", "DO");
    expect(join(r.target)).toBe("aguacate");
    expect(r.via).toBe("dictionary");
  });

  it("only sentences are worth the AI", () => {
    expect(worthAskingAi("palta")).toBe(false);
    expect(worthAskingAi("diablo mami")).toBe(false);
    expect(worthAskingAi("ta de todo el día")).toBe(true);
  });
});

describe("knownEntry", () => {
  it("finds the dictionary's word for a page the AI wrote", () => {
    expect(knownEntry("Palta", "MX")?.text).toBe("palta");
    expect(knownEntry("guagua", "CL")?.id).toBe("CL.guagua");
    expect(knownEntry("no existe")).toBeUndefined();
  });
});

// From the user test (research/user-test): phrases people from each country
// typed, and what must come out.
describe("user test phrases", () => {
  const t = (s: string, from: DialectCode, to: DialectCode) =>
    join(translateWithDictionary(s, from, to).target);

  it("people keep their gender", () => {
    expect(t("La canche de la clase es nueva", "GT", "ES")).toBe("La rubia de la clase es nueva");
    expect(t("Vino con la jaña al concierto", "NI", "SV")).toBe("Vino con la novia al concierto");
    expect(t("Estoy chupando con los cuates", "BO", "PE")).toBe("Estoy chupando con los causas");
  });

  it("adjectives agree with the translated noun", () => {
    expect(t("El carrete estuvo bacán", "CL", "AR")).toBe("La joda estuvo copada");
    expect(t("Esa fiesta estuvo bien padre", "MX", "CO")).toBe("Esa fiesta estuvo bien bacana");
    expect(t("La moto está tuani", "NI", "HN")).toBe("La moto está maciza");
  });

  it("feminine forms and plurals are recognized", () => {
    expect(t("Neta, la presentación quedó bien chida", "MX", "AR")).toBe("Posta, la presentación quedó bien copada");
    expect(t("Los gurises están en la plaza", "UY", "ES")).toBe("Los chavales están en la plaza");
  });

  it("words that mean something else are filed right", () => {
    expect(t("Diay, ¿qué hacemos hoy?", "CR", "AR")).toBe("Bueno, ¿qué hacemos hoy?");
    expect(t("La guagua de AMA pasa cada media hora", "PR", "ES")).toBe("El autobús de AMA pasa cada media hora");
    expect(t("Se me perdió la birome", "PY", "AR")).toBe("Se me perdió la birome");
    expect(t("Mañana tengo camello temprano", "CO", "MX")).toBe("Mañana tengo chamba temprano");
  });

  it("everyday words from every country", () => {
    expect(t("¿Qué xopá, fren? Te mando el contrato", "PA", "CO")).toBe("¿Qué más, compa? Te mando el contrato");
    expect(t("Dame un chin de tiempo para revisar", "DO", "AR")).toBe("Dame un poco de tiempo para revisar");
    expect(t("Tengo mucho brete esta semana, mae", "CR", "MX")).toBe("Tengo mucha chamba esta semana, cuate");
  });
});

describe("Dominican 'ta'", () => {
  it("translates and isn't taken for Uruguay's 'ta'", () => {
    expect(join(translateWithDictionary("Eso ta de to", "DO", "AR").target)).toBe("Eso está buenísimo");
    expect(suggestCountry("eso ta de to", "DO", "AR")).toBeNull();
  });
});
