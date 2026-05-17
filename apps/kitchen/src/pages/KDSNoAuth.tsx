interface KDSNoAuthProps {
  error?: string | null;
}

export function KDSNoAuth({ error }: KDSNoAuthProps) {
  return (
    <div className="fixed inset-0 bg-[#111111] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl">
        🔒
      </div>
      <div className="text-center">
        <h1 className="text-white font-bold text-xl">Accès refusé</h1>
        <p className="text-white/40 text-sm mt-2 max-w-xs">
          {error ?? "Token d'authentification invalide ou expiré."}
        </p>
        <p className="text-white/20 text-xs mt-4">
          Accédez via /kitchen/:tenantId/:token/display
        </p>
      </div>
    </div>
  );
}
