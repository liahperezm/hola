import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detect-language";

describe("detectLanguage", () => {
  it("recognizes common languages", () => {
    expect(detectLanguage("I want popcorn before we take the bus")).toBe("en");
    expect(detectLanguage("Je veux du pop-corn avant de prendre le bus")).toBe("fr");
    expect(detectLanguage("Eu quero pipoca antes de pegar o ônibus")).toBe("pt");
    expect(detectLanguage("Ich möchte Popcorn, bevor wir den Bus nehmen")).toBe("de");
    expect(detectLanguage("Voglio i popcorn prima di prendere l'autobus")).toBe("it");
    expect(detectLanguage("Mwen vle pòpkòn anvan nou pran bis la")).toBe("ht");
    expect(detectLanguage("我想在坐公交车之前吃爆米花")).toBe("zh");
    expect(detectLanguage("バスに乗る前にポップコーンが食べたい")).toBe("ja");
    expect(detectLanguage("버스 타기 전에 팝콘 먹고 싶어")).toBe("ko");
    expect(detectLanguage("أريد الفشار قبل أن نركب الحافلة")).toBe("ar");
  });

  it("recognizes Spanish from any country", () => {
    expect(detectLanguage("Quiero mucha cocaleca antes de coger la guagua")).toBe("es");
    expect(detectLanguage("Che boludo, ¿vamos al laburo?")).toBe("es");
    expect(detectLanguage("El carajito hizo eso a la brigandina")).toBe("es");
  });

  it("says nothing about short or unclear text", () => {
    expect(detectLanguage("guagua")).toBeNull();
    expect(detectLanguage("hot dog")).toBeNull();
    expect(detectLanguage("")).toBeNull();
  });
});
