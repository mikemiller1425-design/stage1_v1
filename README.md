# Stage 1 – Markdown Intake

A Next.js (App Router) tool that scans a local `markdowns` folder and displays `.md` files in a clean intake table.

## Features (v1)

- Reads all `.md` files from `/markdowns`
- Shows filename, last modified date, source (`ChatGPT`), and status (`Raw`)
- Server-rendered table view with a light, minimal UI

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Add markdown files to the `markdowns` folder at the project root; the page rescans on each load.
