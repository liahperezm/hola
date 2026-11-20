import { describe, expect, it } from "vitest";
import { locate } from "./ai";

describe("locate", () => {
  it("highlights each term the model reported, ignoring case", () => {
    expect(locate("Ese Pana es chévere", ["pana", "chévere"])).toEqual([
      { text: "Ese " },
      { text: "Pana", highlight: true },
      { text: " es " },
      { text: "chévere", highlight: true },
    ]);
  });

  it("leaves the text whole when a term is missing", () => {
    expect(locate("Hola", ["adiós"])).toEqual([{ text: "Hola" }]);
  });

  it("does not overlap terms", () => {
    expect(locate("a la brigandina", ["a la brigandina", "brigandina"])).toEqual([
      { text: "a la brigandina", highlight: true },
    ]);
  });
});
