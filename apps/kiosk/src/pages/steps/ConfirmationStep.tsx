import { useEffect, useState } from "react";
import type { StepProps } from "../../types/kiosk";

export function ConfirmationStep({ state, resolved }: StepProps) {
  const [countdown, setCountdown] = useState(8);

  // KioskFlow.tsx handles the RESET dispatch after 8s.
  // This counter is purely visual feedback for the customer.
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {/* Checkmark */}
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center text-6xl"
        style={{ backgroundColor: resolved.primaryColor }}
      >
        ✓
      </div>

      {/* Message */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-white">Merci pour votre commande !</h1>
        {state.orderNumber && (
          <div className="mt-6">
            <p className="text-white/60 text-lg">Numéro de commande</p>
            <p
              className="text-6xl font-black mt-2"
              style={{ color: resolved.primaryColor }}
            >
              #{state.orderNumber}
            </p>
          </div>
        )}
        <p className="text-white/40 text-sm mt-6">Nous préparons votre commande.</p>
      </div>

      {/* Logo */}
      {resolved.logoUrl && (
        <img
          src={resolved.logoUrl}
          alt={resolved.tenantName}
          className="h-16 object-contain opacity-60"
        />
      )}

      {/* Countdown */}
      <p className="text-white/20 text-xs absolute bottom-8">
        Retour à l'accueil dans {countdown}s
      </p>
    </div>
  );
}
