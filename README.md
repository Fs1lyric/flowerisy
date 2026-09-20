# Flowerisy

A pomodoro timer and to-do list you can install as an app. Tasks stay in this browser.

## Install the app

Open the live site: <https://fs1lyric.github.io/flowerisy/>

- **Chrome / Edge / Chromium:** use **Install app** on the page, or the install icon in the address bar.
- **Safari (iPhone / iPad):** Share → **Add to Home Screen**.
- **Firefox:** the page still works; install support varies by platform.

After install it opens in its own window, without browser chrome.

## Use it

- Start a 25-minute focus round, then take a 5-minute short break. Every fourth bloom becomes a 15-minute long break.
- Press **Space** to start or pause.
- Add tasks, mark them done, or click a title to pin it to the current session.
- Turn on alerts if you want a desktop notice when a round ends.
- Theme cycles light, dark, then system.

Nothing is sent to a server. Tasks and today’s bloom count are saved in `localStorage`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Hosting

GitHub Pages deploys from `main` via `.github/workflows/pages.yml`. The installable app lives at `/flowerisy/`.
