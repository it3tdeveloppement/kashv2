import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { usePOSAuth } from "../contexts/POSAuthContext";

const TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID ?? "";

export function POSLoginPage() {
  const { login } = usePOSAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length < 6) setPin((p) => p + d);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    setIsLoading(true);
    try {
      await login(pin, TENANT_ID);
      navigate("/pos/cashier");
    } catch {
      toast.error("PIN incorrect. Réessayez.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#97f56d] flex items-center justify-center mb-4">
            <span className="text-3xl font-black text-black font-otacos">K</span>
          </div>
          <h1 className="text-xl font-bold text-white font-otacos">Kash POS</h1>
          <p className="text-white/40 text-sm mt-1">Entrez votre PIN</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-150 ${
                i < pin.length ? "bg-[#97f56d] scale-110" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((d) => {
            const isClear = d === "C";
            const isDelete = d === "⌫";
            const isAction = isClear || isDelete;

            return (
              <button
                key={d}
                onClick={() => {
                  if (isClear) setPin("");
                  else if (isDelete) handleDelete();
                  else handleDigit(d);
                }}
                className={`
                  h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95
                  ${isAction
                    ? "bg-white/10 text-white/60 hover:bg-white/15"
                    : "bg-white/10 text-white hover:bg-white/15 active:bg-[#97f56d] active:text-black"
                  }
                `}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={pin.length < 4 || isLoading}
          className="w-full mt-4 h-14 rounded-2xl bg-[#97f56d] text-black font-bold text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Connexion"
          )}
        </button>
      </div>
    </div>
  );
}
