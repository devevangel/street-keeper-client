/**
 * MarkdownRenderer Component
 * Renders markdown content with syntax highlighting, GFM (tables, etc.), and mermaid diagrams.
 */

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { MermaidDiagram } from "./MermaidDiagram";

interface MarkdownRendererProps {
  /** Raw markdown string. */
  content: string;
}

/** Slugify heading text for anchor IDs. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const components: Components = {
  h1: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : String(children);
    const id = slugify(text);
    return (
      <h1
        id={id}
        className="mb-4 mt-8 border-b-2 border-border pb-2 text-2xl font-bold text-text"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : String(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="mb-3 mt-6 text-xl font-bold text-text scroll-mt-4"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : String(children);
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="mb-2 mt-4 text-lg font-bold text-text scroll-mt-4"
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ children, ...props }) => (
    <p className="mb-3 text-text leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-3 list-disc pl-6 text-text" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-3 list-decimal pl-6 text-text" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-accent underline hover:opacity-90"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-3 border-l-4 border-border pl-4 italic text-text-muted"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table
        className="w-full border-collapse border-2 border-border text-sm text-text"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-surface" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-2 border-border px-3 py-2 text-left font-bold"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-2 border-border px-3 py-2" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-border even:bg-surface/50" {...props}>
      {children}
    </tr>
  ),
  code: (props) => {
    const { node, className, children, ...rest } = props;
    const inline = "inline" in props && props.inline;
    const codeString = String(children).replace(/\n$/, "");
    const lang = className?.replace("language-", "") ?? "";

    if (!inline && lang === "mermaid") {
      return <MermaidDiagram chart={codeString} />;
    }

    if (inline) {
      return (
        <code
          className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-sm text-text"
          {...rest}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="mb-4 overflow-x-auto rounded border-2 border-border bg-surface p-4 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  hr: () => <hr className="my-6 border-t-2 border-border" />,
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="docs-prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
