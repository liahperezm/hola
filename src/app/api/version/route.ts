/** The version of the deploy now live, so open apps can tell they're behind. */
export function GET() {
  return Response.json(
    { build: process.env.HOLA_BUILD },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const dynamic = "force-dynamic";
