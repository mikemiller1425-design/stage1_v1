"use server";

import { revalidatePath } from "next/cache";
import {
  clearFileApproval,
  markFileApproved,
  type ApprovalRecord,
} from "@/lib/approvals";

export type ApprovalActionResult =
  | { ok: true; approval: ApprovalRecord | null }
  | { ok: false; error: string };

export async function approveForStage3(
  filename: string,
  model?: string | null,
): Promise<ApprovalActionResult> {
  if (!filename.endsWith(".md")) {
    return { ok: false, error: "Only markdown files can be approved." };
  }

  try {
    const approval = await markFileApproved(filename, model);
    revalidatePath("/");
    revalidatePath(`/view/${encodeURIComponent(filename)}`);
    return { ok: true, approval };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save approval status.",
    };
  }
}

export async function clearStage3Approval(
  filename: string,
): Promise<ApprovalActionResult> {
  try {
    await clearFileApproval(filename);
    revalidatePath("/");
    revalidatePath(`/view/${encodeURIComponent(filename)}`);
    return { ok: true, approval: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not clear approval status.",
    };
  }
}
