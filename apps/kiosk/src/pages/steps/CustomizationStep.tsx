import { useState, useMemo } from "react";
import type { StepProps } from "../../types/kiosk";
import type { CartItem, CartItemOption, CustomizationPhase, CustomizationOption } from "@kash/types";
import { safeUUID } from "@kash/ui";

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: "Dhs",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

type SelectionMap = Map<string, string[]>; // phase_id → selected option_ids

export function CustomizationStep({ state, settings, resolved, dispatch }: StepProps) {
  const product = state.pendingProduct;
  const [selections, setSelections] = useState<SelectionMap>(new Map());

  const currency = CURRENCY_SYMBOLS[resolved.defaultCurrency] ?? resolved.defaultCurrency;

  const orderTypeCode = state.selectedOrderType?.code ?? null;

  // Phases linked to this product, sorted by display_order
  const linkedPhaseIds = useMemo(() => {
    if (!product) return [];
    return settings.productCustomizationPhases
      .filter((pcp) => pcp.product_id === product.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((pcp) => pcp.phase_id);
  }, [product, settings.productCustomizationPhases]);

  // Collect all option-triggered sub_phase_ids and disable_phase_ids
  const allSelectedOptionObjs = useMemo(() => {
    const result: CustomizationOption[] = [];
    selections.forEach((optionIds) => {
      optionIds.forEach((oid) => {
        const opt = settings.customizationOptions.find((o) => o.id === oid);
        if (opt) result.push(opt);
      });
    });
    return result;
  }, [selections, settings.customizationOptions]);

  const subPhaseIds = useMemo(
    () => new Set(allSelectedOptionObjs.flatMap((o) => o.sub_phase_ids)),
    [allSelectedOptionObjs]
  );
  const disabledPhaseIds = useMemo(
    () => new Set(allSelectedOptionObjs.flatMap((o) => o.disable_phase_ids)),
    [allSelectedOptionObjs]
  );
  const disabledOptionIds = useMemo(
    () => new Set(allSelectedOptionObjs.flatMap((o) => o.disable_option_ids)),
    [allSelectedOptionObjs]
  );

  // Visible phases: linked + sub-phases, minus disabled
  const visiblePhases = useMemo(() => {
    const phaseMap = new Map(settings.customizationPhases.map((p) => [p.id, p]));
    const ids = [...linkedPhaseIds, ...Array.from(subPhaseIds)].filter(
      (id) => !disabledPhaseIds.has(id)
    );
    return ids
      .map((id) => phaseMap.get(id))
      .filter((p): p is CustomizationPhase => !!p && p.is_active && p.enabled_terminal);
  }, [linkedPhaseIds, subPhaseIds, disabledPhaseIds, settings.customizationPhases]);

  function getOptionsForPhase(phaseId: string): CustomizationOption[] {
    return settings.customizationOptions.filter(
      (o) =>
        o.phase_id === phaseId &&
        o.is_available &&
        !disabledOptionIds.has(o.id) &&
        (orderTypeCode === null ||
          o.available_order_type_codes.length === 0 ||
          o.available_order_type_codes.includes(orderTypeCode))
    );
  }

  function toggleOption(phase: CustomizationPhase, optionId: string) {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(phase.id) ?? [];

      if (phase.selection_type === "single") {
        next.set(phase.id, current.includes(optionId) ? [] : [optionId]);
      } else {
        if (current.includes(optionId)) {
          next.set(phase.id, current.filter((id) => id !== optionId));
        } else {
          const max = phase.max_selections;
          if (max !== null && current.length >= max) return prev;
          next.set(phase.id, [...current, optionId]);
        }
      }
      return next;
    });
  }

  // Validation: all required phases must meet min_selections
  const isValid = useMemo(() => {
    return visiblePhases
      .filter((p) => p.is_required)
      .every((p) => {
        const selected = selections.get(p.id) ?? [];
        return selected.length >= p.min_selections;
      });
  }, [visiblePhases, selections]);

  function handleConfirm() {
    if (!product || !isValid) return;

    const cartOptions: CartItemOption[] = [];
    selections.forEach((optionIds, phaseId) => {
      optionIds.forEach((optionId) => {
        const opt = settings.customizationOptions.find((o) => o.id === optionId);
        if (opt) {
          cartOptions.push({
            phase_id: phaseId,
            option_id: opt.id,
            option_name: opt.name,
            price_adjustment: opt.price_adjustment,
          });
        }
      });
    });

    const optionsTotal = cartOptions.reduce((sum, o) => sum + o.price_adjustment, 0);
    const unitPrice = product.price + optionsTotal;

    const item: CartItem = {
      id: safeUUID(),
      product,
      quantity: 1,
      unit_price: unitPrice,
      total_price: unitPrice,
      selected_options: cartOptions,
      notes: null,
      order_type_code: orderTypeCode,
    };

    dispatch({ type: "ADD_TO_CART", item });
    dispatch({ type: "SET_PENDING_PRODUCT", product: null });
    dispatch({ type: "SET_STEP", step: "menu" });
  }

  if (!product) return null;

  const basePrice = product.price;
  const optionsAdjustment = Array.from(selections.values())
    .flat()
    .reduce((sum, oid) => {
      const opt = settings.customizationOptions.find((o) => o.id === oid);
      return sum + (opt?.price_adjustment ?? 0);
    }, 0);
  const totalPrice = basePrice + optionsAdjustment;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10">
        <button
          onClick={() => dispatch({ type: "SET_PENDING_PRODUCT", product: null })}
          className="text-white/60 hover:text-white text-2xl leading-none"
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-xl">{product.name}</h2>
          <p className="font-semibold" style={{ color: resolved.primaryColor }}>
            {totalPrice.toFixed(2)} {currency}
          </p>
        </div>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-contain bg-white/5"
          />
        )}
      </div>

      {/* Phases */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {visiblePhases.map((phase) => {
          const options = getOptionsForPhase(phase.id);
          const selected = selections.get(phase.id) ?? [];

          return (
            <div key={phase.id}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-white font-bold text-lg">
                  {phase.display_title ?? phase.name}
                  {phase.is_required && (
                    <span className="ml-2 text-xs font-normal text-white/40">Requis</span>
                  )}
                </h3>
                {phase.max_selections !== null && (
                  <span className="text-white/40 text-sm">
                    {selected.length}/{phase.max_selections}
                  </span>
                )}
              </div>

              <div
                className={phase.use_large_buttons ? "grid grid-cols-2 gap-3" : "flex flex-wrap gap-3"}
              >
                {options.map((option) => {
                  const isSelected = selected.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(phase, option.id)}
                      className={[
                        "rounded-xl border-2 transition-all active:scale-95",
                        phase.use_large_buttons
                          ? "flex flex-col items-center gap-2 p-4"
                          : "flex items-center gap-2 px-4 py-3",
                        isSelected ? "border-transparent" : "border-white/20 bg-white/5",
                      ].join(" ")}
                      style={isSelected ? { backgroundColor: resolved.primaryColor, borderColor: resolved.primaryColor } : {}}
                    >
                      {option.image_url && phase.use_large_buttons && (
                        <img
                          src={option.image_url}
                          alt={option.name}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      <span
                        className={[
                          "font-semibold text-sm",
                          isSelected ? "text-black" : "text-white",
                        ].join(" ")}
                      >
                        {option.name}
                      </span>
                      {option.price_adjustment !== 0 && (
                        <span
                          className={[
                            "text-xs",
                            isSelected ? "text-black/70" : "text-white/50",
                          ].join(" ")}
                        >
                          {option.price_adjustment > 0 ? "+" : ""}
                          {option.price_adjustment.toFixed(2)} {currency}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="shrink-0 px-6 pb-8 pt-4">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full py-5 rounded-2xl font-bold text-xl text-black disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: resolved.primaryColor }}
        >
          Ajouter au panier — {totalPrice.toFixed(2)} {currency}
        </button>
      </div>
    </div>
  );
}
