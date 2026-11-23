import { describe, expect, it } from "vitest";
import { findSayings } from "./sayings";

describe("findSayings", () => {
  it("recognizes a saying however it is spelled", () => {
    const [m] = findSayings("Mira, a caballo regalao no se le miran lo diente");
    expect(m.saying.text).toBe("a caballo regalado no se le mira el diente");
    expect(m.replacement).toBe("no hay que ponerle defectos a lo que te regalan");
  });

  it("leaves ordinary sentences alone", () => {
    expect(findSayings("Le regalaron un caballo a mi hermano")).toEqual([]);
    expect(findSayings("Más vale que llegues temprano")).toEqual([]);
  });
});
