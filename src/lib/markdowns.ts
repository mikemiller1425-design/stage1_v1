import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { getApproval, getApprovals } from "@/lib/approvals";

export type IntakeStatus = "Raw" | "Approved";

export type MarkdownFile = {
  filename: string;
  lastModified: string;
  source: "ChatGPT";
  status: IntakeStatus;
};

export type MarkdownDocument = {
  filename: string;
  content: string;
  lastModified: string;
  source: "ChatGPT";
  status: IntakeStatus;
};

const DEFAULT_MARKDOWNS_DIR = "./markdowns";

/**
 * Resolves the markdown intake folder.
 * Uses MARKDOWNS_DIR when set (absolute or relative), otherwise ./markdowns.
 * Absolute paths (including Synology/network mounts) are supported.
 */
export function getMarkdownsDir(): string {
  const configured = process.env.MARKDOWNS_DIR?.trim();
  const cwd = process.cwd();

  if (!configured) {
    return path.resolve(
      /* turbopackIgnore: true */ cwd,
      DEFAULT_MARKDOWNS_DIR,
    );
  }

  // Absolute paths resolve to themselves; relative paths resolve from cwd.
  return path.isAbsolute(configured)
    ? path.normalize(configured)
    : path.resolve(/* turbopackIgnore: true */ cwd, configured);
}

/** Human-friendly path label for UI copy. */
export function getMarkdownsDirLabel(): string {
  const configured = process.env.MARKDOWNS_DIR?.trim();
  return configured || DEFAULT_MARKDOWNS_DIR;
}

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

  const resolvedDir = getMarkdownsDir();
  const resolvedPath = path.resolve(resolvedDir, filename);
  const relative = path.relative(resolvedDir, resolvedPath);

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative === ""
  ) {
    return null;
  }

  return resolvedPath;
}

export async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  const markdownsDir = getMarkdownsDir();
  let entries: string[];

  try {
    entries = await readdir(markdownsDir);
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

  const approvals = await getApprovals();
  const markdownEntries = entries.filter((name) => name.endsWith(".md"));

  const files = await Promise.all(
    markdownEntries.map(async (filename) => {
      const filePath = path.join(markdownsDir, filename);
      const fileStat = await stat(filePath);

      return {
        filename,
        lastModified: fileStat.mtime.toISOString(),
        source: "ChatGPT" as const,
        status: (approvals[filename] ? "Approved" : "Raw") as IntakeStatus,
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
    const [content, fileStat, approval] = await Promise.all([
      readFile(filePath, "utf8"),
      stat(filePath),
      getApproval(decodedFilename),
    ]);

    return {
      filename: decodedFilename,
      content,
      lastModified: fileStat.mtime.toISOString(),
      source: "ChatGPT",
      status: approval ? "Approved" : "Raw",
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
