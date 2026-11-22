import { NextResponse, type NextRequest } from "next/server";

/*
 * iPhone Shortcuts sometimes escape the "?" when they build the address for
 * shared text, so "/?text=hola" arrives as the path "/%3Ftext=hola". Send
 * any such address to the translator with the text it carries.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return NextResponse.next();
  }
  const match = /(?:^\/?|[?&/])text=([\s\S]*)$/.exec(decoded);
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("text", match[1]);
  return NextResponse.redirect(url);
}

export const config = {
  // Only paths that could hold shared text; never the app's own files or API.
  matcher: ["/((?!_next/|api/|icons/|sw.js|manifest.webmanifest).*text=.*)"],
};
