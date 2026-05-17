import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  hasSynced: boolean;
}

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  className?: string;
  showLabel?: boolean;
}

export function SyncStatusIndicator({ status, className, showLabel }: SyncStatusIndicatorProps) {
  if (status.isSyncing) {
    return (
      <div className={cn("flex items-center gap-1.5 text-blue-500", className)}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        {showLabel && <span className="text-xs">Synchronisation…</span>}
      </div>
    );
  }

  if (status.isOnline) {
    return (
      <div className={cn("flex items-center gap-1.5 text-green-600", className)}>
        <Wifi className="w-4 h-4" />
        {showLabel && <span className="text-xs">En ligne</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-orange-500", className)}>
      <WifiOff className="w-4 h-4" />
      {showLabel && <span className="text-xs">Hors ligne</span>}
    </div>
  );
}
