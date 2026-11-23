/// <reference types="chrome" />
/*
 * Translates the page in place, like a browser's own translator, but between
 * the Spanish of different countries (with Hola's dictionary, inside the
 * extension) and, in Chrome, from and to other languages (with Chrome's
 * built-in, on-device Translator, then Hola's words for the country).
 */
import { DIALECTS, type DialectCode } from "../src/lib/dialects";
import { detectDialect } from "../src/lib/detect";
import { detectLanguage } from "../src/lib/detect-language";
import { localizeFromNeutral, neutralize, translateWithDictionary, type Segment } from "../src/lib/translate";
import type { Detection, Request, Response, Side } from "./messages";

declare global {
  interface Window {
    __holaLoaded?: boolean;
  }
}

type TranslatorLike = { translate(text: string): Promise<string> };
type TranslatorApi = {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(o: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorLike>;
};
const translatorApi = (globalThis as unknown as { Translator?: TranslatorApi }).Translator;

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "CODE", "PRE", "SVG", "MATH"]);
const MARK = "data-hola";

/** Text nodes worth translating, outside code, forms and Hola's own marks. */
function textNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest(`[${MARK}], [contenteditable=""], [contenteditable="true"], [translate="no"]`)) {
        return NodeFilter.FILTER_REJECT;
      }
      for (let el: Element | null = parent; el; el = el.parentElement) {
        if (SKIP.has(el.tagName.toUpperCase())) return NodeFilter.FILTER_REJECT;
      }
      return /\p{L}/u.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  return nodes;
}

function detect(): Detection {
  const sample = textNodes(document.body)
    .map((n) => n.nodeValue)
    .join(" ")
    .slice(0, 6000);
  const declared = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
  const language = detectLanguage(sample) ?? (declared === "es" ? "es" : null);
  const dialect = language === "es" ? (detectDialect(sample)?.dialect ?? null) : null;
  return { language: language as Detection["language"], dialect };
}

/** Replaces a text node with the translation; changed words are marked. */
function replace(node: Text, segments: Segment[], originals: string[], from: string) {
  const wrapper = document.createElement("span");
  wrapper.setAttribute(MARK, "");
  wrapper.dataset.holaOriginal = node.nodeValue ?? "";
  let k = 0;
  for (const s of segments) {
    if (s.highlight) {
      const word = document.createElement("span");
      word.className = "hola-word";
      word.textContent = s.text;
      const original = originals[k++];
      if (original) word.title = `${original} (${from})`;
      wrapper.append(word);
    } else {
      wrapper.append(s.text);
    }
  }
  node.replaceWith(wrapper);
}

function replaceText(node: Text, text: string) {
  const wrapper = document.createElement("span");
  wrapper.setAttribute(MARK, "");
  wrapper.dataset.holaOriginal = node.nodeValue ?? "";
  wrapper.textContent = text;
  node.replaceWith(wrapper);
}

function restore() {
  observer?.disconnect();
  observer = null;
  current = null;
  for (const el of document.querySelectorAll<HTMLElement>(`[${MARK}]`)) {
    el.replaceWith(document.createTextNode(el.dataset.holaOriginal ?? ""));
  }
  document.body.normalize();
}

let current: { from: Side; to: Side; translators: Map<string, TranslatorLike> } | null = null;
let observer: MutationObserver | null = null;

async function translator(source: string, target: string, cache: Map<string, TranslatorLike>) {
  const key = `${source}>${target}`;
  const found = cache.get(key);
  if (found) return found;
  if (!translatorApi) throw new Error("needs-translator");
  // Some builds of Chrome have the API but no models, and never answer.
  const availability = await within(
    translatorApi.availability({ sourceLanguage: source, targetLanguage: target }),
    4000,
  ).catch(() => "unavailable");
  if (availability === "unavailable") throw new Error("needs-translator");
  try {
    const t = await within(translatorApi.create({ sourceLanguage: source, targetLanguage: target }), 60000);
    cache.set(key, t);
    return t;
  } catch {
    // Downloading a language needs a click on the page itself.
    throw new Error(availability === "available" ? "failed" : "needs-download");
  }
}

function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

