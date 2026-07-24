# Stage 1 – Markdown Intake

A Next.js (App Router) tool that scans a local `markdowns` folder and displays `.md` files in a clean intake table.

## Features (v1)

- Reads all `.md` files from `/markdowns`
- Shows filename, last modified date, source (`ChatGPT`), and status (`Raw`)
- Server-rendered table view with a light, minimal UI
- Click a table row to open a readable markdown viewer at `/view/[filename]`
- Return to the intake table with **Back to table**
- Run **Intent Analysis** with Claude (server-side via `ANTHROPIC_API_KEY`)

## Getting started

```bash
npm install
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Add markdown files to the `markdowns` folder at the project root; the page rescans on each load.

### Intent Analysis

On a viewer page, click **Run Intent Analysis** to send the full markdown to Claude Sonnet (`claude-sonnet-5`). The API key stays on the server via a Next.js server action.
