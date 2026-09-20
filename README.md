# Flowerisy

A pomodoro timer and to-do list that stay in your browser.

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

## GitHub Pages

This repo is static files at the root, so Pages can serve `/` from the `main` branch.
