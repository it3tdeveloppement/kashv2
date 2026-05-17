import { useState } from "react";
import type { StepProps } from "../../types/kiosk";

type LoyaltyTab = "phone" | "qr" | "skip";

export function LoyaltyStep({ resolved, dispatch }: StepProps) {
  const [tab, setTab] = useState<LoyaltyTab>("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handlePhoneLookup() {
    if (phone.length < 8) return;
    setLoading(true);
    setNotFound(false);
    try {
      // TODO: callPosCustomer({ phone }) — for now skip to payment if not found
      // const result = await callPosCustomer({ phone, tenantId: settings.tenantId });
      // if (result) { dispatch({ type: "IDENTIFY_CUSTOMER", customer: result.customer, account: result.loyalty_account }); return; }
      setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function skip() {
    dispatch({ type: "SET_STEP", step: "payment" });
  }

  const tabClass = (t: LoyaltyTab) =>
    [
      "flex-1 py-3 text-sm font-semibold rounded-xl transition-colors",
      tab === t ? "text-black" : "text-white/60",
    ].join(" ");

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10">
        <button
          onClick={() => dispatch({ type: "SET_STEP", step: "cart" })}
          className="text-white/60 hover:text-white text-2xl leading-none"
        >
          ←
        </button>
        <h2 className="text-white font-bold text-xl">Programme fidélité</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        <p className="text-white/60 text-center text-lg">
          Avez-vous un compte fidélité ?
        </p>

        {/* Tabs */}
        <div
          className="flex gap-1 w-full max-w-sm p-1 rounded-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          {(["phone", "qr", "skip"] as LoyaltyTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tabClass(t)}
              style={tab === t ? { backgroundColor: resolved.primaryColor } : {}}
            >
              {t === "phone" ? "Téléphone" : t === "qr" ? "QR Code" : "Ignorer"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="w-full max-w-sm">
          {tab === "phone" && (
            <div className="flex flex-col gap-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setNotFound(false);
                }}
                placeholder="06 XX XX XX XX"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 text-white text-xl text-center font-semibold placeholder:text-white/30 outline-none border-2 border-transparent focus:border-white/20"
              />
              {notFound && (
                <p className="text-white/40 text-sm text-center">
                  Aucun compte trouvé pour ce numéro.
                </p>
              )}
              <button
                onClick={handlePhoneLookup}
                disabled={phone.length < 8 || loading}
                className="w-full py-4 rounded-2xl font-bold text-lg text-black disabled:opacity-40"
                style={{ backgroundColor: resolved.primaryColor }}
              >
                {loading ? "Recherche…" : "Rechercher"}
              </button>
            </div>
          )}

          {tab === "qr" && (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-5xl">
                📱
              </div>
              <p className="text-center text-sm">
                Présentez votre QR code fidélité devant le lecteur.
              </p>
            </div>
          )}

          {tab === "skip" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-white/60 text-center text-sm">
                Continuez sans compte fidélité.
              </p>
              <button
                onClick={skip}
                className="w-full py-4 rounded-2xl font-bold text-lg text-black"
                style={{ backgroundColor: resolved.primaryColor }}
              >
                Passer
              </button>
            </div>
          )}
        </div>

        <button onClick={skip} className="text-white/30 text-sm underline underline-offset-2">
          Continuer sans fidélité
        </button>
      </div>
    </div>
  );
}
