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
- **Ajustes**: the countries the translator opens with, clear favorites.

Countries: República Dominicana, Colombia, Argentina, México, Venezuela, Puerto
Rico, Cuba, España, Chile, Uruguay and Perú.

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

Add a concept to `CONCEPTS` in `src/lib/dictionary.ts`:

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
