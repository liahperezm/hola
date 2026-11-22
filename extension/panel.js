import { HOLA_URL } from "./config.js";

const frame = document.getElementById("hola");

function show(text) {
  const url = new URL(HOLA_URL);
  if (text) url.searchParams.set("text", text);
  frame.src = url.toString();
}

// Text chosen with the right-click menu or the shortcut, before or after the
// panel opened.
async function takePending() {
  const { pending } = await chrome.storage.session.get("pending");
  if (!pending) return false;
  await chrome.storage.session.remove("pending");
  show(pending.text);
  return true;
}

chrome.storage.session.onChanged.addListener((changes) => {
  if (changes.pending?.newValue) void takePending();
});

if (!(await takePending())) show("");
