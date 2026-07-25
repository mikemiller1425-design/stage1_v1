"use client";

import { useMemo, useState, useTransition } from "react";
import {
  approveForStage3,
  clearStage3Approval,
} from "@/app/actions/approvals";
import { analyzeIntent } from "@/app/actions/analyze-intent";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import {
  buildApprovedPackage,
  copyMarkdownToClipboard,
  downloadMarkdownFile,
  getApprovedPackageFilename,
} from "@/lib/approved-package";

type IntentAnalysisPanelProps = {
  filename: string;
  markdownContent: string;
  initiallyApproved?: boolean;
};

type ExportFeedback = {
  type: "copy" | "download";
  message: string;
};

export function IntentAnalysisPanel({
  filename,
  markdownContent,
  initiallyApproved = false,
}: IntentAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [isApproving, startApproveTransition] = useTransition();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(initiallyApproved);
  const [exportFeedback, setExportFeedback] = useState<ExportFeedback | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const packageFilename = useMemo(
    () => getApprovedPackageFilename(filename),
    [filename],
  );

  const packageContent = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return buildApprovedPackage({
      filename,
      originalMarkdown: markdownContent,
      analysis,
      model,
    });
  }, [analysis, filename, markdownContent, model]);

  function handleRunAnalysis() {
    setError(null);
    setActionError(null);
    setExportFeedback(null);
    setIsApproved(false);

    startTransition(async () => {
      await clearStage3Approval(filename);
      const result = await analyzeIntent(markdownContent);

      if (!result.ok) {
        setAnalysis(null);
        setModel(null);
        setError(result.error);
        return;
      }

      setAnalysis(result.analysis);
      setModel(result.model);
      setError(null);
    });
  }

  function handleApproveAndContinue() {
    if (!analysis || !packageContent) {
      return;
    }

    setActionError(null);
    setExportFeedback(null);

    startApproveTransition(async () => {
      const result = await approveForStage3(filename, model);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setIsApproved(true);
    });
  }

  async function handleCopy() {
    if (!packageContent) {
      return;
    }

    try {
      await copyMarkdownToClipboard(packageContent);
      setActionError(null);
      setExportFeedback({
        type: "copy",
        message: "Combined package copied to clipboard.",
      });
    } catch {
      setExportFeedback(null);
      setActionError("Could not copy to clipboard. Try downloading instead.");
    }
  }

  function handleDownload() {
    if (!packageContent) {
      return;
    }

    downloadMarkdownFile(packageFilename, packageContent);
    setActionError(null);
    setExportFeedback({
      type: "download",
      message: `Downloaded ${packageFilename}.`,
    });
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-900">Intent Analysis</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Send this document to Claude for core intent, assumptions,
            differentiation, and open questions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={isPending}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isPending
            ? "Running analysis…"
            : analysis
              ? "Re-run Intent Analysis"
              : "Run Intent Analysis"}
        </button>
      </div>

      {isPending && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <span
              aria-hidden
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
            />
            <span>Claude is analyzing this markdown…</span>
          </div>
        </div>
      )}

      {!isPending && error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          <p className="font-medium">Intent Analysis failed</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}

      {!isPending && analysis && packageContent && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-900">
                  Claude analysis
                </p>
                {isApproved && (
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
                    Approved
                  </span>
                )}
              </div>
              {model && (
                <p className="font-mono text-xs text-zinc-500">{model}</p>
              )}
            </div>
            <MarkdownViewer content={analysis} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-medium text-zinc-900">
                  Approve & Continue to Stage 3
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Create a clean Stage 1 package with the original markdown and
                  Claude analysis, then copy or download it for Stage 3.
                </p>
              </div>

              {!isApproved ? (
                <button
                  type="button"
                  onClick={handleApproveAndContinue}
                  disabled={isApproving}
                  className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {isApproving
                    ? "Approving…"
                    : "Approve & Continue to Stage 3"}
                </button>
              ) : (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                  >
                    Copy to clipboard
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                  >
                    Download .md file
                  </button>
                </div>
              )}
            </div>

            {isApproved && (
              <div
                role="status"
                className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              >
                <p className="font-medium">Approved for Stage 3</p>
                <p className="mt-1 text-emerald-800">
                  Package ready as{" "}
                  <code className="font-mono text-emerald-900">
                    {packageFilename}
                  </code>
                  . The intake table now marks this file as Approved.
                </p>
                {exportFeedback && (
                  <p className="mt-2 text-emerald-800">{exportFeedback.message}</p>
                )}
              </div>
            )}

            {actionError && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {actionError}
              </div>
            )}
          </div>
        </div>
      )}

      {!isPending && !analysis && !error && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
          {initiallyApproved ? (
            <>
              <p className="text-sm font-medium text-emerald-800">
                This file is already marked Approved in the intake table.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Re-run Intent Analysis to generate a fresh package for Stage 3.
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              No analysis yet. Click{" "}
              <span className="font-medium text-zinc-700">
                Run Intent Analysis
              </span>{" "}
              to generate one.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
