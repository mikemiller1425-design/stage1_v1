import Link from "next/link";

export default function MarkdownNotFound() {
  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            File not found
          </h1>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            Back to table
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-900">
            That markdown file could not be opened.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            It may have been renamed or removed from the configured markdowns
            folder.
          </p>
        </div>
      </main>
    </div>
  );
}
