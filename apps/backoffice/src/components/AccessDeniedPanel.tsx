import { Lock } from "lucide-react";
import { Card, CardContent } from "@kash/ui";

interface AccessDeniedPanelProps {
  title?: string;
  message?: string;
}

export function AccessDeniedPanel({
  title = "Acces refuse",
  message = "Votre profil ne dispose pas de permission pour cette section.",
}: AccessDeniedPanelProps) {
  return (
    <div className="p-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

