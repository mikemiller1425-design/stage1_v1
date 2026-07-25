import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatLastModified,
  getMarkdownContent,
  getMarkdownFiles,
  getMarkdownsDir,
  getMarkdownsDirLabel,
  getMarkdownViewHref,
  isSafeMarkdownFilename,
} from "@/lib/markdowns";
import {
  createSymlink,
  createTempWorkspace,
  removeTempWorkspace,
  withEnv,
  writeApprovalsFile,
  writeMarkdown,
} from "../../tests/helpers/temp-fs";

const cleanups: Array<() => void | Promise<void>> = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    await cleanup?.();
  }
});

describe("getMarkdownsDir / getMarkdownsDirLabel", () => {
  it("defaults to ./markdowns under cwd when unset", () => {
    cleanups.push(withEnv({ MARKDOWNS_DIR: undefined }));
    expect(getMarkdownsDir()).toBe(path.resolve(process.cwd(), "./markdowns"));
    expect(getMarkdownsDirLabel()).toBe("./markdowns");
  });

  it("treats whitespace-only MARKDOWNS_DIR as unset", () => {
    cleanups.push(withEnv({ MARKDOWNS_DIR: "   " }));
    expect(getMarkdownsDir()).toBe(path.resolve(process.cwd(), "./markdowns"));
    expect(getMarkdownsDirLabel()).toBe("./markdowns");
  });

  it("resolves relative MARKDOWNS_DIR from cwd", () => {
    cleanups.push(withEnv({ MARKDOWNS_DIR: "./custom-exports" }));
    expect(getMarkdownsDir()).toBe(
      path.resolve(process.cwd(), "./custom-exports"),
    );
    expect(getMarkdownsDirLabel()).toBe("./custom-exports");
  });

  it("keeps absolute MARKDOWNS_DIR (Synology-style path)", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({ MARKDOWNS_DIR: workspace.markdownsDir }),
    );

    expect(getMarkdownsDir()).toBe(path.normalize(workspace.markdownsDir));
    expect(getMarkdownsDirLabel()).toBe(workspace.markdownsDir);
  });
});

describe("isSafeMarkdownFilename", () => {
  it.each([
    ["notes.md", true],
    ["product-notes.md", true],
    ["report..final.md", true],
    ["my notes.md", true],
    ["file.MD", false],
    ["file.txt", false],
    ["", false],
    [".md", true],
    ["../secret.md", false],
    ["..\\secret.md", false],
    ["folder/notes.md", false],
    ["folder\\notes.md", false],
    ["/tmp/notes.md", false],
  ])("filename %j => %s", (filename, expected) => {
    expect(isSafeMarkdownFilename(filename)).toBe(expected);
  });
});

describe("getMarkdownFiles", () => {
  it("returns [] when markdowns directory is missing", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    const missing = path.join(workspace.root, "does-not-exist");
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: missing,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await expect(getMarkdownFiles()).resolves.toEqual([]);
  });

  it("returns [] for an empty markdowns directory", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await expect(getMarkdownFiles()).resolves.toEqual([]);
  });

  it("lists only .md files, ignores other extensions and nested dirs", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(workspace.markdownsDir, "b-notes.md", "# B");
    await writeMarkdown(workspace.markdownsDir, "a-notes.md", "# A");
    await writeFile(path.join(workspace.markdownsDir, "readme.txt"), "nope");
    await writeFile(path.join(workspace.markdownsDir, "image.png"), "nope");
    await mkdir(path.join(workspace.markdownsDir, "nested"), { recursive: true });
    await writeMarkdown(
      path.join(workspace.markdownsDir, "nested"),
      "hidden.md",
      "# nested should not appear",
    );

    const files = await getMarkdownFiles();
    expect(files.map((file) => file.filename)).toEqual([
      "a-notes.md",
      "b-notes.md",
    ]);
    expect(files.every((file) => file.source === "ChatGPT")).toBe(true);
    expect(files.every((file) => file.status === "Raw")).toBe(true);
    expect(files.every((file) => Number.isNaN(Date.parse(file.lastModified)))).toBe(
      false,
    );
  });

  it("skips directories that end with .md", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(workspace.markdownsDir, "real.md", "# real");
    await mkdir(path.join(workspace.markdownsDir, "fake.md"));

    const files = await getMarkdownFiles();
    expect(files.map((file) => file.filename)).toEqual(["real.md"]);
  });

  it("marks approved files using approvals store", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(workspace.markdownsDir, "one.md", "# one");
    await writeMarkdown(workspace.markdownsDir, "two.md", "# two");
    await writeApprovalsFile(workspace.approvalsPath, {
      "two.md": {
        approvedAt: "2026-07-24T00:00:00.000Z",
        model: "claude-sonnet-5",
      },
    });

    const files = await getMarkdownFiles();
    expect(files).toEqual([
      expect.objectContaining({ filename: "one.md", status: "Raw" }),
      expect.objectContaining({ filename: "two.md", status: "Approved" }),
    ]);
  });

  it("allows filenames that contain .. as a substring but not traversal", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(workspace.markdownsDir, "draft..v2.md", "# draft");
    const files = await getMarkdownFiles();
    expect(files.map((file) => file.filename)).toEqual(["draft..v2.md"]);
  });
});

