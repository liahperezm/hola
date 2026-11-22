# Hola for Chrome and Edge

Select text on any page, right-click, and choose **Traducir con Hola**, or
press Alt+Shift+H. Hola opens in the browser's side panel with the text
translated. The toolbar button opens the panel too.

The panel shows the Hola site (`config.js`), so it always has the latest
dictionary. The site recognizes the country from the text's words.

## Try it without the store

1. Download https://hola-sepia-six.vercel.app/hola-extension.zip and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on
   **Developer mode**.
3. Click **Load unpacked** and choose the unzipped folder.

After changing files here, run `pnpm extension:zip` to rebuild the download.
