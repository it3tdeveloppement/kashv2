import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface PageStubProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function PageStub({ title, description, icon: Icon = Construction }: PageStubProps) {
  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#97f56d]/10 flex items-center justify-center mb-4 mx-auto">
          <Icon className="w-8 h-8 text-[#97f56d]" />
        </div>
        <h1 className="text-2xl font-bold font-otacos text-white">{title}</h1>
        {description && <p className="text-white/40 text-sm mt-2 max-w-sm">{description}</p>}
      </div>
    </div>
  );
}
