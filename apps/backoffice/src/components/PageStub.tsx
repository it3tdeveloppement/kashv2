import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface PageStubProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function PageStub({ title, description, icon: Icon = Construction }: PageStubProps) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold font-otacos text-foreground">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
      )}
      <div className="mt-4 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full">
        <Construction className="w-3.5 h-3.5" />
        En cours de développement — Phase 3
      </div>
    </div>
  );
}
