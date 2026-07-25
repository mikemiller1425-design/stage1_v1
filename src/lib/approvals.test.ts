import { readFile } from "fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearFileApproval,
  getApproval,
  getApprovals,
  getApprovalsPath,
  markFileApproved,
} from "@/lib/approvals";
import {
  createTempWorkspace,
  removeTempWorkspace,
  withEnv,
  writeApprovalsFile,
} from "../../tests/helpers/temp-fs";

const cleanups: Array<() => void | Promise<void>> = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    await cleanup?.();
  }
});

describe("getApprovalsPath", () => {
  it("defaults to cwd/data/approvals.json", () => {
    cleanups.push(withEnv({ APPROVALS_PATH: undefined }));
    expect(getApprovalsPath()).toMatch(/data[/\\]approvals\.json$/);
  });

  it("uses absolute APPROVALS_PATH when provided", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));
    expect(getApprovalsPath()).toBe(workspace.approvalsPath);
  });
});

describe("approvals persistence", () => {
  it("returns {} when approvals file is missing", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    await expect(getApprovals()).resolves.toEqual({});
    await expect(getApproval("missing.md")).resolves.toBeNull();
  });

  it("marks a file approved and persists model + timestamp", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    const before = Date.now();
    const record = await markFileApproved("notes.md", "claude-sonnet-5");
    const after = Date.now();

    expect(record.model).toBe("claude-sonnet-5");
    expect(Date.parse(record.approvedAt)).toBeGreaterThanOrEqual(before - 1000);
    expect(Date.parse(record.approvedAt)).toBeLessThanOrEqual(after + 1000);

    await expect(getApproval("notes.md")).resolves.toEqual(record);
    await expect(getApprovals()).resolves.toEqual({ "notes.md": record });

    const raw = await readFile(workspace.approvalsPath, "utf8");
    expect(JSON.parse(raw)).toEqual({ "notes.md": record });
  });

  it("stores null model when omitted", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    const record = await markFileApproved("notes.md");
    expect(record.model).toBeNull();
  });

  it("overwrites an existing approval for the same file", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    await markFileApproved("notes.md", "old-model");
    const second = await markFileApproved("notes.md", "new-model");

    expect(second.model).toBe("new-model");
    const all = await getApprovals();
    expect(Object.keys(all)).toEqual(["notes.md"]);
    expect(all["notes.md"].model).toBe("new-model");
  });

  it("clears an approval and is a no-op for unknown files", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    await markFileApproved("keep.md", "claude-sonnet-5");
    await markFileApproved("drop.md", "claude-sonnet-5");

    await clearFileApproval("drop.md");
    await clearFileApproval("never-existed.md");

    await expect(getApproval("drop.md")).resolves.toBeNull();
    await expect(getApproval("keep.md")).resolves.toMatchObject({
      model: "claude-sonnet-5",
    });
  });

  it("treats non-object JSON as empty approvals map", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    await writeApprovalsFile(workspace.approvalsPath, ["not", "an", "object"]);
    await expect(getApprovals()).resolves.toEqual({});
  });

  it("throws on invalid JSON", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(withEnv({ APPROVALS_PATH: workspace.approvalsPath }));

    const { writeFile } = await import("fs/promises");
    await writeFile(workspace.approvalsPath, "{not-json", "utf8");

    await expect(getApprovals()).rejects.toThrow();
  });
});
