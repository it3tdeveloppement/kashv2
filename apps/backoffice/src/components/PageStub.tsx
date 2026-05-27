import type { LucideIcon } from "lucide-react";
import { ArrowRight, Construction } from "lucide-react";
import { Button } from "@kash/ui";

interface PageStubProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function PageStub({ title, description, icon: Icon = Construction }: PageStubProps) {
  return (
    <div className="flex min-h-[62vh] items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card/85 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Construction className="h-3.5 w-3.5" />
          En cours de construction - Phase suivante
        </div>

        <div className="mt-5">
          <Button variant="outline" className="rounded-lg">
            Voir la roadmap
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
