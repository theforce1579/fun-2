# Moodwave (React + Vite)

Mood-driven song recommendations powered by Google Gemini. Describe how you feel (optionally name an artist) and the app suggests a single track that matches the moment.

## Prerequisites

- Node.js 18+ (or any version supported by Vite 5)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup

```bash
cp .env.example .env       # add your Gemini key inside
npm install
npm run dev                # http://localhost:5173
```

### Environment variables

| Name                    | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `VITE_GEMINI_API_KEY`   | Google Gemini key used in client requests.            |
| `VITE_GEMINI_MODEL`     | Gemini model name (e.g. `gemini-2.5-flash`). |

> **Note:** Vite embeds `VITE_*` variables into the client bundle. If you need to hide the key completely, place a minimal proxy between the UI and Gemini and remove direct browser calls.

## Scripts

- `npm run dev` — start the Vite dev server with hot reload.
- `npm run build` — bundle for production (outputs to `dist/`).
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint with the provided config.

## How it works

- The form collects a mood description and optional artist hint.
- The Gemini client (see `src/lib/geminiClient.js`) crafts a structured prompt and posts to `gemini-1.5-flash`.
- Responses are parsed into title, artist, and reasoning; raw output remains viewable for transparency.
- Styling lives in `src/App.css` with a glassy neon aesthetic tuned for desktop and mobile.
