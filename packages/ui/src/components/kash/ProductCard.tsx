import { cn } from "../../lib/utils";
import type { Product } from "@kash/types";

interface ProductCardProps {
  product: Product;
  currencySymbol: string;
  onClick?: () => void;
  isSelected?: boolean;
  variant?: "pos" | "kiosk";
  className?: string;
}

/**
 * Shared product card used in both POS cashier and kiosk.
 * Kiosk variant is larger with prominent image.
 * POS variant is compact for the grid cashier view.
 */
export function ProductCard({
  product,
  currencySymbol,
  onClick,
  isSelected,
  variant = "pos",
  className,
}: ProductCardProps) {
  if (variant === "kiosk") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 active:scale-95",
          "bg-white shadow-md hover:shadow-lg",
          isSelected && "ring-4 ring-[#97f56d]",
          !product.is_active && "opacity-50 pointer-events-none",
          className
        )}
      >
        <div className="relative aspect-square w-full bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
              🍽
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1">
          <span className="font-semibold text-sm text-gray-900 line-clamp-2 text-left">
            {product.name}
          </span>
          <span className="font-bold text-base text-[#97f56d] text-left">
            {product.price.toFixed(2)} {currencySymbol}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 active:scale-[0.98]",
        "bg-white hover:bg-gray-50 text-left w-full",
        isSelected && "border-[#97f56d] ring-2 ring-[#97f56d]/30",
        !product.is_active && "opacity-50 pointer-events-none",
        className
      )}
    >
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
        {product.description && (
          <p className="text-xs text-gray-500 truncate">{product.description}</p>
        )}
      </div>
      <span className="font-bold text-sm text-gray-900 flex-shrink-0">
        {product.price.toFixed(2)} {currencySymbol}
      </span>
    </button>
  );
}
