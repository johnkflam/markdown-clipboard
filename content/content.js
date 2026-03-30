/**
 * Content Script — handles text selection
 * Listens for selection changes and notifies the popup
 */

let lastSelection = "";

// Listen for text selection changes
document.addEventListener("mouseup", () => {
  const selection = window.getSelection().toString().trim();
  if (selection && selection.length > 0) {
    lastSelection = selection;
    // Store in chrome storage for popup to access
    chrome.storage.local.set({ lastSelection: selection, pageTitle: document.title, pageUrl: window.location.href });
  }
});

// Also listen for keyboard selection
document.addEventListener("keyup", (e) => {
  if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "End" || e.key === "Home")) {
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 0) {
      lastSelection = selection;
      chrome.storage.local.set({ lastSelection: selection, pageTitle: document.title, pageUrl: window.location.href });
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelection") {
    const selection = window.getSelection().toString().trim();
    chrome.storage.local.set({
      lastSelection: selection,
      pageTitle: document.title,
      pageUrl: window.location.href
    });
    sendResponse({ selection: selection });
  }
  return true;
});
