import React from "react";
import { AlertCircle, Wifi, WifiOff, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectionInfo } from "../../contexts/NetworkContext";
import { useSync } from "../../hooks/useSync";

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className, showDetails = false }: OfflineIndicatorProps) {
  const { isOnline, isSlowConnection, effectiveType, quality } = useConnectionInfo();
  const { syncStatus } = useSync();

  // Don't show anything if fully online and no sync issues
  if (isOnline && !isSlowConnection && syncStatus.pendingCount === 0 && syncStatus.failedCount === 0) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: "Offline",
        description: "Working in offline mode",
        variant: "offline" as const,
      };
    }

    if (syncStatus.isProcessing) {
      return {
        icon: Loader2,
        text: "Syncing",
        description: `Syncing ${syncStatus.pendingCount} items`,
        variant: "syncing" as const,
      };
    }

    if (syncStatus.failedCount > 0) {
      return {
        icon: AlertTriangle,
        text: "Sync Issues",
        description: `${syncStatus.failedCount} items failed to sync`,
        variant: "error" as const,
      };
    }

    if (syncStatus.pendingCount > 0) {
      return {
        icon: AlertCircle,
        text: "Pending Sync",
        description: `${syncStatus.pendingCount} items queued`,
        variant: "pending" as const,
      };
    }

    if (isSlowConnection) {
      return {
        icon: Wifi,
        text: "Slow Connection",
        description: `${effectiveType.toUpperCase()} - ${quality} connection`,
        variant: "slow" as const,
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const { icon: Icon, text, description, variant } = statusInfo;

  const baseClasses = "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors";
  
  const variantClasses = {
    offline: "bg-gray-100 text-gray-800 border-gray-200",
    syncing: "bg-blue-50 text-blue-800 border-blue-200",
    error: "bg-red-50 text-red-800 border-red-200",
    pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
    slow: "bg-orange-50 text-orange-800 border-orange-200",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], "border", className)}>
      <Icon 
        className={cn(
          "h-4 w-4",
          variant === "syncing" && "animate-spin"
        )} 
      />
      <span className="font-medium">{text}</span>
      {showDetails && (
        <span className="text-xs opacity-75 ml-1">
          {description}
        </span>
      )}
    </div>
  );
}