type BuildApprovedPackageInput = {
  filename: string;
  originalMarkdown: string;
  analysis: string;
  model?: string | null;
};

export function buildApprovedPackage({
  filename,
  originalMarkdown,
  analysis,
  model,
}: BuildApprovedPackageInput): string {
  const approvedAt = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  return `# Approved Stage 1 Package — ${filename}

- **Source file:** \`${filename}\`
- **Approved at:** ${approvedAt}
- **Analysis model:** ${model ?? "Claude"}
- **Status:** Approved for Stage 3

---

## Original Markdown

${originalMarkdown.trim()}

---

## Intent Analysis (from Claude)

${analysis.trim()}
`;
}

export function getApprovedPackageFilename(sourceFilename: string): string {
  const baseName = sourceFilename.replace(/\.md$/i, "");
  return `${baseName}-approved-stage1.md`;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function copyMarkdownToClipboard(content: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
