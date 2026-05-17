import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { callClickCollectOrder } from "@kash/supabase";
import { useCart } from "../contexts/CartContext";
import { useShop } from "../contexts/ShopContext";

const schema = z.object({
  name: z.string().min(2, "Prénom requis"),
  phone: z.string().min(8, "Numéro invalide"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const { data, buttonColor, buttonTextColor, currency, primaryColor } = useShop();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(form: FormData) {
    if (!data || items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await callClickCollectOrder({
        tenant_id: data.tenant.id,
        establishment_id: data.establishment?.id ?? data.tenant.id,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
          selected_options: i.selected_options,
        })),
        total_amount: total,
        order_type: "click_collect",
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email || null,
        pickup_time: null,
        notes: form.notes || null,
      });

      clear();

      if (result.payment_required && result.berexia_payment_url) {
        window.location.href = result.berexia_payment_url;
      } else {
        navigate(`../order-track/${result.order_token}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    navigate("..", { replace: true });
    return null;
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-gray-400 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-xl">←</button>
          <h1 className="font-bold text-lg">Finaliser la commande</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Récapitulatif</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}× {item.product.name}
                </span>
                <span className="font-medium">{item.total_price.toFixed(2)} {currency}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base mt-4 pt-4 border-t">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{total.toFixed(2)} {currency}</span>
          </div>
        </div>

        {/* Customer form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Vos informations</h2>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Prénom *</label>
              <input {...register("name")} placeholder="Mohammed" className={inputClass} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Téléphone *</label>
              <input {...register("phone")} type="tel" placeholder="06 XX XX XX XX" className={inputClass} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Email (optionnel)</label>
              <input {...register("email")} type="email" placeholder="email@exemple.com" className={inputClass} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Instructions spéciales</label>
              <textarea
                {...register("notes")}
                placeholder="Allergies, préférences…"
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-bold text-base disabled:opacity-50"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            {submitting ? "Envoi en cours…" : "Confirmer la commande"}
          </button>
        </form>
      </div>
    </div>
  );
}
