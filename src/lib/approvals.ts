import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type ApprovalRecord = {
  approvedAt: string;
  model: string | null;
};

type ApprovalsMap = Record<string, ApprovalRecord>;

/** Resolves approvals persistence path (overridable for tests via APPROVALS_PATH). */
export function getApprovalsPath(): string {
  const configured = process.env.APPROVALS_PATH?.trim();

  if (configured) {
    return path.isAbsolute(configured)
      ? path.normalize(configured)
      : path.resolve(process.cwd(), configured);
  }

  return path.join(process.cwd(), "data", "approvals.json");
}

async function readApprovalsMap(): Promise<ApprovalsMap> {
  try {
    const raw = await readFile(getApprovalsPath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as ApprovalsMap;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {};
    }
    throw error;
  }
}

async function writeApprovalsMap(approvals: ApprovalsMap): Promise<void> {
  const approvalsPath = getApprovalsPath();
  await mkdir(path.dirname(approvalsPath), { recursive: true });
  await writeFile(
    approvalsPath,
    `${JSON.stringify(approvals, null, 2)}\n`,
    "utf8",
  );
}

export async function getApprovals(): Promise<ApprovalsMap> {
  return readApprovalsMap();
}

export async function getApproval(
  filename: string,
): Promise<ApprovalRecord | null> {
  const approvals = await readApprovalsMap();
  return approvals[filename] ?? null;
}

export async function markFileApproved(
  filename: string,
  model?: string | null,
): Promise<ApprovalRecord> {
  const approvals = await readApprovalsMap();
  const record: ApprovalRecord = {
    approvedAt: new Date().toISOString(),
    model: model ?? null,
  };

  approvals[filename] = record;
  await writeApprovalsMap(approvals);
  return record;
}

export async function clearFileApproval(filename: string): Promise<void> {
  const approvals = await readApprovalsMap();

  if (!(filename in approvals)) {
    return;
  }

  delete approvals[filename];
  await writeApprovalsMap(approvals);
}
