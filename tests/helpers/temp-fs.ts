import { mkdir, mkdtemp, rm, symlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";

type TempWorkspace = {
  root: string;
  markdownsDir: string;
  approvalsPath: string;
};

const ENV_KEYS = ["MARKDOWNS_DIR", "APPROVALS_PATH", "ANTHROPIC_API_KEY"] as const;

export async function createTempWorkspace(): Promise<TempWorkspace> {
  const root = await mkdtemp(path.join(os.tmpdir(), "stage1-intake-"));
  const markdownsDir = path.join(root, "markdowns");
  const approvalsPath = path.join(root, "data", "approvals.json");

  await mkdir(markdownsDir, { recursive: true });
  await mkdir(path.dirname(approvalsPath), { recursive: true });

  return { root, markdownsDir, approvalsPath };
}

export async function writeMarkdown(
  dir: string,
  filename: string,
  content: string,
): Promise<string> {
  const filePath = path.join(dir, filename);
  await writeFile(filePath, content, "utf8");
  return filePath;
}

export async function writeApprovalsFile(
  approvalsPath: string,
  data: unknown,
): Promise<void> {
  await mkdir(path.dirname(approvalsPath), { recursive: true });
  await writeFile(
    approvalsPath,
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

export async function createSymlink(
  target: string,
  linkPath: string,
): Promise<void> {
  await symlink(target, linkPath);
}

export function withEnv(
  overrides: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
): () => void {
  const previous = new Map<string, string | undefined>();

  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return () => {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

export async function removeTempWorkspace(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}
