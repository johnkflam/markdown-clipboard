/**
 * Background Service Worker — handles download events
 */

chrome.downloads.onCompleted.addListener((downloadItem) => {
  console.log(`[Markdown Clipboard] Download complete: ${downloadItem.filename}`);
});

chrome.downloads.onFailed.addListener((downloadItem, err) => {
  console.error(`[Markdown Clipboard] Download failed: ${err.error}`);
});
