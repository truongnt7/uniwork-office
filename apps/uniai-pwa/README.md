# uniAI PWA

Standalone ChatGPT-style shell for UniWork AI (Token Hub + optional Office deep links).

## Production / staging URL

Serve this folder at **`https://uniwork.app/app/`** (trailing slash; `start_url` / `scope` are `/app/`).

Staging can mirror the same path on a preview host, e.g. `https://staging.uniwork.app/app/`.

## Local

```bash
npm run start -w @uniwork/uniai-pwa
# → http://localhost:5188
```

## Deploy

Copy static assets (`index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icons/`) to the CDN/origin path `/app/` with HTTPS. Service worker and installability require a secure origin.

## Install (users)

Settings → **uniAI** in UniWork Office opens `https://uniwork.app/app` and lists Chrome / Edge / Safari install steps. Or open the URL and use the browser’s Install / Add to Home Screen.
