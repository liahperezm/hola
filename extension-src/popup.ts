/// <reference types="chrome" />
/*
 * The popup: "De" and "A", like a browser's translator. "De" starts on
 * "Detectar", which reads the page and says what it found.
 */
import { DIALECTS, PICKABLE_DIALECTS, isDialectCode } from "../src/lib/dialects";
import { LANGUAGE_CODES, LANGUAGE_NAMES, LANGUAGES, isLanguageCode } from "../src/lib/languages";
import type { Detection, Request, Response, Side } from "./messages";

const ui: "es" | "en" = chrome.i18n.getUILanguage().startsWith("es") ? "es" : "en";
const TEXT = {
  es: {
    from: "De", to: "A", detect: "Detectar idioma", swap: "Intercambiar",
    translate: "Traducir página", original: "Ver original", spanish: "Español", others: "Otros idiomas",
    detected: (what: string) => `Detectado: ${what}`, spanishOf: (c: string) => `español de ${c}`,
    unknownSpanish: "español (país sin detectar)", unknown: "no se pudo detectar",
    pickFrom: "Elige el idioma de la página", same: "Elige dos idiomas o países distintos.",
    working: "Traduciendo…", done: (n: number) => (n === 1 ? "1 fragmento traducido." : `${n} fragmentos traducidos.`),
    nothing: "No encontramos nada que se diga distinto.",
    needsTranslator: "Para otros idiomas hace falta el traductor integrado de Chrome (Chrome 138 o posterior). Entre países hispanohablantes funciona en cualquier navegador.",
    needsDownload: "Chrome necesita descargar el idioma: haz clic en el botón que apareció en la página.",
    failed: "No pudimos traducir esta página.", cantRun: "Hola no puede traducir esta página (páginas del navegador o de la tienda).",
    open: "Abrir Hola",
  },
  en: {
    from: "From", to: "To", detect: "Detect language", swap: "Swap",
    translate: "Translate page", original: "Show original", spanish: "Spanish", others: "Other languages",
    detected: (what: string) => `Detected: ${what}`, spanishOf: (c: string) => `Spanish from ${c}`,
    unknownSpanish: "Spanish (country not detected)", unknown: "couldn't detect",
    pickFrom: "Choose the page's language", same: "Choose two different languages or countries.",
    working: "Translating…", done: (n: number) => (n === 1 ? "1 passage translated." : `${n} passages translated.`),
    nothing: "Nothing here is said differently.",
    needsTranslator: "Other languages need Chrome's built-in translator (Chrome 138 or later). Between Spanish-speaking countries it works in any browser.",
    needsDownload: "Chrome needs to download the language: click the button that appeared on the page.",
    failed: "We couldn't translate this page.", cantRun: "Hola can't translate this page (browser or store pages).",
    open: "Open Hola",
  },
}[ui];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fromSelect = $<HTMLSelectElement>("from");
const toSelect = $<HTMLSelectElement>("to");
const status = $<HTMLParagraphElement>("status");
const button = $<HTMLButtonElement>("go");

const countryName = (code: keyof typeof DIALECTS) => (ui === "es" ? DIALECTS[code].name : DIALECTS[code].nameEn);
const encode = (s: Side) => `${s.kind}:${s.code}`;
function decode(value: string): Side | null {
  const [kind, code] = value.split(":");
  if (kind === "dialect" && isDialectCode(code)) return { kind, code };
  if (kind === "language" && isLanguageCode(code)) return { kind, code };
  return null;
}

function fill(select: HTMLSelectElement, withDetect: boolean) {
  if (withDetect) select.add(new Option(TEXT.detect, "auto"));
  const spanish = document.createElement("optgroup");
  spanish.label = TEXT.spanish;
  for (const code of [...PICKABLE_DIALECTS].sort((a, b) => countryName(a).localeCompare(countryName(b), ui))) {
    spanish.append(new Option(countryName(code), `dialect:${code}`));
  }
  const others = document.createElement("optgroup");
  others.label = TEXT.others;
  for (const code of LANGUAGE_CODES) {
    others.append(new Option(`${LANGUAGES[code].name}`, `language:${code}`));
  }
  select.append(spanish, others);
}

