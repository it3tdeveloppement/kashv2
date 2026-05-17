import * as React from "react";
import { cn } from "../../lib/utils";

interface KioskLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Background image URL — uses longhand CSS to avoid shorthand reset bug */
  backgroundImageUrl?: string;
  /** Hex or CSS color for background */
  backgroundColor?: string;
  primaryColor?: string;
}

/**
 * Full-screen wrapper for kiosk terminals.
 * Uses CSS longhand for backgroundImage (never shorthand — shorthand resets sub-properties).
 */
export function KioskLayout({
  children,
  className,
  backgroundImageUrl,
  backgroundColor,
  primaryColor,
}: KioskLayoutProps) {
  const style: React.CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
    ...(primaryColor && { "--kiosk-primary": primaryColor } as React.CSSProperties),
    ...(backgroundImageUrl && {
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
    }),
  };

  return (
    <div
      className={cn("fixed inset-0 flex flex-col overflow-hidden select-none", className)}
      style={style}
    >
      {children}
    </div>
  );
}

interface KioskHeaderProps {
  logo?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function KioskHeader({ logo, title, children, className }: KioskHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between px-6 py-4 z-10", className)}>
      <div className="flex items-center gap-3">
        {logo}
        {title && <span className="text-xl font-bold font-otacos">{title}</span>}
      </div>
      {children}
    </header>
  );
}

export function KioskBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)}>{children}</main>
  );
}

export function KioskFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <footer className={cn("px-6 py-4 z-10", className)}>{children}</footer>
  );
}
