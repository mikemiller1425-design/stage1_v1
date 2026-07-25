import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownViewerProps = {
  content: string;
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <article className="prose prose-zinc max-w-none prose-headings:scroll-mt-20 prose-headings:tracking-tight prose-a:text-zinc-900 prose-a:underline-offset-2 prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
