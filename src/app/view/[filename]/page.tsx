import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { formatLastModified, getMarkdownContent } from "@/lib/markdowns";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{
    filename: string;
  }>;
};

export async function generateMetadata({ params }: ViewPageProps) {
  const { filename } = await params;
  const document = await getMarkdownContent(filename);

  if (!document) {
    return {
      title: "File not found – Markdown Intake",
    };
  }

  return {
    title: `${document.filename} – Markdown Intake`,
  };
}

export default async function ViewMarkdownPage({ params }: ViewPageProps) {
  const { filename } = await params;
  const document = await getMarkdownContent(filename);

  if (!document) {
    notFound();
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">Stage 1 – Markdown Intake</p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {document.filename}
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            Back to table
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
          <span>
            Last modified{" "}
            <span className="tabular-nums text-zinc-700">
              {formatLastModified(document.lastModified)}
            </span>
          </span>
          <span className="hidden text-zinc-300 sm:inline">·</span>
          <span>
            Source <span className="text-zinc-700">{document.source}</span>
          </span>
          <span className="hidden text-zinc-300 sm:inline">·</span>
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/15">
            {document.status}
          </span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <MarkdownViewer content={document.content} />
        </div>
      </main>
    </div>
  );
}
