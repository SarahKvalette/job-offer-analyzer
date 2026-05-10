const APP_URL = "https://job-offer-analyzer.vercel.app";

const $ = (sel) => document.querySelector(sel);
const status = $("#status");

function showError(msg) {
  status.textContent = msg;
  status.hidden = false;
}

$("#open-app").addEventListener("click", () => {
  chrome.tabs.create({ url: APP_URL });
});

$("#analyze").addEventListener("click", async () => {
  status.hidden = true;

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    showError("Couldn't read the active tab.");
    return;
  }

  if (!tab?.id) {
    showError("No active tab.");
    return;
  }

  // Ask the content script for the scraped posting text. If the content
  // script isn't injected (page navigation just happened), inject it once
  // and retry.
  let response;
  try {
    response = await chrome.tabs.sendMessage(tab.id, { type: "joa:scrape" });
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      response = await chrome.tabs.sendMessage(tab.id, {
        type: "joa:scrape",
      });
    } catch {
      showError(
        "This page isn't supported. Open a job posting on LinkedIn, WTTJ, Indeed, or JobTeaser."
      );
      return;
    }
  }

  const text = response?.text ?? "";
  if (text.trim().length < 30) {
    showError("Couldn't find a posting on this page.");
    return;
  }

  await chrome.runtime.sendMessage({ type: "joa:analyze", text });
  window.close();
});
