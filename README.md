# Stage 1 – Markdown Intake

A Next.js (App Router) tool that scans a local `markdowns` folder, reviews files, runs Claude Intent Analysis, and prepares an approved Stage 3 package.

## Features

- Reads all `.md` files from `/markdowns`
- Intake table with filename, last modified date, source (`ChatGPT`), and status (`Raw` / `Approved`)
- Click a row to open a readable markdown viewer
- **Run Intent Analysis** with Claude (`claude-sonnet-5`) via a secure server action
- **Approve & Continue to Stage 3**
  - Builds a clean combined package headed `# Approved Stage 1 Package — [Filename]`
  - **Copy to clipboard** or **Download** as `[filename]-approved-stage1.md`
  - Marks the file as **Approved** in the intake table

## Getting started

```bash
npm install
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Add markdown files to the `markdowns` folder at the project root; the page rescans on each load.

## Stage 1 workflow

1. Open the intake table and click a markdown file.
2. Review the original content in the viewer.
3. Click **Run Intent Analysis**.
4. Click **Approve & Continue to Stage 3**.
5. Copy or download the approved package for Stage 3.

Re-running Intent Analysis clears the previous approval for that file.
