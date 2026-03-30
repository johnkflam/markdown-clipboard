/**
 * Content Script — captures text selection on ALL pages including React/Gemini
 * Works by listening to:
 *   1. selectionchange — fires whenever selection changes (most reliable)
 *   2. copy event — fires when user copies text
 *   3. mouseup/keyup — fallback for basic pages
 */

let lastSelection = "";
let lastUrl = "";
let lastTitle = "";

// ── Core selection capture ──────────────────────────────────────────────────

function captureSelection() {
  try {
    // Try multiple selection sources — some work better on React/SPAs
    const selection = 
      window.getSelection().toString().trim() ||
      document.getSelection().toString().trim() ||
      "";

    if (selection && selection.length > 0) {
      lastSelection = selection;
      lastUrl = window.location.href;
      lastTitle = document.title || "";
      chrome.storage.local.set({
        lastSelection: selection,
        pageTitle: lastTitle,
        pageUrl: lastUrl,
        timestamp: Date.now()
      });
      return selection;
    }
  } catch (e) {
    // Silently fail — this can happen in iframes or restricted contexts
  }
  return "";
}

// ── Event Listeners ───────────────────────────────────────────────────────────

// PRIMARY: selectionchange — fires on ANY selection change (best for React apps)
document.addEventListener("selectionchange", () => {
  // Small delay to let the selection settle
  setTimeout(captureSelection, 10);
});

// SECONDARY: copy event — captures what's in the clipboard
document.addEventListener("copy", (e) => {
  try {
    const text = e.clipboardData?.getData("text/plain") || window.getSelection().toString().trim();
    if (text && text.length > 0) {
      lastSelection = text;
      lastUrl = window.location.href;
      lastTitle = document.title || "";
      chrome.storage.local.set({
        lastSelection: text,
        pageTitle: lastTitle,
        pageUrl: lastUrl,
        timestamp: Date.now()
      });
    }
  } catch (e) {
    // Fallback to window selection
    captureSelection();
  }
});

// TERTIARY: mouseup/keyup — fallback for simple pages
document.addEventListener("mouseup", () => {
  setTimeout(captureSelection, 10);
});

document.addEventListener("keyup", (e) => {
  // Shift+arrows, Ctrl+A, etc.
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    setTimeout(captureSelection, 10);
  }
});

// ── Keyboard shortcuts that create selections ─────────────────────────────────

document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + A (select all)
  if ((e.ctrlKey || e.metaKey) && e.key === "a") {
    setTimeout(captureSelection, 50);
  }
  // Shift + End/Home/Arrows
  if (e.shiftKey && ["ArrowUp", "ArrowDown", "End", "Home", "PageUp", "PageDown"].includes(e.key)) {
    setTimeout(captureSelection, 10);
  }
});

// ── Message handler (for popup) ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelection") {
    const selection = captureSelection();
    // Also return what's stored in case content script doesn't have focus
    chrome.storage.local.get(["lastSelection", "pageTitle", "pageUrl"], (data) => {
      sendResponse({
        selection: selection || data.lastSelection || "",
        pageTitle: data.pageTitle || lastTitle,
        pageUrl: data.pageUrl || lastUrl,
        timestamp: data.timestamp || 0
      });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === "ping") {
    sendResponse({ status: "ok", url: window.location.href });
    return true;
  }

  return false;
});

// ── Periodic capture (for Gemini-style React apps) ────────────────────────────
// Some React apps don't fire standard selection events
// This is a fallback that checks periodically

let lastCaptured = "";
const POLL_INTERVAL = 500; // ms

const pollTimer = setInterval(() => {
  try {
    const current = window.getSelection().toString().trim();
    if (current && current !== lastCaptured && current.length > 3) {
      lastCaptured = current;
      lastSelection = current;
      lastUrl = window.location.href;
      lastTitle = document.title || "";
      chrome.storage.local.set({
        lastSelection: current,
        pageTitle: lastTitle,
        pageUrl: lastUrl,
        timestamp: Date.now()
      });
    }
  } catch (e) {
    // Silently fail
  }
}, POLL_INTERVAL);

// Clean up on page unload
window.addEventListener("unload", () => {
  clearInterval(pollTimer);
});
