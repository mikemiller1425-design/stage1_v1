import { MarkdownTable } from "@/components/MarkdownTable";
import { getMarkdownFiles } from "@/lib/markdowns";

export const dynamic = "force-dynamic";

export default async function Home() {
  const files = await getMarkdownFiles();

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center px-6 py-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Stage 1 – Markdown Intake
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-zinc-900">Markdown files</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Scanned from the local{" "}
              <code className="font-mono text-zinc-700">markdowns</code> folder.
              Click a row to open the viewer.
            </p>
          </div>
          <p className="text-sm tabular-nums text-zinc-500">
            {files.length} {files.length === 1 ? "file" : "files"}
          </p>
        </div>

        <MarkdownTable files={files} />
      </main>
    </div>
  );
}
