# Hola for Chrome, Edge and Safari

Translates the whole page, like the browser's own translator, between the
Spanish of different countries and, in Chrome, from and to other languages.

Click the Hola button (or Alt+Shift+H): **De** starts on **Detectar idioma**
and says what it found (for example "Detectado: español de México"), **A** is
where you want it, and **Traducir página** translates in place. Changed words
are underlined; hover to see the original. **Ver original** puts the page
back. Text the page loads later (scrolling, chats) is translated too.

- **Spanish ↔ Spanish** uses Hola's dictionary, bundled in the extension: free,
  instant, no server, in every browser.
- **Another language ↔ Spanish** uses Chrome's built-in translator (Chrome
  138 or later), which runs on the computer, then Hola's words for the
  country. The first time, Chrome downloads the language after a click on
  the page (Hola shows a button for it). Safari has no built-in translator
  for extensions; use Safari's own "Translate" for other languages there.
- Hola only reads the page you click it on (activeTab), never others.

## Try it

1. Download https://hola-sepia-six.vercel.app/hola-extension.zip and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`), turn on **Developer
   mode**, click **Load unpacked** and choose the folder.

## Safari (on a Mac with Xcode)

```bash
xcrun safari-web-extension-converter extension --app-name Hola
```

Open the Xcode project it makes, run it, then enable Hola in Safari →
Settings → Extensions.

## Build

The scripts are in `extension-src/` (TypeScript), built from the same code
and dictionary as the app. Every deploy (`pnpm build`) rebuilds the extension
into `extension-build/` and the download at `/hola-extension.zip`, with a
version stamped from the date (shown at the bottom of the popup), so the
extension always has the app's latest words and fixes. `pnpm extension:zip`
does the same by hand.

An extension loaded with "Load unpacked" doesn't update itself: download the
zip again. Published on the Chrome Web Store, it would update on its own.
