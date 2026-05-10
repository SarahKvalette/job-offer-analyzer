/**
 * Background service worker.
 *
 * Receives `analyze` messages from the content script / popup, encodes the
 * scraped posting text into a URL fragment, and opens the web app in a new
 * tab. We use the fragment instead of a query parameter because it stays
 * client-side (server never sees the posting text — Vercel logs stay clean)
 * and supports up to ~60 KB on every browser we care about.
 */

const APP_URL =
  globalThis.JOA_APP_URL ?? "https://job-offer-analyzer.vercel.app";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "joa:analyze") return false;

  const text = typeof message.text === "string" ? message.text : "";
  if (text.trim().length < 30) {
    sendResponse({ ok: false, error: "Posting text seems too short." });
    return true;
  }

  const fragment = encodeURIComponent(text);
  const url = `${APP_URL}/#analyze=${fragment}`;

  chrome.tabs.create({ url, active: true }, () => {
    sendResponse({ ok: true });
  });

  return true; // keep the message channel open for the async response
});
