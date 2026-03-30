/**
 * Popup Script — handles UI, clipboard paste, and downloads
 */

// DOM elements
const statusEl = document.getElementById("status");
const previewTextEl = document.getElementById("previewText");
const previewEmptyEl = document.getElementById("previewEmpty");
const pageTitleEl = document.getElementById("pageTitle");
const faviconEl = document.getElementById("favicon");
const filenameEl = document.getElementById("filename");
const refreshBtn = document.getElementById("refreshBtn");
const pasteBtn = document.getElementById("pasteBtn");
const downloadBtn = document.getElementById("downloadBtn");

let currentSelection = "";
let currentPageTitle = "";
let currentPageUrl = "";

// ── Utility Functions ─────────────────────────────────────────────────────────

function showStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
  }, 5000);
}

function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return "";
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 50);
}

function wrapInMarkdown(text, pageTitle, pageUrl) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  let md = "";
  md += `# ${pageTitle || "Highlighted Content"}\n\n`;

  if (pageUrl) {
    md += `**Source:** [${pageUrl}](${pageUrl})\n`;
  }

  md += `**Date:** ${date}\n\n`;
  md += `---\n\n`;
  md += text + "\n\n";
  md += `---\n\n`;
  md += `*Exported with Markdown Clipboard Chrome Extension*\n`;

  return md;
}

function updateUI() {
  if (currentSelection && currentSelection.length > 0) {
    const truncated = currentSelection.length > 300
      ? currentSelection.substring(0, 300) + "..."
      : currentSelection;
    previewTextEl.textContent = truncated;
    previewTextEl.classList.add("show");
    previewEmptyEl.style.display = "none";
    downloadBtn.disabled = false;

    if (currentPageTitle) {
      filenameEl.value = slugify(currentPageTitle.substring(0, 40));
    }
  } else {
    previewTextEl.classList.remove("show");
    previewEmptyEl.style.display = "block";
    downloadBtn.disabled = true;
  }

  pageTitleEl.textContent = currentPageTitle || "—";
  faviconEl.src = currentPageUrl ? getFaviconUrl(currentPageUrl) : "";
  faviconEl.style.display = currentPageUrl ? "block" : "none";
}

// ── Load Selection from content script ────────────────────────────────────────

async function loadFromContentScript() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("about:")) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getSelection" });
      if (response && response.selection && response.selection.trim().length > 0) {
        currentSelection = response.selection.trim();
        currentPageTitle = response.pageTitle || tab.title || "";
        currentPageUrl = response.pageUrl || tab.url || "";
        updateUI();
        return true;
      }
    }
  } catch (e) {
    // Content script not available or page restricted
  }
  return false;
}

// ── Load from clipboard (THE GUARANTEED GEMINI METHOD) ────────────────────────

async function pasteFromClipboard() {
  try {
    // Try the modern Clipboard API first
    const text = await navigator.clipboard.readText();
    if (text && text.trim().length > 0) {
      currentSelection = text.trim();
      
      // Try to get page info from storage (set by content script)
      try {
        const data = await chrome.storage.local.get(["pageTitle", "pageUrl"]);
        currentPageTitle = data.pageTitle || "Clipboard Content";
        currentPageUrl = data.pageUrl || "";
      } catch {
        currentPageTitle = "Clipboard Content";
        currentPageUrl = "";
      }

      updateUI();
      showStatus("✅ Pasted from clipboard!", "success");
      return;
    }
  } catch (e) {
    // Clipboard API failed — try fallback
  }

  // Fallback: create a textarea and paste there
  try {
    const textarea = document.createElement("textarea");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.top = "0";
    textarea.style.left = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    
    // Use execCommand as fallback
    const success = document.execCommand("paste");
    const text = textarea.value.trim();
    document.body.removeChild(textarea);

    if (success && text && text.length > 0) {
      currentSelection = text;
      try {
        const data = await chrome.storage.local.get(["pageTitle", "pageUrl"]);
        currentPageTitle = data.pageTitle || "Clipboard Content";
        currentPageUrl = data.pageUrl || "";
      } catch {
        currentPageTitle = "Clipboard Content";
        currentPageUrl = "";
      }
      updateUI();
      showStatus("✅ Pasted from clipboard!", "success");
      return;
    }
  } catch (e) {
    // execCommand also failed
  }

  showStatus("❌ Could not read clipboard. Try: Ctrl+C first, then click Paste.", "error");
}

// ── Download ─────────────────────────────────────────────────────────────────

async function downloadMarkdown() {
  if (!currentSelection) {
    showStatus("No text! Highlight or Ctrl+C then click Paste first.", "error");
    return;
  }

  let filename = filenameEl.value.trim() || "my-highlight";
  if (!filename.endsWith(".md")) {
    filename += ".md";
  }

  const markdown = wrapInMarkdown(currentSelection, currentPageTitle, currentPageUrl);
  const blob = new Blob([markdown], { type: "text/markdown; charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    await chrome.downloads.download({ url, filename, saveAs: true });
    showStatus(`✅ Downloaded "${filename}"!`, "success");
  } catch (err) {
    showStatus(`❌ Download failed: ${err.message}`, "error");
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Event Listeners ────────────────────────────────────────────────────────────

refreshBtn.addEventListener("click", async () => {
  showStatus("Checking for selection...", "info");
  currentSelection = "";
  currentPageTitle = "";
  currentPageUrl = "";
  
  // First try content script
  const found = await loadFromContentScript();
  if (!found) {
    // If content script failed, try clipboard
    await pasteFromClipboard();
  }
  updateUI();
});

pasteBtn.addEventListener("click", async () => {
  await pasteFromClipboard();
});

downloadBtn.addEventListener("click", downloadMarkdown);

filenameEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !downloadBtn.disabled) {
    downloadMarkdown();
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // First: try clipboard (most reliable for Gemini)
  await pasteFromClipboard();
  
  // Then try content script (in case normal highlighting worked)
  await loadFromContentScript();
  
  updateUI();
}

document.addEventListener("DOMContentLoaded", init);
