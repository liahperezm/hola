import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/suggestions/route";

const valid = {
  kind: "agregar",
  country: "DO",
  word: "cocaleca",
  meaning: "Palomitas de maíz @alguien #1",
  example: "Hicimos cocaleca.",
  fromThere: true,
  context: "Explorar",
};

const post = (body: unknown, ip = "1.1.1.1") =>
  POST(
    new Request("http://localhost/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/suggestions", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("says when suggestions are not set up", async () => {
    vi.stubEnv("SUGGESTIONS_GITHUB_TOKEN", "");
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("files a labeled GitHub issue without pinging anyone", async () => {
    vi.stubEnv("SUGGESTIONS_GITHUB_TOKEN", "token");
    vi.stubEnv("SUGGESTIONS_GITHUB_REPO", "owner/hola");
    const res = await post(valid, "2.2.2.2");
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/owner/hola/issues");
    const body = JSON.parse(String(init.body)) as { title: string; body: string; labels: string[] };
    expect(body.title).toBe("Agregar: cocaleca (República Dominicana)");
    expect(body.labels).toEqual(["sugerencia"]);
    expect(body.body).toContain("**¿Es de ese país?** Sí");
    expect(body.body).not.toContain("@alguien");
    expect(body.body).not.toMatch(/#1/);
  });

  it("quietly drops bots that fill the hidden field", async () => {
    vi.stubEnv("SUGGESTIONS_GITHUB_TOKEN", "token");
    vi.stubEnv("SUGGESTIONS_GITHUB_REPO", "owner/hola");
    const res = await post({ ...valid, website: "http://spam" }, "3.3.3.3");
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects incomplete suggestions", async () => {
    const res = await post({ ...valid, meaning: "" }, "4.4.4.4");
    expect(res.status).toBe(400);
  });
});
