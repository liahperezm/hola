import { afterEach, describe, expect, it, vi } from "vitest";
import { learnWithDictionary } from "./learn";

const parse = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse } };
  },
}));

const join = (segments: { text: string }[]) => segments.map((s) => s.text).join("");

describe("learner dictionary (no AI)", () => {
  it("answers a single English word with the country's word", () => {
    const r = learnWithDictionary("popcorn", "DO", "to-spanish");
    expect(join(r.target)).toBe("cocaleca");
    expect(r.words[0]).toMatchObject({ spanish: "cocaleca", english: "popcorn", id: "DO.cocaleca" });
  });

  it("ignores articles and alternative glosses", () => {
    expect(join(learnWithDictionary("the bus", "DO", "to-spanish").target)).toBe("guagua");
    expect(join(learnWithDictionary("mobile", "ES", "to-spanish").target)).toBe("móvil");
  });

  it("lists the words it knows in a sentence it can't translate", () => {
    const r = learnWithDictionary("I want popcorn on the bus", "DO", "to-spanish");
    expect(r.target).toEqual([]);
    expect(r.words.map((w) => w.spanish).sort()).toEqual(["cocaleca", "guagua"]);
  });

  it("explains a country's words from Spanish", () => {
    const r = learnWithDictionary("Vamos en guagua a comprar cocaleca", "DO", "to-english");
    expect(r.words.map((w) => w.english).sort()).toEqual(["bus", "popcorn"]);
  });
});

describe("POST /api/learn with the AI", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    parse.mockReset();
  });

  it("translates English into the country's Spanish and links known words", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test");
    vi.stubEnv("LEARNER_ENGINE", "ai");
    parse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: {
        translation: "Voy a coger la guagua.",
        words: [{ spanish: "guagua", english: "bus", pronunciation: "GWAH-gwah" }],
      },
    });
    const { POST } = await import("@/app/api/learn/route");
    const res = await POST(
      new Request("http://localhost/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
        body: JSON.stringify({ text: "I'm going to take the bus.", dialect: "DO", direction: "to-spanish" }),
      }),
    );
    const body = (await res.json()) as { result: { target: { text: string; highlight?: boolean }[]; words: { id?: string }[]; via: string } };
    expect(res.status).toBe(200);
    expect(body.result.via).toBe("ai");
    expect(join(body.result.target)).toBe("Voy a coger la guagua.");
    expect(body.result.target.find((s) => s.highlight)?.text).toBe("guagua");
    expect(body.result.words[0].id).toBe("DO.guagua");
    // The prompt carries the country's words from Hola's dictionary.
    const system = (parse.mock.calls[0][0] as { system: string }).system;
    expect(system).toContain("República Dominicana");
    expect(system).toContain("popcorn → cocaleca");
  });
});
