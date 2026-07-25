import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createTempWorkspace,
  removeTempWorkspace,
  withEnv,
} from "../../../tests/helpers/temp-fs";

const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const { approveForStage3, clearStage3Approval } = await import(
  "@/app/actions/approvals"
);
const { getApproval } = await import("@/lib/approvals");

const cleanups: Array<() => void | Promise<void>> = [];

afterEach(async () => {
  revalidatePath.mockReset();
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    await cleanup?.();
  }
});

describe("approveForStage3", () => {
  it("rejects non-markdown filenames", async () => {
    const result = await approveForStage3("notes.txt");
    expect(result).toEqual({
      ok: false,
      error: "Only markdown files can be approved.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("persists approval and revalidates paths", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    const result = await approveForStage3("product-notes.md", "claude-sonnet-5");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.approval?.model).toBe("claude-sonnet-5");
    }

    await expect(getApproval("product-notes.md")).resolves.toMatchObject({
      model: "claude-sonnet-5",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/view/product-notes.md");
  });
});

describe("clearStage3Approval", () => {
  it("clears approval and revalidates paths", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    await approveForStage3("product-notes.md", "claude-sonnet-5");
    revalidatePath.mockClear();

    const result = await clearStage3Approval("product-notes.md");
    expect(result).toEqual({ ok: true, approval: null });
    await expect(getApproval("product-notes.md")).resolves.toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/view/product-notes.md");
  });
});
