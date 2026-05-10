/**
 * Content script — runs on supported job-board pages.
 *
 * Two responsibilities:
 *   1. Inject a small floating "Analyse with JOA" button on the page so
 *      the user can fire the flow without opening the popup.
 *   2. Provide a `joa:scrape` message handler that the popup uses to ask
 *      the page for its currently visible posting text.
 */

(() => {
  if (window.__JOA_INJECTED__) return;
  window.__JOA_INJECTED__ = true;

  /** Strip the page down to readable text using the same rules as the API. */
  function scrapePostingText() {
    // Prefer common posting-body selectors when available — these give us
    // the cleanest text on each platform.
    const SELECTORS = [
      // LinkedIn
      ".jobs-description__container",
      ".jobs-box__html-content",
      ".description__text",
      // Welcome to the Jungle
      "[data-testid='job-section-description']",
      // Indeed
      "#jobDescriptionText",
      "[data-testid='jobsearch-jobDescriptionText']",
      // JobTeaser
      ".job-description",
    ];
    for (const selector of SELECTORS) {
      const el = document.querySelector(selector);
      if (el && el.textContent && el.textContent.trim().length > 200) {
        return cleanWhitespace(
          (document.title ? document.title + "\n\n" : "") +
            el.textContent
        );
      }
    }
    // Fallback: full body text. Way noisier but enough for the LLM to
    // recover something useful.
    const body = document.body?.innerText ?? "";
    return cleanWhitespace(
      (document.title ? document.title + "\n\n" : "") + body
    );
  }

  function cleanWhitespace(s) {
    return s
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .slice(0, 25_000);
  }

  function injectFloatingButton() {
    if (document.getElementById("joa-fab")) return;
    const fab = document.createElement("button");
    fab.id = "joa-fab";
    fab.type = "button";
    fab.textContent = "Analyse with JOA";
    fab.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483647;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.1);
      background: #18181b;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: -0.01em;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      transition: transform .15s ease, box-shadow .15s ease;
    `;
    fab.addEventListener("mouseenter", () => {
      fab.style.transform = "translateY(-1px)";
      fab.style.boxShadow = "0 6px 20px rgba(0,0,0,0.22)";
    });
    fab.addEventListener("mouseleave", () => {
      fab.style.transform = "";
      fab.style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)";
    });
    fab.addEventListener("click", () => {
      const text = scrapePostingText();
      chrome.runtime.sendMessage({ type: "joa:analyze", text });
    });
    document.body.appendChild(fab);
  }

  // Listen for popup → content requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "joa:scrape") {
      sendResponse({ text: scrapePostingText() });
      return true;
    }
    return false;
  });

  // Inject on idle, re-inject on URL changes (LinkedIn is a SPA)
  injectFloatingButton();
  let lastHref = location.href;
  new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      // Some platforms re-render the body — re-inject if missing.
      setTimeout(() => {
        if (!document.getElementById("joa-fab")) injectFloatingButton();
      }, 600);
    }
  }).observe(document, { subtree: true, childList: true });
})();
