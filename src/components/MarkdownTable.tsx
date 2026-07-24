import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatLastModified,
  getMarkdownViewHref,
  type MarkdownFile,
} from "@/lib/markdowns";

type MarkdownTableProps = {
  files: MarkdownFile[];
};

export function MarkdownTable({ files }: MarkdownTableProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-zinc-900">No markdown files found</p>
        <p className="mt-2 text-sm text-zinc-500">
          Add <code className="font-mono text-zinc-700">.md</code> files to the{" "}
          <code className="font-mono text-zinc-700">markdowns</code> folder and
          refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-zinc-50">
          <tr className="border-b border-zinc-200">
            <th
              scope="col"
              className="px-5 py-3.5 font-medium tracking-wide text-zinc-600"
            >
              Filename
            </th>
            <th
              scope="col"
              className="px-5 py-3.5 font-medium tracking-wide text-zinc-600"
            >
              Last Modified Date
            </th>
            <th
              scope="col"
              className="px-5 py-3.5 font-medium tracking-wide text-zinc-600"
            >
              Source
            </th>
            <th
              scope="col"
              className="px-5 py-3.5 font-medium tracking-wide text-zinc-600"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {files.map((file) => (
            <tr
              key={file.filename}
              className="relative transition-colors hover:bg-zinc-50/80"
            >
              <td className="px-5 py-4 font-medium text-zinc-900">
                <Link
                  href={getMarkdownViewHref(file.filename)}
                  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                >
                  {file.filename}
                </Link>
              </td>
              <td className="px-5 py-4 text-zinc-600 tabular-nums">
                {formatLastModified(file.lastModified)}
              </td>
              <td className="px-5 py-4 text-zinc-600">{file.source}</td>
              <td className="px-5 py-4">
                <StatusBadge status={file.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
