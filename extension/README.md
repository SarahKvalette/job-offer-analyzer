# Job Offer Analyzer — Chrome Extension (MV3)

A 1-click way to analyse the job posting you're currently reading on
LinkedIn, Welcome to the Jungle, Indeed (.com / .fr) or JobTeaser.

## What it does

1. On a supported job page, a small "Analyse with JOA" button appears
   bottom-right (or open the toolbar popup and click the same action).
2. The extension scrapes the visible posting text — locally, no network
   call.
3. It opens [job-offer-analyzer.vercel.app](https://job-offer-analyzer.vercel.app)
   in a new tab with the text passed in the URL fragment (`#analyze=…`).
4. The web app picks it up, fills the textarea, and runs the analysis
   right away.

The fragment is client-side only — Vercel never logs the posting text.

## Install in developer mode

1. Open `chrome://extensions` in Chrome (or `edge://extensions` in Edge).
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and pick this `extension/` folder.
4. Pin the JOA extension to the toolbar.

## Icons

The manifest references icons in `icons/` (16/32/48/128 px). They aren't
checked in yet — drop your own PNGs at those paths or remove the
`"icons"` block from `manifest.json` for the moment.

## Files

| File           | Role                                              |
| -------------- | ------------------------------------------------- |
| `manifest.json` | MV3 manifest, host permissions, icons, etc.       |
| `background.js` | Service worker — opens the app tab with `#analyze=…` |
| `content.js`    | Injected on supported pages — scrapes + floating button |
| `popup.html` / `popup.js` | Toolbar popup, alternative trigger      |

## Pointing the extension at a different host

The app URL is hard-coded to the Vercel production deployment. To run
against a local `next dev`:

1. Edit `background.js` and `popup.js` and change `APP_URL` to
   `http://localhost:3000`.
2. Reload the unpacked extension from `chrome://extensions`.

## Privacy

The extension only reads the page you click it on. No analytics, no
remote sync. The scraped text is passed to the web app via the URL
fragment of the new tab — your browser's URL bar is the only place it
appears outside that tab.
