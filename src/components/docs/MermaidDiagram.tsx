/**
 * MermaidDiagram Component
 * Renders mermaid diagram code using mermaid.js. Used inside MarkdownRenderer for mermaid code blocks.
 */

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  /** Mermaid diagram source code. */
  chart: string;
  /** Optional id for the SVG container (for accessibility). */
  id?: string;
}

/** Initialize mermaid once with theme that respects dark/light. */
let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;
  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark";
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
  });
  mermaidInitialized = true;
}

export function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!chart.trim() || !containerRef.current) return;

    setError(null);
    setSvg(null);

    initMermaid();

    const renderId = id ?? `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    mermaid
      .render(renderId, chart)
      .then(({ svg: result }) => {
        setSvg(result);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to render diagram");
      });
  }, [chart, id]);

  if (error) {
    return (
      <div
        className="my-4 rounded border-2 border-danger bg-danger/10 p-3 text-danger text-sm"
        role="alert"
      >
        <strong>Diagram error:</strong> {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className="my-4 flex items-center justify-center py-8 text-text-muted text-sm"
        role="status"
        aria-label="Loading diagram"
      >
        Loading diagram…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto rounded border-2 border-border bg-surface p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden="true"
    />
  );
}
