// The toolbar button opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "hola-translate",
    title: chrome.i18n.getUILanguage().startsWith("es")
      ? 'Traducir con Hola: "%s"'
      : 'Translate with Hola: "%s"',
    contexts: ["selection"],
  });
});

/**
 * Opens the panel and hands it the text. The panel must be opened right away,
 * while Chrome still counts the click or key press as the user's.
 */
function translate(windowId, text) {
  const opening = chrome.sidePanel.open({ windowId });
  chrome.storage.session.set({ pending: { text: text.trim().slice(0, 2000), at: Date.now() } });
  return opening.catch(() => {});
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "hola-translate" && info.selectionText && tab) {
    translate(tab.windowId, info.selectionText);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "translate-selection" || !tab?.id) return;
  const opening = chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => String(window.getSelection() ?? ""),
    });
    if (result?.trim()) {
      chrome.storage.session.set({ pending: { text: result.trim().slice(0, 2000), at: Date.now() } });
    }
  } catch {
    // Pages like the Chrome Web Store don't allow reading the selection.
  }
  await opening;
});

