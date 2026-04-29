/**
 * Run Journal — scrollable history of every run celebration the user has
 * earned. Reuses `CelebrationHistoryList`; clicking an entry reopens the
 * full `RunCelebration` overlay in read-only mode.
 *
 * Entry points: TabNav "Journal" tab and contextual links from the homepage.
 */

import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/common";
import { CelebrationHistoryList } from "../components/celebration/CelebrationHistoryList";

export function RunJournalPage() {
  const [searchParams] = useSearchParams();
  const demo = searchParams.get("__journal") === "demo";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 md:pb-12">
      <div className="space-y-1">
        <PageHeader title={demo ? "Run Journal (Demo)" : "Run Journal"} />
        <p className="text-sm text-text-muted">
          {demo
            ? "Showing 20 fixture entries for demo purposes."
            : "Every run that moved your map. Tap any entry to replay the celebration."}
        </p>
      </div>
      <CelebrationHistoryList demo={demo} />
    </div>
  );
}
