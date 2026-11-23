# Hola user test: 117 personas

Date: November 2026.

## What this test is (and isn't)

This is a **simulated** user test. I wrote 117 personas grounded in the scenarios from the Hola case study, gave each one the phrases they would really type, and ran every phrase through Hola. I also walked the main screens in a browser the way six of them would.

It finds what the app gets wrong with real regional Spanish, and it fixed most of it. It does **not** replace sessions with real people. The personas' slang comes from my knowledge of each country, so the next step is to put the app in front of real speakers (see "Next steps").

## Who

- **Spanish speakers:** 105 personas, 5 for each of the 21 Spanish-speaking countries: Argentina, Bolivia, Chile, Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Spain, Guatemala, Equatorial Guinea, Honduras, Mexico, Nicaragua, Panama, Paraguay, Peru, Puerto Rico, Dominican Republic, Uruguay and Venezuela.
- **Speakers of other languages:** 12 personas who speak English (USA, UK, and a heritage speaker in New York), Portuguese, French, Haitian Creole, German, Italian, Chinese, Japanese, Korean and Arabic.
- **Ages:** 19 to 68 (19–29: 48; 30–44: 44; 45–59: 17; 60+: 8).
- **Scenarios, from the case study:**

  | Scenario | Personas |
  |---|---|
  | Work and presentations to clients in other countries | 22 |
  | Travel | 22 |
  | Family abroad | 21 |
  | Curiosity about words and where they come from | 20 |
  | Friends and chat | 18 |
  | Learning | 2 |
  | Speaker of another language | 12 |

The personas and their phrases are in `research/user-test/personas-1.txt` and `personas-2.txt`. Run the test again with:

```bash
npx vitest run --config research/vitest.config.mts
```

## Results

|  | Before | After |
|---|---|---|
| Regional words recognized | 180 of 268 (67%) | 250 of 268 (93%) |
| Wrong "¿Es español de…?" questions | 8 | 0 |
| Phrases that would need the AI (paid) | 63 | 20 |
| Other languages recognized | 21 of 24 | 24 of 24 |
| Accessibility checker (every page, 375 and 320 px) | — | No problems |

## What I found and fixed

### 1. Missing everyday words (about 80)

The most common words people use with friends were missing for many countries:

- **Words for "friend" or "dude":** mae (Costa Rica), maje (Honduras, Nicaragua, El Salvador), causa and pata (Peru), cuate and compa (Mexico), fren (Panama).
- **"Vaina"** (Dominican Republic, Venezuela, Colombia, Panama).
- **Everyday expressions:**
  - un chin (DR)
  - klk (DR)
  - al toque (Peru, Argentina)
  - ahorita (Mexico)
  - pucha (Andean countries)
  - ta (Uruguay)
  - vaya pues (El Salvador, Honduras)
  - dale pues (Nicaragua)
  - re (Argentina, Uruguay)
  - burda de (Venezuela)
  - pila de (Uruguay)
  - buco de (Panama)
- **Others:** chamba (Central America), bolo, chucho, la facu, chanta, a full, la yapa, k'encha, farrear, bárbaro, brutal, pura vida, achachay and arrarray, ñaño, mitaí, chake, vyrorei, tíguere, salado, majo, caucho, corillo, bochinche.

All of them were added with a pronunciation and an example sentence, plus opposites where one exists.

### 2. Words filed under the wrong meaning

- **"Lucas":** filed as "dinero", but it means "mil pesos". "Me costó diez lucas" had become "diez dinero".
- **"Upe" and "diay" (Costa Rica):** filed as "¿cómo estás?". "Upe" is a hello at the door and "diay" means "bueno…".

### 3. Grammar

- **People lost their gender:**
  - "la canche" became "el rubio"
  - "mi polola" became "mi novio"
  - "su jeva" became "su jevo"
  - "los cuates" became "las causas"

  Words for people now keep the person's gender.
- **Adjectives didn't agree with the translated noun:**
  - "la joda estuvo copado"
  - "la moto está macizo"
  - "ese cosito está copada"

  Adjectives now agree with the noun as it reads in the other country.
- **Feminine forms weren't recognized:** "chida", "nítida" and "salada" are now found like "chido".
- **Plurals like "gurises" weren't recognized.** They are now.
- **Nouns got the wrong article:**
  - "la guagua" became "la autobús"
  - "la birome" became "el birome"
- **Adverbs were changed like adjectives:** "temprano" became "temprana".

### 4. A plain word became a vulgar one

"Chunche" became "chingadera" for Mexico. Hola now never swaps a neutral word for a vulgar one; it uses the plain meaning instead ("cosa").

### 5. Wrong "¿Es español de…?" questions

A sentence with a single word shared by several countries was enough to trigger the question. For example, "Mi cuñado me prestó el coche" (Equatorial Guinea) asked "¿Es español de México?". Long sentences now need two words pointing to the same country.

The question also didn't come back after changing the country with a translation on screen. It now does.

### 6. Other-language detection

Hola didn't recognize "Let's grab a beer after the meeting", "Combien coûte une bière?" or "Mwen bezwen travay demen maten". It does now.

### 7. Screens

- **Phones 320 px wide (iPhone SE):**
  - the country buttons cut the names ("Rep. …", "Colo…");
  - the word-page tabs wrapped "Otros países" onto two lines;
  - the microphone button hid behind the bottom bar on short screens.
- **Word of the day for English speakers:** the menu said "All countries" while showing a Dominican word.

All fixed.

## What still needs work

1. **Equatorial Guinea has no regional vocabulary in Hola at all.** I don't know Equatoguinean Spanish well enough to add words responsibly. This needs speakers from Malabo or Bata.
2. **Expressions built on a verb only work in their base form.** "Hacer novillos" works; "hice novillos" and "me fui de pinta" don't yet.
3. **Words that mean two things are left alone on purpose**, because swapping them would break normal sentences:
   - "once" (Chile's afternoon tea, or the number eleven)
   - "harto" (Chile's "a lot", or "fed up")
   - "vale" (Spain's "OK", or "it costs")
   - "aguas" (Mexico's "watch out", or "waters")
   - "la leche"
   - "rojos" (Costa Rica's thousand-colón bills)
4. **Things that have no translation** stay as they are, which is right: tereré, once, chicheme, baleada, pupusa.
5. **20 of the 234 phrases still need the AI.** Most are ordinary sentences with no regional word (they need nothing) or unknown slang. Each AI answer is saved, so it's paid for once.
6. **Other-language sentences need the translation service or the AI.** That couldn't be tested here (no network to those services); it works on the live site.
7. **Spain's "vosotros" and Argentina's "vos"** aren't converted between countries: "Ponete la campera" stays "ponete" for Spain.

## Next steps

1. **Five-minute sessions with 2–3 real people per country.** Start with Equatorial Guinea, Central America and the Caribbean, where the dictionary is thinnest. Ask them to type how they really talk, and use the in-app suggestion form for what's missing.
2. **Review the AI's "aprendido" list in Vercel storage every week** and move the good words into the dictionary.
3. **Conjugate verb expressions** (item 2 above).
