import { Link } from "react-router-dom";
import { Button } from "@kash/ui";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-8xl font-black text-primary font-otacos">404</p>
        <h1 className="text-2xl font-bold text-foreground mt-4">Page introuvable</h1>
        <p className="text-muted-foreground mt-2">Cette page n'existe pas.</p>
        <Button asChild className="mt-6 gap-2">
          <Link to="/"><Home className="w-4 h-4" /> Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