/** Translates the given nodes; returns how many changed. */
async function translateNodes(nodes: Text[], from: Side, to: Side, cache: Map<string, TranslatorLike>) {
  let changed = 0;
  const label = (s: Side) => (s.kind === "dialect" ? DIALECTS[s.code].name : s.code.toUpperCase());

  if (from.kind === "dialect" && to.kind === "dialect") {
    for (const node of nodes) {
      const r = translateWithDictionary(node.nodeValue ?? "", from.code, to.code);
      if (r.via === "none") continue;
      const originals = r.source.filter((s) => s.highlight).map((s) => s.text);
      replace(node, r.target, originals, label(from));
      changed++;
    }
    return changed;
  }

  // Another language on one side: Chrome's translator through standard
  // Spanish, and Hola's words for the country.
  const source = from.kind === "language" ? from.code : "es";
  const target = to.kind === "language" ? to.code : "es";
  const t = source === target ? null : await translator(source, target, cache);
  for (const node of nodes) {
    let text = node.nodeValue ?? "";
    if (from.kind === "dialect") text = neutralize(text, from.code).text;
    if (t) text = await t.translate(text);
    if (to.kind === "dialect") {
      const local = localizeFromNeutral(text, to.code);
      const originals = local.source.filter((s) => s.highlight).map((s) => s.text);
      replace(node, local.target, originals, "español");
    } else {
      replaceText(node, text);
    }
    changed++;
  }
  return changed;
}

async function translatePage(from: Side, to: Side): Promise<Response> {
  if (from.kind === to.kind && from.code === to.code) return { ok: false, error: "same" };
  restore();
  const cache = new Map<string, TranslatorLike>();
  try {
    const changed = await translateNodes(textNodes(document.body), from, to, cache);
    current = { from, to, translators: cache };
    // Text the page adds later (infinite scroll, chats) is translated too.
    observer = new MutationObserver((records) => {
      if (!current) return;
      const added = records.flatMap((r) => [...r.addedNodes]).filter((n) => !(n instanceof Element && n.hasAttribute(MARK)));
      const nodes = added.flatMap((n) => (n.nodeType === Node.TEXT_NODE ? textNodes(n.parentNode ?? n) : textNodes(n)));
      if (nodes.length) void translateNodes(nodes, current.from, current.to, current.translators).catch(() => {});
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return { ok: true, translated: true, changed };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "failed";
    if (reason === "needs-download") offerDownload(from, to);
    return { ok: false, error: reason === "needs-translator" || reason === "needs-download" ? reason : "failed" };
  }
}

/** Chrome downloads a language only after a click on the page. */
function offerDownload(from: Side, to: Side) {
  document.getElementById("hola-download")?.remove();
  const bar = document.createElement("button");
  bar.id = "hola-download";
  bar.setAttribute(MARK, "");
  bar.type = "button";
  bar.textContent = "Hola: haz clic para descargar el traductor y traducir esta página";
  bar.addEventListener("click", () => {
    bar.remove();
    void translatePage(from, to);
  });
  document.body.append(bar);
}

const style = document.createElement("style");
style.id = "hola-style";
style.textContent = `
  .hola-word { text-decoration: underline dotted; text-underline-offset: 3px; cursor: help; }
  #hola-download { position: fixed; z-index: 2147483647; left: 50%; bottom: 20px; transform: translateX(-50%);
    background: #030050; color: #fff; border: 0; border-radius: 999px; padding: 12px 20px;
    font: 600 15px system-ui, sans-serif; box-shadow: 0 6px 20px rgb(0 0 0 / .25); cursor: pointer; }
`;

if (!window.__holaLoaded) {
  window.__holaLoaded = true;
  document.head.append(style);
  chrome.runtime.onMessage.addListener((message: Request, _sender, reply: (r: Response) => void) => {
    if (message.type === "detect") reply({ ok: true, detection: detect(), translated: Boolean(current) });
    else if (message.type === "status") reply({ ok: true, translated: Boolean(current) });
    else if (message.type === "restore") {
      restore();
      reply({ ok: true, translated: false });
    } else if (message.type === "translate") {
      void translatePage(message.from, message.to).then(reply);
      return true;
    }
    return false;
  });
}
