import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Fingerprint, Loader2 } from "lucide-react";
import { usePOSAuth } from "../contexts/POSAuthContext";

const TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID ?? "";

export function POSLoginPage() {
  const { login } = usePOSAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) setPin((value) => value + digit);
  };

  const handleDelete = () => setPin((value) => value.slice(0, -1));

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    setIsLoading(true);
    try {
      await login(pin, TENANT_ID);
      navigate("/pos/cashier");
    } catch {
      toast.error("PIN incorrect. Reessayez.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "Del"];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#131a16] px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(620px_280px_at_100%_0%,rgba(151,245,109,0.20),transparent_60%),radial-gradient(500px_260px_at_0%_100%,rgba(73,139,102,0.22),transparent_58%)]" />

      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1b2520]/90 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="mb-7 flex flex-col items-center">
          <img src="/logo-kash.svg" alt="Kash" className="mb-3 h-11 w-auto object-contain" />
          <h1 className="text-xl font-semibold text-white">Kash POS</h1>
          <p className="mt-1 text-sm text-white/60">Entrez votre PIN caisse</p>
        </div>

        <div className="mb-6 flex justify-center gap-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-full transition-all duration-150 ${
                index < pin.length ? "scale-110 bg-[#97f56d]" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {digits.map((digit) => {
            const isClear = digit === "C";
            const isDelete = digit === "Del";
            const isAction = isClear || isDelete;

            return (
              <button
                key={digit}
                type="button"
                onClick={() => {
                  if (isClear) setPin("");
                  else if (isDelete) handleDelete();
                  else handleDigit(digit);
                }}
                className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-[0.98] ${
                  isAction
                    ? "bg-white/8 text-white/65 hover:bg-white/14"
                    : "bg-white/12 text-white hover:bg-white/18 active:bg-[#97f56d] active:text-black"
                }`}
              >
                {digit}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pin.length < 4 || isLoading}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#97f56d] text-sm font-bold text-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4" />
              Ouvrir la caisse
            </>
          )}
        </button>
      </div>
    </div>
  );
}
