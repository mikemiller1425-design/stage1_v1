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

  return `# Stage 1 Approved Package

- **Source file:** \`${filename}\`
- **Approved at:** ${approvedAt}
- **Analysis model:** ${model ?? "Claude"}

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
  return `${baseName}-stage1-approved.md`;
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
