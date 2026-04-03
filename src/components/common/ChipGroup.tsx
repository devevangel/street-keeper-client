export interface ChipItem {
  value: string;
  label: string;
}

export interface ChipGroupProps {
  items: ChipItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ChipGroup({
  items,
  value,
  onChange,
  className = "",
}: ChipGroupProps) {
  return (
    <div className={["flex flex-wrap gap-2", className].join(" ")} role="tablist">
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={[
              "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors duration-150",
              isActive
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-transparent text-text-muted hover:bg-card-bg hover:text-text",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
