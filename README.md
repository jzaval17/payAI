FunPay — Parody Payment App (For Entertainment Only)

What this is:
- A small, local web prototype that imitates the look-and-feel of a payment wallet in a clearly fictional way.
- When you tap the screen or press the screen area, it plays a short "cha-ching" sound (currently from `assets/sounds/payment.mp3`) and shows a cartoon "Payment Received" animation.
- All card names and logos are fictional. Use is intended for parody; a visible "For Entertainment Only" disclaimer should be visible in the UI.

Files:
- `index.html` — main page and UI
- `styles.css` — styling
- `app.js` — playback + animation logic

# PrankPay — Parody Wallet

A lighthearted, safe spoof of a payment screen. No real payment provider branding or sounds are included.

## Run locally (browser)
1. Save all files in one folder.
2. In a terminal run a simple file server (optional but recommended):

```powershell
cd 'C:\Users\Juan\Code\AppleAI\parody-pay'
python -m http.server 8000
```

3. Open http://localhost:8000 in your browser, or open `index.html` directly.

Tap anywhere to play a fun "cha-ching" tone and show the fake "Payment Received" overlay.

### Cache / Refresh tips

- If you don't see recent changes in the app (especially after editing `app.js` or `styles.css`), your browser may be loading a cached copy. Try these steps to force a fresh load:
	- Open the site in a Private/Incognito tab — that often bypasses cached resources.
	- Close every tab that has the app open (on mobile browsers make sure you close all app tabs/windows). Some browsers keep resources alive while any tab is open for the same origin.
	- Hard refresh the page (on desktop: Shift+Reload or Ctrl/Cmd+Shift+R). On mobile, use the browser menu → Reload, or open an Incognito tab.
	- Append a cache-busting query to the URL, e.g. `https://your-site.example/?v=2` — this forces the browser to load fresh HTML, and if the HTML references `styles.css?v=2` and `app.js?v=2` those files will be fetched again.
	- If a Service Worker is registered for the site, unregister it and clear site data (see below) — an active SW can serve cached files even after a hard refresh.

Service Worker / site-data removal (useful on mobile and desktop):

- On desktop Chrome/Edge:
	1. Open DevTools → Application → Service Workers. Click "Unregister" for the service worker, then under "Clear storage" choose "Clear site data" and reload.

- On iPhone (Safari):
	1. Settings → Safari → Advanced → Website Data → find your site and remove it, or toggle "Remove All Website Data".
	2. Alternatively, connect to a Mac and use Safari Web Inspector to inspect the page and unregister the SW from the Application panel.

- On Android (Chrome):
	1. Chrome menu → Settings → Privacy and security → Clear browsing data (Cached images and files) and/or Site settings → All sites → find your domain → Clear & reset.

If you're testing a Vercel or other hosted deploy, remember to redeploy after making code changes; local edits won't affect the hosted URL until the new version is deployed.

## Run as a desktop app (Electron)
The project includes a minimal Electron scaffold so you can run it as a desktop app on Windows.

1. From PowerShell, install dependencies and run:

```powershell
cd 'C:\Users\Juan\Code\AppleAI\parody-pay'
npm install
npm start
```

2. This will open a native window loading the local UI. To create packaged builds you can use tools like `electron-packager` or `electron-builder` (not included by default). Example packaging with `electron-packager`:

```powershell
cd 'C:\Users\Juan\Code\AppleAI\parody-pay'
npm install --save-dev electron-packager
npx electron-packager . PrankPay --platform=win32 --arch=x64 --out=dist --overwrite
```

Notes & ethics:
- This is explicitly for entertainment and parody. Do not use it to deceive people or impersonate real payment services.
- The audio file used is `assets/sounds/payment.mp3`. If you prefer a synthesized WebAudio tone instead, I can swap the implementation.

Next steps I can help with:
- Improve accessibility (overlay focus management, ARIA announcements).
- Add an installer/package configuration using `electron-builder`.
- Add a settings panel to change displayed amount and sender name.
