import { describe, expect, it } from "vitest";
import { splitForService } from "./machine-translation";

describe("splitForService", () => {
  it("keeps short text whole", () => {
    expect(splitForService("Hello there. How are you?")).toEqual([
      { text: "Hello there. How are you?", after: "" },
    ]);
  });

  it("splits long text between sentences and puts it back together", () => {
    const sentence = "I want popcorn before we take the bus to the beach today. ";
    const text = sentence.repeat(20).trim();
    const pieces = splitForService(text);
    expect(pieces.length).toBeGreaterThan(1);
    for (const p of pieces) expect(new TextEncoder().encode(p.text).length).toBeLessThanOrEqual(480);
    expect(pieces.map((p) => p.text + p.after).join("")).toBe(text);
  });

  it("counts bytes, so accents and other alphabets fit too", () => {
    const text = "我想在坐公交车之前吃爆米花".repeat(30);
    const pieces = splitForService(text);
    for (const p of pieces) expect(new TextEncoder().encode(p.text).length).toBeLessThanOrEqual(480);
    expect(pieces.map((p) => p.text + p.after).join("")).toBe(text);
  });

  it("cuts a very long sentence between words", () => {
    const text = "word ".repeat(300).trim();
    const pieces = splitForService(text);
    for (const p of pieces) expect(new TextEncoder().encode(p.text).length).toBeLessThanOrEqual(480);
    expect(pieces.map((p) => p.text + p.after).join("")).toBe(text);
  });
});
