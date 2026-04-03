import { Link } from "react-router-dom";
import { Card, ProgressBar, SectionHeading } from "../common";

interface ProjectStatsCardProps {
  projectId: string;
  name: string;
  totalStreets: number;
  completedStreets: number;
  progress: number;
}

export function ProjectStatsCard({
  projectId,
  name,
  totalStreets,
  completedStreets,
  progress,
}: ProjectStatsCardProps) {
  const pct = Math.round(progress);

  return (
    <Card padding="none" className="w-full p-3">
      <SectionHeading>Project</SectionHeading>
      <Link
        to={`/projects/${projectId}`}
        className="block text-xl font-bold leading-tight text-text hover:underline"
      >
        {name}
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar percentage={pct} height={4} className="flex-1" />
        <span className="shrink-0 text-sm font-semibold text-text">{pct}%</span>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        {completedStreets} / {totalStreets} streets
      </p>
    </Card>
  );
}
