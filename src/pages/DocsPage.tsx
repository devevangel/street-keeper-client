/**
 * DocsPage
 * In-app docs viewer: sidebar + markdown content. Reads slug from URL and renders the matching doc.
 */

import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DOCS, getDocBySlug } from "../docs";
import { ROUTES } from "../config/constants";
import { DocsSidebar } from "../components/docs/DocsSidebar";
import { MarkdownRenderer } from "../components/docs/MarkdownRenderer";
import { Button } from "../components/common";

export function DocsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const doc = slug ? getDocBySlug(slug) : DOCS[0];

  if (!doc) {
    return <Navigate to={ROUTES.DOCS} replace />;
  }

  const content = doc.content;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <DocsSidebar
        isOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="flex-1 p-4 pb-8 md:p-6">
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? "Hide menu" : "Show menu"}
          </Button>
        </div>
        <main id="docs-main" className="max-w-4xl">
          <MarkdownRenderer content={content} />
        </main>
      </div>
    </div>
  );
}
