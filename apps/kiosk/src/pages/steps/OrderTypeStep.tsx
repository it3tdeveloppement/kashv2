import type { StepProps } from "../../types/kiosk";
import type { OrderType } from "@kash/types";

export function OrderTypeStep({ settings, resolved, dispatch }: StepProps) {
  const orderTypes = settings.orderTypes.filter(
    (ot) => ot.enabled_terminal && ot.is_active && !ot.is_offert
  );

  function handleSelect(ot: OrderType) {
    dispatch({ type: "SELECT_ORDER_TYPE", orderType: ot });
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {resolved.logoUrl && (
        <div className="flex justify-center pt-12 pb-6">
          <img src={resolved.logoUrl} alt={resolved.tenantName} className="h-20 object-contain" />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <h1 className="text-3xl font-bold text-white text-center">
          Comment souhaitez-vous commander ?
        </h1>

        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mt-6">
          {orderTypes.map((ot) => (
            <button
              key={ot.id}
              onClick={() => handleSelect(ot)}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl p-10 border-2 border-white/10 bg-white/5 active:scale-95 transition-transform"
              style={{ borderColor: ot.color ?? undefined }}
            >
              {ot.icon && <span className="text-5xl">{ot.icon}</span>}
              <span className="text-2xl font-bold text-white">{ot.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