let tabId: number | undefined;
let detection: Detection | null = null;
let translated = false;

async function send(message: Request): Promise<Response> {
  if (tabId === undefined) return { ok: false, error: "failed" };
  return chrome.tabs.sendMessage(tabId, message);
}

/** What "Detectar" stands for on this page. */
function detectedSide(): Side | null {
  if (!detection?.language) return null;
  if (detection.language === "es") return detection.dialect ? { kind: "dialect", code: detection.dialect } : null;
  return { kind: "language", code: detection.language };
}

function describe(d: Detection | null): string {
  if (!d?.language) return TEXT.detected(TEXT.unknown);
  if (d.language === "es") return TEXT.detected(d.dialect ? TEXT.spanishOf(countryName(d.dialect)) : TEXT.unknownSpanish);
  return TEXT.detected(LANGUAGE_NAMES[ui][d.language]);
}

function render() {
  button.textContent = translated ? TEXT.original : TEXT.translate;
  if (fromSelect.value === "auto") status.textContent = describe(detection);
}

async function go() {
  if (translated) {
    await send({ type: "restore" });
    translated = false;
    status.textContent = "";
    render();
    return;
  }
  const from = fromSelect.value === "auto" ? detectedSide() : decode(fromSelect.value);
  const to = decode(toSelect.value);
  if (!from || !to) {
    status.textContent = TEXT.pickFrom;
    fromSelect.focus();
    return;
  }
  status.textContent = TEXT.working;
  button.disabled = true;
  const r = await send({ type: "translate", from, to });
  button.disabled = false;
  if (r.ok) {
    translated = true;
    status.textContent = r.changed ? TEXT.done(r.changed) : TEXT.nothing;
  } else {
    status.textContent =
      r.error === "same" ? TEXT.same
      : r.error === "needs-translator" ? TEXT.needsTranslator
      : r.error === "needs-download" ? TEXT.needsDownload
      : TEXT.failed;
  }
  render();
}

async function start() {
  document.documentElement.lang = ui;
  $("from-label").textContent = TEXT.from;
  $("to-label").textContent = TEXT.to;
  $("swap").setAttribute("aria-label", TEXT.swap);
  $<HTMLAnchorElement>("open").textContent = TEXT.open;
  fill(fromSelect, true);
  fill(toSelect, false);

  const saved = await chrome.storage.local.get(["from", "to"]);
  fromSelect.value = typeof saved.from === "string" ? saved.from : "auto";
  toSelect.value = typeof saved.to === "string" ? saved.to : "dialect:DO";
  if (!fromSelect.value) fromSelect.value = "auto";
  if (!toSelect.value) toSelect.value = "dialect:DO";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  try {
    if (tabId === undefined) throw new Error("no tab");
    await chrome.scripting.executeScript({ target: { tabId }, files: ["dist/content.js"] });
    const r = await send({ type: "detect" });
    if (r.ok) {
      detection = r.detection ?? null;
      translated = Boolean(r.translated);
    }
  } catch {
    status.textContent = TEXT.cantRun;
    button.disabled = true;
  }
  render();
}

for (const select of [fromSelect, toSelect]) {
  select.addEventListener("change", () => {
    void chrome.storage.local.set({ from: fromSelect.value, to: toSelect.value });
    if (select === fromSelect && fromSelect.value !== "auto") status.textContent = "";
    render();
  });
}
$("swap").addEventListener("click", () => {
  const from = fromSelect.value === "auto" ? (detectedSide() ? encode(detectedSide()!) : "auto") : fromSelect.value;
  fromSelect.value = toSelect.value;
  if (from !== "auto") toSelect.value = from;
  void chrome.storage.local.set({ from: fromSelect.value, to: toSelect.value });
  render();
});
button.addEventListener("click", () => void go());
void start();
