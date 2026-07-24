"use client";

import { useState, useTransition } from "react";
import { analyzeIntent } from "@/app/actions/analyze-intent";
import { MarkdownViewer } from "@/components/MarkdownViewer";

type IntentAnalysisPanelProps = {
  markdownContent: string;
};

export function IntentAnalysisPanel({
  markdownContent,
}: IntentAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRunAnalysis() {
    setError(null);

    startTransition(async () => {
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
          {isPending ? "Running analysis…" : "Run Intent Analysis"}
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

      {!isPending && analysis && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-4">
            <p className="text-sm font-medium text-zinc-900">
              Claude analysis
            </p>
            {model && (
              <p className="font-mono text-xs text-zinc-500">{model}</p>
            )}
          </div>
          <MarkdownViewer content={analysis} />
        </div>
      )}

      {!isPending && !analysis && !error && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">
            No analysis yet. Click{" "}
            <span className="font-medium text-zinc-700">
              Run Intent Analysis
            </span>{" "}
            to generate one.
          </p>
        </div>
      )}
    </section>
  );
}
