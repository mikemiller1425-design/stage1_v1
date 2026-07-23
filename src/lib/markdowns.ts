import { readdir, readFile, stat } from "fs/promises";
import path from "path";

export type MarkdownFile = {
  filename: string;
  lastModified: string;
  source: "ChatGPT";
  status: "Raw";
};

export type MarkdownDocument = {
  filename: string;
  content: string;
  lastModified: string;
  source: "ChatGPT";
  status: "Raw";
};

const MARKDOWNS_DIR = path.join(process.cwd(), "markdowns");

function isSafeMarkdownFilename(filename: string): boolean {
  if (!filename || !filename.endsWith(".md")) {
    return false;
  }

  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.isAbsolute(filename)
  ) {
    return false;
  }

  return path.basename(filename) === filename;
}

function resolveMarkdownPath(filename: string): string | null {
  if (!isSafeMarkdownFilename(filename)) {
    return null;
  }

  const resolvedDir = path.resolve(MARKDOWNS_DIR);
  const resolvedPath = path.resolve(resolvedDir, filename);

  if (
    resolvedPath !== resolvedDir &&
    !resolvedPath.startsWith(resolvedDir + path.sep)
  ) {
    return null;
  }

  return resolvedPath;
}

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

export async function getMarkdownContent(
  filename: string,
): Promise<MarkdownDocument | null> {
  const decodedFilename = decodeURIComponent(filename);
  const filePath = resolveMarkdownPath(decodedFilename);

  if (!filePath) {
    return null;
  }

  try {
    const [content, fileStat] = await Promise.all([
      readFile(filePath, "utf8"),
      stat(filePath),
    ]);

    return {
      filename: decodedFilename,
      content,
      lastModified: fileStat.mtime.toISOString(),
      source: "ChatGPT",
      status: "Raw",
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
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

export function getMarkdownViewHref(filename: string): string {
  return `/view/${encodeURIComponent(filename)}`;
}
