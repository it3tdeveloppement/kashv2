import { cn } from "@kash/ui";
import type { Category } from "@kash/types";

interface CategoryNavProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryNav({ categories, selected, onSelect }: CategoryNavProps) {
  return (
    <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
          !selected
            ? "bg-[#97f56d] text-black"
            : "bg-white/10 text-white/70 hover:bg-white/15"
        )}
      >
        Tous
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
            selected === cat.id
              ? "bg-[#97f56d] text-black"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
