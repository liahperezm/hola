import { describe, expect, it } from "vitest";
import { anonymize } from "./review-queue";

describe("phrases kept for review", () => {
  it("leave out numbers and email addresses", () => {
    expect(anonymize("Llámame al 809-555-1234 o escribe a ana@correo.com")).toBe(
      "Llámame al [número] o escribe a [correo]",
    );
    expect(anonymize("Eso ta de to")).toBe("Eso ta de to");
  });
});
