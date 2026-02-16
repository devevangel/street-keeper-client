/**
 * First Street Card
 * Shows the nearest shortest street for new users to run.
 */
import { Button } from "../common/Button";
import { Card } from "../common/Card";

interface FirstStreetCardProps {
  street: {
    name: string;
    lengthMeters: number;
    distanceFromUser: number;
  };
  onShowOnMap: () => void;
}

export function FirstStreetCard({
  street,
  onShowOnMap,
}: FirstStreetCardProps) {
  const lengthKm = (street.lengthMeters / 1000).toFixed(1);
  const distanceText =
    street.distanceFromUser < 100
      ? `${street.distanceFromUser}m`
      : `${(street.distanceFromUser / 1000).toFixed(1)}km`;

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-text font-semibold text-base">Your first street</h2>
        <p className="text-text font-medium text-lg mt-1">{street.name}</p>
        <p className="text-text-muted text-sm mt-1">
          ~{lengthKm} km · {distanceText} from you
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="md"
        className="w-full"
        onClick={onShowOnMap}
      >
        Show on map
      </Button>
    </Card>
  );
}
