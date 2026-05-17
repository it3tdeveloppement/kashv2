import { useReducer, useEffect } from "react";
import { kioskReducer, initialKioskState } from "../state/kioskReducer";
import type { KioskSettings, ResolvedKioskSettings } from "../types/kiosk";

// Flow steps
import { AccueilStep } from "./steps/AccueilStep";
import { OrderTypeStep } from "./steps/OrderTypeStep";
import { MenuStep } from "./steps/MenuStep";
import { CustomizationStep } from "./steps/CustomizationStep";
import { CartStep } from "./steps/CartStep";
import { LoyaltyStep } from "./steps/LoyaltyStep";
import { PaymentStep } from "./steps/PaymentStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";

const INACTIVITY_TIMEOUT_MS = 90_000; // 90s

interface KioskFlowProps {
  settings: KioskSettings;
  resolved: ResolvedKioskSettings;
}

/**
 * The composable kiosk flow — replaces the 4053-line TerminalDisplay.tsx monolith.
 * Each step is a separate component with a clean interface.
 * State is managed via a reducer (kioskReducer) for predictable transitions.
 */
export function KioskFlow({ settings, resolved }: KioskFlowProps) {
  const [state, dispatch] = useReducer(kioskReducer, initialKioskState);

  // Inactivity reset
  useEffect(() => {
    if (state.step === "accueil" || state.step === "confirmation") return;

    const reset = () => dispatch({ type: "RESET" });
    const timer = setTimeout(reset, INACTIVITY_TIMEOUT_MS);

    const onInteraction = () => {
      clearTimeout(timer);
    };

    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("mousemove", onInteraction);
    window.addEventListener("click", onInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("mousemove", onInteraction);
      window.removeEventListener("click", onInteraction);
    };
  }, [state.step]);

  // Navigate to confirmation page after order placed
  useEffect(() => {
    if (state.step === "confirmation" && state.orderNumber) {
      const timer = setTimeout(() => {
        dispatch({ type: "RESET" });
      }, 8_000);
      return () => clearTimeout(timer);
    }
  }, [state.step, state.orderNumber]);

  const cartTotal = state.cart.reduce((sum, i) => sum + i.total_price, 0);
  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);

  const commonProps = { state, dispatch, settings, resolved, cartTotal, cartCount };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {state.step === "accueil" && <AccueilStep {...commonProps} />}
      {state.step === "order_type" && <OrderTypeStep {...commonProps} />}
      {state.step === "menu" && <MenuStep {...commonProps} />}
      {state.step === "customization" && <CustomizationStep {...commonProps} />}
      {state.step === "cart" && <CartStep {...commonProps} />}
      {state.step === "loyalty" && <LoyaltyStep {...commonProps} />}
      {state.step === "payment" && <PaymentStep {...commonProps} />}
      {state.step === "confirmation" && <ConfirmationStep {...commonProps} />}
    </div>
  );
}
