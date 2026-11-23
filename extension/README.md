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

The scripts are in `extension-src/` (TypeScript, sharing Hola's dictionary
code); `pnpm extension:zip` bundles them into `extension/dist` and writes the
download.