describe("getMarkdownContent", () => {
  it("reads content and metadata for a valid file", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(
      workspace.markdownsDir,
      "product-notes.md",
      "# Product Notes\n\nHello",
    );

    const doc = await getMarkdownContent("product-notes.md");
    expect(doc).toMatchObject({
      filename: "product-notes.md",
      content: "# Product Notes\n\nHello",
      source: "ChatGPT",
      status: "Raw",
    });
    expect(doc?.lastModified).toEqual(expect.any(String));
  });

  it("decodes URI-encoded filenames", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(workspace.markdownsDir, "my notes.md", "# spaced");
    const doc = await getMarkdownContent("my%20notes.md");
    expect(doc?.filename).toBe("my notes.md");
    expect(doc?.content).toBe("# spaced");
  });

  it("returns null for missing files", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await expect(getMarkdownContent("missing.md")).resolves.toBeNull();
  });

  it("returns null for unsafe path traversal attempts", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    const outside = path.join(workspace.root, "outside.md");
    await writeFile(outside, "# outside");

    await expect(getMarkdownContent("../outside.md")).resolves.toBeNull();
    await expect(getMarkdownContent("%2e%2e%2foutside.md")).resolves.toBeNull();
    await expect(getMarkdownContent("nested/hidden.md")).resolves.toBeNull();
    await expect(getMarkdownContent("notes.txt")).resolves.toBeNull();
  });

  it("blocks symlink escape outside the markdowns directory", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    const outside = path.join(workspace.root, "secret.md");
    await writeFile(outside, "# secret");
    await createSymlink(
      outside,
      path.join(workspace.markdownsDir, "linked.md"),
    );

    await expect(getMarkdownContent("linked.md")).resolves.toBeNull();
  });

  it("returns null when target is a directory named *.md", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await mkdir(path.join(workspace.markdownsDir, "folder.md"));
    await expect(getMarkdownContent("folder.md")).resolves.toBeNull();
  });

  it("includes Approved status when approval exists", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    await writeMarkdown(workspace.markdownsDir, "approved.md", "# ok");
    await writeApprovalsFile(workspace.approvalsPath, {
      "approved.md": {
        approvedAt: "2026-07-24T12:00:00.000Z",
        model: "claude-sonnet-5",
      },
    });

    const doc = await getMarkdownContent("approved.md");
    expect(doc?.status).toBe("Approved");
  });

  it("preserves unicode content and filenames", async () => {
    const workspace = await createTempWorkspace();
    cleanups.push(() => removeTempWorkspace(workspace.root));
    cleanups.push(
      withEnv({
        MARKDOWNS_DIR: workspace.markdownsDir,
        APPROVALS_PATH: workspace.approvalsPath,
      }),
    );

    const filename = "idée-notes.md";
    await writeMarkdown(workspace.markdownsDir, filename, "# Café\n\n✓ done");
    const doc = await getMarkdownContent(encodeURIComponent(filename));
    expect(doc?.filename).toBe(filename);
    expect(doc?.content).toContain("Café");
    expect(doc?.content).toContain("✓");
  });
});

describe("formatLastModified / getMarkdownViewHref", () => {
  it("formats ISO timestamps as locale strings", () => {
    const formatted = formatLastModified("2026-07-23T23:50:00.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/Jul/);
  });

  it("encodes filenames in view hrefs", () => {
    expect(getMarkdownViewHref("my notes.md")).toBe("/view/my%20notes.md");
    expect(getMarkdownViewHref("a+b.md")).toBe("/view/a%2Bb.md");
  });
});
