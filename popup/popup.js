/**
 * Popup Script — handles UI interactions and file downloads
 */

// DOM elements
const statusEl = document.getElementById("status");
const previewTextEl = document.getElementById("previewText");
const previewEmptyEl = document.getElementById("previewEmpty");
const pageTitleEl = document.getElementById("pageTitle");
const faviconEl = document.getElementById("favicon");
const filenameEl = document.getElementById("filename");
const refreshBtn = document.getElementById("refreshBtn");
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
  }, 4000);
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

  // Header block
  md += `# ${pageTitle || "Highlighted Content"}\n\n`;

  // Source link
  if (pageUrl) {
    md += `**Source:** [${pageUrl}](${pageUrl})\n`;
  }

  md += `**Date:** ${date}\n\n`;
  md += `---\n\n`;

  // Content
  md += text + "\n\n";

  // Footer
  md += `---\n\n`;
  md += `*Exported with Markdown Clipboard Chrome Extension*\n`;

  return md;
}

// ── Load Selection ───────────────────────────────────────────────────────────

async function loadSelection() {
  // First try chrome.storage (set by content script)
  try {
    const data = await chrome.storage.local.get(["lastSelection", "pageTitle", "pageUrl"]);
    if (data.lastSelection && data.lastSelection.trim().length > 0) {
      currentSelection = data.lastSelection.trim();
      currentPageTitle = data.pageTitle || "";
      currentPageUrl = data.pageUrl || "";
      updateUI();
      return;
    }
  } catch (e) {
    // storage not available
  }

  // Fallback: ask active tab's content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getSelection" });
      if (response && response.selection && response.selection.trim().length > 0) {
        currentSelection = response.selection.trim();
        currentPageTitle = tab.title || "";
        currentPageUrl = tab.url || "";
        await chrome.storage.local.set({
          lastSelection: currentSelection,
          pageTitle: currentPageTitle,
          pageUrl: currentPageUrl
        });
        updateUI();
        return;
      }
    }
  } catch (e) {
    // Content script might not be loaded — that's ok
  }

  // No selection found
  currentSelection = "";
  currentPageTitle = "";
  currentPageUrl = "";
  updateUI();
}

function updateUI() {
  // Preview
  if (currentSelection && currentSelection.length > 0) {
    const truncated = currentSelection.length > 200
      ? currentSelection.substring(0, 200) + "..."
      : currentSelection;
    previewTextEl.textContent = truncated;
    previewTextEl.classList.add("show");
    previewEmptyEl.style.display = "none";
    downloadBtn.disabled = false;
  } else {
    previewTextEl.classList.remove("show");
    previewEmptyEl.style.display = "block";
    downloadBtn.disabled = true;
  }

  // Page info
  pageTitleEl.textContent = currentPageTitle || "—";
  faviconEl.src = currentPageUrl ? getFaviconUrl(currentPageUrl) : "";
  faviconEl.style.display = currentPageUrl ? "block" : "none";

  // Auto-fill filename from page title
  if (!filenameEl.value || filenameEl.value === "my-highlight") {
    if (currentPageTitle) {
      filenameEl.value = slugify(currentPageTitle.substring(0, 40));
    }
  }
}

// ── Download ─────────────────────────────────────────────────────────────────

async function downloadMarkdown() {
  if (!currentSelection) {
    showStatus("No text selected!", "error");
    return;
  }

  let filename = filenameEl.value.trim();
  if (!filename) {
    filename = "my-highlight";
  }

  // Ensure .md extension
  if (!filename.endsWith(".md")) {
    filename += ".md";
  }

  const markdown = wrapInMarkdown(currentSelection, currentPageTitle, currentPageUrl);
  const blob = new Blob([markdown], { type: "text/markdown; charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
    showStatus(`✅ Downloaded as "${filename}"`, "success");
  } catch (err) {
    showStatus(`❌ Download failed: ${err.message}`, "error");
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Event Listeners ────────────────────────────────────────────────────────────

refreshBtn.addEventListener("click", () => {
  loadSelection();
  showStatus("Refreshing selection...", "info");
});

downloadBtn.addEventListener("click", downloadMarkdown);

// Allow Enter key to download
filenameEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !downloadBtn.disabled) {
    downloadMarkdown();
  }
});

// ── Init ───────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", loadSelection);
