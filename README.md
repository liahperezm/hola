# Hola

Hola translates words and phrases between Spanish dialects: _guagua_ in the
Dominican Republic is _colectivo_ in Argentina and _camión_ in Mexico. It is an
installable, mobile-first web app (PWA) built from the
[Hola case study](https://liahperezdesign.com/portfolio/hola/) by Liah Pérez.

## What it does

- **Translator**: pick two countries (tap a side of the pill to change it,
  tap ⇄ to swap), then type, dictate with the microphone, or take a photo. Every
  regional word is shown in bold, with a card per word underneath. Both texts
  can be read aloud.
- **Phrase pages**: _Definición_ (pronunciation, meaning, antonyms, an example,
  how other countries say it) and _Origen_ (a bit of history). Save, copy or
  share any phrase.
- **Mi diccionario**: search every word, open _Favoritos_ (grouped by country)
  and the mini guides: _Básicos_, _Oficina_, _Viaje_ and _Comida_, each between
  any two countries.
- **Preferencias**: the countries the translator opens with, voice speed, install help.

Countries: all 22 in the lexicon: Argentina, Bolivia, Chile, Colombia, Costa
Rica, Cuba, Ecuador, El Salvador, España, Estados Unidos, Guatemala, Guinea
Ecuatorial, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, Puerto Rico,
República Dominicana, Uruguay and Venezuela. Estados Unidos and Guinea
Ecuatorial have no words of their own in the lexicon yet.

## How translation works

1. **Dictionary first** (`src/lib/dictionary.ts`, `src/lib/translate.ts`).
   A hand-made list of concepts, each with the words every country uses. The
   translator swaps every known word or phrase, longest match first, ignoring
   accents and case and handling simple plurals. This runs in the browser, is
   instant and free, and works offline.
2. **Claude when the dictionary has nothing** (`src/lib/ai.ts`). If no word is
   found, the server asks Claude (`claude-opus-5-5`, low effort, structured
   output) to rewrite the text in the other dialect and explain each word it
   changed. On a dictionary result, "Revisar toda la frase con IA" asks Claude
   to check the whole sentence. AI answers are labeled as such.
3. **Photos** go to Claude to read the text, which then goes through the same
   steps.

The AI requests use server-side fallbacks (`fallbacks: "default"`): if Claude
declines a request for policy reasons, the API retries it on its default
fallback model.

Without `ANTHROPIC_API_KEY` the app still works: the camera button is hidden and
only the dictionary is used.

Favorites, settings and AI explanations are stored in the browser
(`localStorage`). There are no accounts.

## First visit and returning visits

- **First visit:** a welcome screen, then "¿De dónde es tu español?" and
  "¿Con quién quieres hablar?". The answers become the translator's countries.
  A short tip sits in the empty translator until the first translation.
- **First saved word:** a one-time sheet explains how to install the app
  (Chrome's own prompt on Android, the Share menu steps on iPhone), since an
  installed app keeps its saved words safer than a browser tab.
- **Returning visits:** straight to the translator with the same countries.
- **Preferencias:** the two countries, voice speed, install help and
  "Sugerir una palabra o corrección".

## Suggestions from people in each country

The translator, every word page, Explorar (when a search finds nothing) and
Preferencias have a "Sugerir un cambio" form: country, word, what it means or
what is wrong, an example, and whether the person is from that country. Each
suggestion becomes a GitHub issue labeled `sugerencia` in
`SUGGESTIONS_GITHUB_REPO`, written with `SUGGESTIONS_GITHUB_TOKEN` (a
fine-grained token with "Issues: Read and write" on that repository only). Without
them the form falls back to `NEXT_PUBLIC_FEEDBACK_EMAIL`, or is hidden.

## Accessibility

Built and checked against WCAG 2.2 AA (Section 508 references WCAG 2.0 AA):
axe-core reports no violations on any screen, text meets 4.5:1 contrast, every
control has a visible focus ring and a spoken name, the word page uses the ARIA
tabs pattern, focus moves to the translation after translating, and the app
works at 320px wide, in landscape, and with reduced motion.

## Run it

Requires Node 22+ and pnpm 9.

```bash
pnpm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for the AI fallback
pnpm dev                     # http://localhost:3000
```

```bash
pnpm test        # dictionary and translation tests
pnpm typecheck
pnpm build
```

To try it on a phone, run `pnpm build && pnpm start` and open the computer's
network address from the phone, or deploy it.

## Deploy

Deploy to Vercel (or any Next.js host) and set `ANTHROPIC_API_KEY` in the
project's environment variables. On a phone, open the site and choose
_Add to Home Screen_ to install it.

The AI routes allow 20 requests per hour per IP address. The limit is kept in
memory, so it is per server instance. Set a monthly spend limit on the API key
in the Claude Console as well.

## Adding words

There are two sources of words:

- **Hand-made concepts** (`HAND_CONCEPTS` in `src/lib/dictionary.ts`), with pronunciation, definitions and
  origin stories. These always come first.
- **The imported lexicon** (`lexicon/`): 22 countries of regional vocabulary, slang, false friends and
  idioms. Its concepts are exported to `src/lib/lexicon.generated.ts` by
  `python3 lexicon/scripts/export_app.py`. See `lexicon/README.md`.

To hand-write a concept:

Add a concept to `HAND_CONCEPTS` in `src/lib/dictionary.ts`:

```ts
{
  id: "autobus",
  meaning: "autobús",          // neutral Spanish, used when a country has no word of its own
  guide: "viaje",              // which mini guide lists it
  terms: { DO: ["guagua"], AR: ["colectivo", "bondi"] },
  details: { DO: { pronunciation, definition, antonyms, example, origin } },
}
```

List only words that are distinctive in a country. The first word of a country
is the one translations use. Feminine forms go right after the masculine
(`["pibe", "piba"]`) and show as _pibe(a)_ in the guides. Run `pnpm test` after
editing.

The starter dictionary should be reviewed by native speakers from each country
before launch, especially the origin stories.

## Tests that catch regressions

Every deploy runs the tests first (`pnpm build` is `vitest run && next build`):
if one fails, Vercel doesn't publish and the live site stays as it was.

- **Phrases that must keep working.** Every phrase in
  `research/user-test/personas-*.txt` is translated on each run and compared
  with `research/user-test/approved.txt`. A changed translation fails the
  test and shows the old and new text. If the change is right, accept it with
  `pnpm test -u` and commit `approved.txt`; if not, it's a regression to fix.
  None of these phrases may ever ask "¿Es español de…?", since each persona
  speaks their own country's Spanish.
- **When something breaks or is reported, add the phrase** under the right
  country in the personas file (`> phrase | expected regional words`) and run
  `pnpm test -u`. From then on it is checked on every deploy.
- **Checks over the whole dictionary** (`src/lib/invariants.test.ts`): every
  word's example sentence must never look like another country's Spanish or
  another language, and must never come out vulgar when the word isn't. These
  grow with the dictionary on their own.
- **The full user test report:** `npx vitest run --config research/vitest.config.mts`
  writes `research/user-test/summary.txt` (coverage per country).
