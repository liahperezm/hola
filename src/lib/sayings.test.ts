import { describe, expect, it } from "vitest";
import { findSayings } from "./sayings";

describe("findSayings", () => {
  it("recognizes a saying however it is spelled", () => {
    const [m] = findSayings("Mira, a caballo regalao no se le miran lo diente", "MX");
    expect(m.saying.text).toBe("a caballo regalado no se le mira el diente");
    expect(m.replacement).toBe("a caballo regalado no se le mira el diente");
    expect(m.saying.es).toContain("regalan");
  });

  it("uses the target country's own saying when it has one", () => {
    const [m] = findSayings("A quien madruga, Dios le ayuda", "MX");
    expect(m.replacement).toBe("el que madruga, Dios lo ayuda");
    const [back] = findSayings("El que madruga Dios lo ayuda", "ES");
    expect(back.replacement).toBe("a quien madruga, Dios le ayuda");
  });

  it("leaves ordinary sentences alone", () => {
    expect(findSayings("Le regalaron un caballo a mi hermano", "MX")).toEqual([]);
    expect(findSayings("Más vale que llegues temprano", "MX")).toEqual([]);
  });
});
