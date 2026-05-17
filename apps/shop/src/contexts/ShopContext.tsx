import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { callClickCollectData } from "@kash/supabase";
import type { ClickCollectShopData } from "@kash/supabase";

interface ShopContextValue {
  data: ClickCollectShopData | null;
  isLoading: boolean;
  error: Error | null;
  primaryColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
  currency: string;
}

const ShopContext = createContext<ShopContextValue>({} as ShopContextValue);

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: "Dhs",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shop", tenantSlug],
    queryFn: () => callClickCollectData(tenantSlug!),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });

  const s = data?.settings;
  const primaryColor = s?.cc_primary_color ?? s?.primary_color ?? "#97f56d";
  const backgroundColor = s?.cc_background_color ?? "#ffffff";
  const buttonColor = s?.cc_button_color ?? primaryColor;
  const buttonTextColor = s?.cc_button_text_color ?? "#000000";
  const currency = CURRENCY_SYMBOLS[s?.default_currency ?? "MAD"] ?? (s?.default_currency ?? "Dhs");

  return (
    <ShopContext.Provider
      value={{
        data: data ?? null,
        isLoading,
        error: error as Error | null,
        primaryColor,
        backgroundColor,
        buttonColor,
        buttonTextColor,
        currency,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
