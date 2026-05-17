import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { callTerminalData } from "@kash/supabase";
import { initPowerSync } from "@kash/sync";
import { KioskFlow } from "./KioskFlow";
import type { KioskSettings, ResolvedKioskSettings } from "../types/kiosk";

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL ?? "";

type BootState = "loading" | "ready" | "error";

/**
 * Boots the kiosk: fetches catalog from edge fn, starts PowerSync sync,
 * then renders KioskFlow. This replaces the old TerminalBootstrap pattern.
 */
export function KioskBootstrap() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [bootState, setBootState] = useState<BootState>("loading");
  const [kioskSettings, setKioskSettings] = useState<KioskSettings | null>(null);
  const [resolved, setResolved] = useState<ResolvedKioskSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    async function boot() {
      try {
        // 1. Fetch all kiosk data (catalog + settings + PowerSync token)
        const data = await callTerminalData(tenantId!);

        // 2. Start PowerSync sync for offline-first
        if (POWERSYNC_URL && data.powersync_token) {
          await initPowerSync({ url: POWERSYNC_URL, token: data.powersync_token });
        }

        const settings: KioskSettings = {
          tenantId: tenantId!,
          establishmentId: data.tenant.establishment_id,
          tenantName: data.tenant.name,
          settings: data.settings,
          parentSettings: data.parent_settings,
          products: data.products,
          categories: data.categories,
          customizationPhases: data.customization_phases,
          customizationOptions: data.customization_options,
          productCustomizationPhases: data.product_customization_phases ?? [],
          paymentMethods: data.payment_methods,
          orderTypes: data.order_types,
        };

        setKioskSettings(settings);

        // 3. Resolve per-child overrides merged onto parent defaults
        // Child's non-null columns override parent; null = inherit parent
        const child = data.settings;
        const parent = data.parent_settings;

        setResolved({
          tenantId: tenantId!,
          tenantName: data.tenant.name,
          welcomeImageUrl: child.terminal_welcome_image_url ?? parent?.terminal_welcome_image_url ?? null,
          welcomeVideoUrl: child.terminal_welcome_video_url ?? parent?.terminal_welcome_video_url ?? null,
          primaryColor: child.terminal_primary_color ?? parent?.terminal_primary_color ?? "#97f56d",
          backgroundColor: child.terminal_background_color ?? parent?.terminal_background_color ?? "#212121",
          logoUrl: child.logo_url ?? parent?.logo_url ?? null,
          defaultCurrency: child.default_currency ?? parent?.default_currency ?? "MAD",
          offertEnabled: child.offert_enabled ?? parent?.offert_enabled ?? false,
          loyaltyEnabled: child.loyalty_enabled ?? parent?.loyalty_enabled ?? false,
          onlinePaymentEnabled: child.online_payment_enabled ?? parent?.online_payment_enabled ?? false,
        });

        setBootState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de démarrage");
        setBootState("error");
      }
    }

    boot();
  }, [tenantId]);

  if (bootState === "loading") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#97f56d] flex items-center justify-center">
          <span className="text-3xl font-black text-black font-otacos">K</span>
        </div>
        <div className="w-8 h-8 rounded-full border-4 border-[#97f56d] border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm">Démarrage du kiosk…</p>
      </div>
    );
  }

  if (bootState === "error" || !kioskSettings || !resolved) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-white font-semibold">Erreur de démarrage</p>
          <p className="text-white/40 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#97f56d] text-black rounded-lg font-semibold text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return <KioskFlow settings={kioskSettings} resolved={resolved} />;
}
