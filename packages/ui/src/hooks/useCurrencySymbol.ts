import { useCallback } from "react";

/**
 * MANDATORY: every price/total must use this hook.
 * Never hardcode "MAD", "€", "Dhs", or toFixed(2) + ' Dhs'.
 */
export function useCurrencySymbol(defaultCurrency?: string | null): {
  symbol: string;
  formatPrice: (amount: number) => string;
} {
  const currency = defaultCurrency ?? "MAD";

  const symbolMap: Record<string, string> = {
    MAD: "Dhs",
    EUR: "€",
    USD: "$",
    GBP: "£",
    DZD: "DA",
    TND: "DT",
  };

  const symbol = symbolMap[currency] ?? currency;

  const formatPrice = useCallback(
    (amount: number) => `${amount.toFixed(2)} ${symbol}`,
    [symbol]
  );

  return { symbol, formatPrice };
}
