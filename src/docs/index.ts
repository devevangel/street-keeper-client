/**
 * Docs index
 * Exports all markdown docs for the in-app docs viewer.
 */

import codingPatterns from "./CODING_PATTERNS.md?raw";
import componentGuide from "./COMPONENT_GUIDE.md?raw";
import designTokens from "./DESIGN_TOKENS.md?raw";
import authFlow from "./AUTH_FLOW.md?raw";
import homePage from "./HOME_PAGE.md?raw";
import engineIntegration from "./ENGINE_INTEGRATION.md?raw";
import howEnginesWork from "./HOW_ENGINES_WORK.md?raw";

export interface DocEntry {
  slug: string;
  title: string;
  content: string;
}

export const DOCS: DocEntry[] = [
  {
    slug: "coding-patterns",
    title: "Coding Patterns",
    content: codingPatterns,
  },
  { slug: "components", title: "Component Guide", content: componentGuide },
  { slug: "design-tokens", title: "Design Tokens", content: designTokens },
  { slug: "auth-flow", title: "Auth Flow", content: authFlow },
  { slug: "home-page", title: "Home Page", content: homePage },
  { slug: "engine-integration", title: "Engine Integration", content: engineIntegration },
  { slug: "how-engines-work", title: "How the Engines Work", content: howEnginesWork },
];

export function getDocBySlug(slug: string): DocEntry | undefined {
  return DOCS.find((d) => d.slug === slug);
}
