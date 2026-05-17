import { BrowserRouter, Routes, Route } from "react-router-dom";
import { KDSAuthProvider, useKDSAuth } from "./contexts/KDSAuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { KDSDisplay } from "./pages/KDSDisplay";
import { KDSNoAuth } from "./pages/KDSNoAuth";

function KDSRoot() {
  const { session, isLoading, error } = useKDSAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#111111] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#97f56d] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session || error) {
    return <KDSNoAuth error={error} />;
  }

  return (
    <SyncProvider>
      <KDSDisplay />
    </SyncProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/kitchen/:tenantId/:token/display"
          element={
            <KDSAuthProvider>
              <KDSRoot />
            </KDSAuthProvider>
          }
        />
        <Route
          path="*"
          element={
            <div className="fixed inset-0 bg-[#111111] flex items-center justify-center text-white/30 text-sm">
              Accédez via /kitchen/:tenantId/:token/display
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
