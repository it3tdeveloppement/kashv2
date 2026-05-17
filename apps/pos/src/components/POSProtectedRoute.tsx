import { Navigate, Outlet } from "react-router-dom";
import { usePOSAuth } from "../contexts/POSAuthContext";

export function POSProtectedRoute() {
  const { isAuthenticated, isLoading } = usePOSAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#97f56d] border-t-transparent animate-spin" />
          <p className="text-white/60 text-sm">Initialisation…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/pos/login" replace />;
  }

  return <Outlet />;
}
