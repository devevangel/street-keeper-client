/**
 * MapLegend Component
 * Small overlay on the map explaining street colors: completed (green) vs in progress (yellow dashed).
 */

export function MapLegend() {
  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded border border-border bg-bg/95 px-3 py-2 text-xs shadow"
      aria-label="Map legend"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-6 rounded shrink-0"
          style={{ backgroundColor: "#16a34a" }}
        />
        <span className="text-text">Completed</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="inline-block h-0 w-6 shrink-0 self-center border-b-2 border-[#ca8a04] opacity-90"
          style={{ borderStyle: "dashed" }}
        />
        <span className="text-text">In progress</span>
      </div>
    </div>
  );
}
