import { describe, expect, it } from "vitest";
import { detectDialect } from "./detect";

describe("detectDialect", () => {
  it("recognizes a country from its own words", () => {
    expect(detectDialect("El carajito hizo eso a la brigandina")?.dialect).toBe("DO");
    expect(detectDialect("Quiero mucha cocaleca")?.dialect).toBe("DO");
    expect(detectDialect("Está chingón, güey")?.dialect).toBe("MX");
    expect(detectDialect("Qué chimba, parce")?.dialect).toBe("CO");
  });

  it("says nothing about standard Spanish", () => {
    expect(detectDialect("Buenos días a todos")).toBeNull();
    expect(detectDialect("Quiero un jugo de naranja")).toBeNull();
    expect(detectDialect("")).toBeNull();
  });

  it("keeps the country already chosen when it fits as well", () => {
    expect(detectDialect("El carajito hizo eso a la brigandina", "DO")).toBeNull();
  });
});
