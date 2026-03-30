# Markdown Clipboard — Chrome Extension
*Highlight any text on any webpage — including Gemini, ChatGPT, Claude — and download as Markdown.*

**Version:** 1.1 — Fixed for React/Gemini/SPA support

---

## Features

- ✅ Highlight any text on any webpage (including **Gemini**, **ChatGPT**, **Claude**, **Notion**, etc.)
- ✅ Converts to clean Markdown format
- ✅ Auto-adds source URL and date
- ✅ Clean preview before downloading
- ✅ Auto-generated filename from page title
- ✅ Downloads as `.md` file (UTF-8)
- ✅ No account required
- ✅ Works offline
- ✅ Open source
- 🔧 **Fixed:** Now works on React/SPA pages (Gemini, ChatGPT, Claude, etc.)

### Step 1: Download / Clone

Save this entire folder to your computer.

```
chrome_markdown_exporter/
├── manifest.json
├── background/
│   └── background.js
├── content/
│   └── content.js
├── popup/
│   ├── popup.html
│   └── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 2: Enable Developer Mode in Chrome

1. Open **Chrome**
2. Go to: `chrome://extensions/`
3. Toggle **Developer mode** (top right) — **ON**

### Step 3: Load the Extension

1. Click **"Load unpacked"** (top left)
2. Navigate to the `chrome_markdown_exporter` folder
3. Select it and click **"Select Folder"**

### Step 4: Pin the Extension

1. Click the **puzzle piece icon** 🧩 in Chrome toolbar
2. Find **"Markdown Clipboard"**
3. Click the **pin icon** 📌 to pin it to your toolbar

---

## How to Use

1. **Browse** to any webpage
2. **Highlight** any text you want to save
3. **Click** the 📋 **Markdown Clipboard** icon in your toolbar
4. **Preview** your selected text
5. **Name** your file (or leave as-is)
6. Click **Download** 📥

The file downloads to your browser's default download folder.

---

## What the Markdown Looks Like

When you download, the file will look like this:

```markdown
# Page Title Here

**Source:** [https://example.com/article](https://example.com/article)
**Date:** March 30, 2026

---

Your highlighted text goes here.
It preserves line breaks and formatting.

---

*Exported with Markdown Clipboard Chrome Extension*
```

---

## How It Works

```
Webpage
  │
  │  (user highlights text)
  │
  ▼
Content Script (content.js)
  │  — captures selection
  │  — stores in chrome.storage
  │
  ▼
Popup (popup.html/js)
  │  — shows preview
  │  — formats as Markdown
  │  — handles download
  │
  ▼
Chrome Downloads
  │  — saves as .md file
  ▼
Local File System ✅
```

---

## File Structure

```
chrome_markdown_exporter/
├── manifest.json        ← Extension config (v3)
├── background/
│   └── background.js  ← Service worker (download events)
├── content/
│   └── content.js     ← Captures text selection on pages
├── popup/
│   ├── popup.html     ← Extension popup UI
│   └── popup.js       ← Popup logic & Markdown conversion
└── icons/
    ├── icon16.png     ← Toolbar icon (16px)
    ├── icon48.png     ← Extension page icon (48px)
    └── icon128.png    ← Chrome Web Store icon (128px)
```

---

## Permissions Used

| Permission | Why it's needed |
|-----------|----------------|
| `activeTab` | Access the currently active tab to get selected text |
| `scripting` | Inject the content script to capture text selection |
| `downloads` | Trigger file downloads |

---

## Troubleshooting

### "No text selected" on Gemini/ChatGPT/Claude
- **This is fixed in v1.1!** The extension now uses `selectionchange` events and polling instead of relying on `mouseup` events, which work better on React/SPA pages.
- Make sure you have **v1.1** installed (reload the extension after updating)
- Try clicking the extension icon AFTER highlighting — don't switch tabs

### Content script not loading
- Make sure the extension is enabled in `chrome://extensions/`
- Try reloading the extension
- Make sure the page isn't blocking content scripts (some sites do)

### Download not saving
- Check your Chrome downloads folder
- Make sure downloads are allowed in Chrome settings

### Need to reload after updating
- After replacing the extension files, go to `chrome://extensions/`
- Find **Markdown Clipboard** and click the **🔄 reload icon**
- Then pin the extension again if needed

---

## Customize

Want to change how the Markdown looks? Edit `popup/popup.js` → the `wrapInMarkdown()` function.

Want to change colors? Edit `popup/popup.html` → the `<style>` section.

---

*Built with ❤️ by Bob the Builder · March 30, 2026*
