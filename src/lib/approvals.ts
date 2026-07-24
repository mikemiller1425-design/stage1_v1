import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type ApprovalRecord = {
  approvedAt: string;
  model: string | null;
};

type ApprovalsMap = Record<string, ApprovalRecord>;

const DATA_DIR = path.join(process.cwd(), "data");
const APPROVALS_PATH = path.join(DATA_DIR, "approvals.json");

async function readApprovalsMap(): Promise<ApprovalsMap> {
  try {
    const raw = await readFile(APPROVALS_PATH, "utf8");
    const parsed = JSON.parse(raw) as ApprovalsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
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
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    APPROVALS_PATH,
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
