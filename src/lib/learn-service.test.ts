import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/learn/route";
import { localizeFromNeutral, neutralize } from "./translate";
import { learnWithService, safeForCountry } from "./learn-service";

const join = (segments: { text: string }[]) => segments.map((s) => s.text).join("");

describe("standard Spanish made local", () => {
  it("uses the country's words and makes the article agree", () => {
    const r = localizeFromNeutral("Quiero palomitas antes de tomar el autobús", "DO");
    expect(join(r.target)).toBe("Quiero cocaleca antes de tomar la guagua");
    expect(r.pairs.map((p) => [p.to.text, p.en])).toEqual([
      ["cocaleca", "popcorn"],
      ["guagua", "bus"],
    ]);
  });

  it("works the other way for the translation service", () => {
    const r = neutralize("Vamos en guagua a comprar cocaleca", "DO");
    expect(r.text).toBe("Vamos en autobús a comprar palomitas de maíz");
    expect(r.found.map((e) => e.text)).toEqual(["guagua", "cocaleca"]);
  });

  it("swaps a verb that is vulgar where the learner is going", () => {
    expect(safeForCountry("Voy a coger el autobús", "AR")).toBe("Voy a tomar el autobús");
    expect(safeForCountry("Cogí el autobús", "MX")).toBe("Tomé el autobús");
    expect(safeForCountry("Voy a coger el autobús", "ES")).toBe("Voy a coger el autobús");
  });
});

describe("translation services", () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    fetchMock.mockReset();
  });

  it("uses MyMemory with no key, then makes the Spanish Dominican", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        responseStatus: 200,
        responseData: { translatedText: "Quiero palomitas antes de coger el autobús" },
      }),
    );
    const r = await learnWithService("I want popcorn before we take the bus", "DO", "to-spanish");
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.mymemory.translated.net");
    expect(String(fetchMock.mock.calls[0][0])).toContain("langpair=en%7Ces");
    // "coger" is fine in the Dominican Republic, so it stays.
    expect(join(r.target)).toBe("Quiero cocaleca antes de coger la guagua");
    expect(r.credit).toBe("MyMemory");
  });

  it("uses DeepL's free endpoint when its key is set", async () => {
    vi.stubEnv("DEEPL_API_KEY", "abc:fx");
    fetchMock.mockResolvedValue(Response.json({ translations: [{ text: "Voy a coger el autobús" }] }));
    const r = await learnWithService("I'm taking the bus", "AR", "to-spanish");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api-free.deepl.com/v2/translate");
    expect(JSON.parse(String(init.body))).toMatchObject({ source_lang: "EN", target_lang: "ES" });
    // Vulgar in Argentina, so the learner gets "tomar"; the bus is a colectivo.
    expect(join(r.target)).toBe("Voy a tomar el colectivo");
  });

  it("uses Microsoft Translator when its key and region are set, back to English", async () => {
    vi.stubEnv("AZURE_TRANSLATOR_KEY", "k");
    vi.stubEnv("AZURE_TRANSLATOR_REGION", "eastus");
    fetchMock.mockResolvedValue(Response.json([{ translations: [{ text: "Let's go by bus" }] }]));
    const r = await learnWithService("Vamos en guagua", "DO", "from-spanish");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.cognitive.microsofttranslator.com");
    expect(url).toContain("from=es&to=en");
    expect(JSON.parse(String(init.body))).toEqual([{ Text: "Vamos en autobús" }]);
    expect(join(r.target)).toBe("Let's go by bus");
    expect(r.words[0]).toMatchObject({ spanish: "guagua", english: "bus" });
  });

  it("translates from any language, not just English", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ responseStatus: 200, responseData: { translatedText: "Quiero muchas palomitas" } }),
    );
    const r = await learnWithService("Je veux beaucoup de pop-corn", "DO", "to-spanish", "fr");
    expect(String(fetchMock.mock.calls[0][0])).toContain("langpair=fr%7Ces");
    expect(join(r.target)).toBe("Quiero mucha cocaleca");
    expect(r.language).toBe("fr");
  });

  it("uses each service's own language codes", async () => {
    fetchMock.mockResolvedValue(Response.json({ responseStatus: 200, responseData: { translatedText: "公共汽车" } }));
    await learnWithService("guagua", "DO", "from-spanish", "zh");
    expect(String(fetchMock.mock.calls[0][0])).toContain("langpair=es%7Czh-CN");

    vi.stubEnv("DEEPL_API_KEY", "abc:fx");
    fetchMock.mockResolvedValue(Response.json({ translations: [{ text: "ônibus" }] }));
    await learnWithService("guagua", "DO", "from-spanish", "pt");
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ source_lang: "ES", target_lang: "PT-BR" });
  });

  it("falls back to the dictionary when the service fails", async () => {
    fetchMock.mockResolvedValue(new Response("busy", { status: 503 }));
    const res = await POST(
      new Request("http://localhost/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "7.7.7.7" },
        body: JSON.stringify({ text: "I want popcorn now", dialect: "DO", direction: "to-spanish" }),
      }),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { result: { words: { spanish: string }[] } };
    expect(body.result.words.map((w) => w.spanish)).toEqual(["cocaleca"]);
  });
});
