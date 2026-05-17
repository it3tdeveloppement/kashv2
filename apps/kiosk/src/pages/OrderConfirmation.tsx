import { useParams } from "react-router-dom";

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="fixed inset-0 bg-[#212121] flex flex-col items-center justify-center gap-8">
      <div className="w-32 h-32 rounded-full bg-[#97f56d] flex items-center justify-center text-6xl">
        ✓
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-black text-white">Merci pour votre commande !</h1>
        {orderNumber && (
          <div className="mt-6">
            <p className="text-white/60 text-lg">Numéro de commande</p>
            <p className="text-6xl font-black text-[#97f56d] mt-2">#{orderNumber}</p>
          </div>
        )}
        <p className="text-white/40 text-sm mt-6">Nous préparons votre commande.</p>
      </div>
    </div>
  );
}
