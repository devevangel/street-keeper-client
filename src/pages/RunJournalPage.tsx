/**
 * Run Journal — scrollable history of every run celebration the user has
 * earned. Reuses `CelebrationHistoryList`; clicking an entry reopens the
 * full `RunCelebration` overlay in read-only mode.
 *
 * Entry points: TabNav "Journal" tab and contextual links from the homepage.
 */

import { PageHeader } from "../components/common";
import { CelebrationHistoryList } from "../components/celebration/CelebrationHistoryList";

export function RunJournalPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 md:pb-12">
      <div className="space-y-1">
        <PageHeader title="Run Journal" />
        <p className="text-sm text-text-muted">
          Every run that moved your map. Tap any entry to replay the celebration.
        </p>
      </div>
      <CelebrationHistoryList />
    </div>
  );
}
