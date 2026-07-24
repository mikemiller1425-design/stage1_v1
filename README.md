# Stage 1 – Markdown Intake

A Next.js (App Router) tool that scans a configurable markdown folder, reviews files, runs Claude Intent Analysis, and prepares an approved Stage 3 package.

## Features

- Reads all `.md` files from a configurable folder (`MARKDOWNS_DIR`, default `./markdowns`)
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
# Optionally set MARKDOWNS_DIR to your exports folder
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Configure the markdowns folder

By default the app reads from `./markdowns` in the project root.

To use another folder — including an absolute Synology/network mount — set `MARKDOWNS_DIR` in `.env.local`:

```bash
# macOS Synology / network mount example
MARKDOWNS_DIR=/Volumes/10_CORE/chatgpt_exports

# Windows mapped drive example
# MARKDOWNS_DIR=Z:\chatgpt_exports

# Relative path example (resolved from the project root)
# MARKDOWNS_DIR=./markdowns
```

Restart the Next.js dev server after changing `.env.local`.

## Stage 1 workflow

1. Open the intake table and click a markdown file.
2. Review the original content in the viewer.
3. Click **Run Intent Analysis**.
4. Click **Approve & Continue to Stage 3**.
5. Copy or download the approved package for Stage 3.

Re-running Intent Analysis clears the previous approval for that file.
