import { readdir, readFile, realpath, stat } from "fs/promises";
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

/** Exported for unit testing filename safety rules. */
export function isSafeMarkdownFilename(filename: string): boolean {
  if (!filename || !filename.endsWith(".md")) {
    return false;
  }

  // Reject separators from any platform before basename checks.
  if (filename.includes("/") || filename.includes("\\")) {
    return false;
  }

  // Must be a single path segment (no directories / traversal).
  if (filename !== path.basename(filename)) {
    return false;
  }

  if (path.isAbsolute(filename)) {
    return false;
  }

  if (filename === "." || filename === "..") {
    return false;
  }

  return true;
}

async function resolveMarkdownPath(filename: string): Promise<string | null> {
  if (!isSafeMarkdownFilename(filename)) {
    return null;
  }

  const resolvedDir = getMarkdownsDir();
  const candidatePath = path.resolve(resolvedDir, filename);
  const relative = path.relative(resolvedDir, candidatePath);

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative === ""
  ) {
    return null;
  }

  try {
    const [realDir, realFile] = await Promise.all([
      realpath(resolvedDir),
      realpath(candidatePath),
    ]);

    const realRelative = path.relative(realDir, realFile);
    if (
      realRelative.startsWith("..") ||
      path.isAbsolute(realRelative) ||
      realRelative === ""
    ) {
      return null;
    }

    return realFile;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      // Keep the candidate for callers that want to distinguish missing files
      // after safety checks; getMarkdownContent maps ENOENT to null.
      return candidatePath;
    }
    throw error;
  }
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

      // Skip directories that happen to end in .md
      if (!fileStat.isFile()) {
        return null;
      }

      return {
        filename,
        lastModified: fileStat.mtime.toISOString(),
        source: "ChatGPT" as const,
        status: (approvals[filename] ? "Approved" : "Raw") as IntakeStatus,
      };
    }),
  );

  return files
    .filter((file): file is MarkdownFile => file !== null)
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

export async function getMarkdownContent(
  filename: string,
): Promise<MarkdownDocument | null> {
  const decodedFilename = decodeURIComponent(filename);
  const filePath = await resolveMarkdownPath(decodedFilename);

  if (!filePath) {
    return null;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return null;
    }

    const [content, approval] = await Promise.all([
      readFile(filePath, "utf8"),
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
