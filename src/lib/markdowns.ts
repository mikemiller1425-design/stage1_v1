import { readdir, stat } from "fs/promises";
import path from "path";

export type MarkdownFile = {
  filename: string;
  lastModified: string;
  source: "ChatGPT";
  status: "Raw";
};

const MARKDOWNS_DIR = path.join(process.cwd(), "markdowns");

export async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  let entries: string[];

  try {
    entries = await readdir(MARKDOWNS_DIR);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }

  const markdownEntries = entries.filter((name) => name.endsWith(".md"));

  const files = await Promise.all(
    markdownEntries.map(async (filename) => {
      const filePath = path.join(MARKDOWNS_DIR, filename);
      const fileStat = await stat(filePath);

      return {
        filename,
        lastModified: fileStat.mtime.toISOString(),
        source: "ChatGPT" as const,
        status: "Raw" as const,
      };
    }),
  );

  return files.sort((a, b) => a.filename.localeCompare(b.filename));
}

export function formatLastModified(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}
