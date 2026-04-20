/**
 * CampaignPage
 * Placeholder for the Campaign feature. Shows "Coming soon" until implemented.
 */

import { Card, PageHeader } from "../components/common";

export function CampaignPage() {
  return (
    <div className="p-4 pb-8">
      <PageHeader title="Campaign" />
      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-text">Campaign</h2>
        <p className="text-sm text-text-muted">Coming soon.</p>
      </Card>
    </div>
  );
}
