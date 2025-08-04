import { createContext, useContext, ReactNode } from "react";
import { useNetworkStatus, NetworkStatus } from "../hooks/useNetworkStatus";

interface NetworkContextValue extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  forceRefresh: () => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkContext.Provider value={networkStatus}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkContext(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkContext must be used within a NetworkProvider");
  }
  return context;
}

// Convenience hooks that use the context
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkContext();
  return isOnline;
}

export function useIsOffline(): boolean {
  const { isOnline } = useNetworkContext();
  return !isOnline;
}

export function useConnectionInfo(): {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string;
  quality: "excellent" | "good" | "poor" | "offline";
} {
  const { isOnline, isSlowConnection, effectiveType, downlink } = useNetworkContext();

  const quality: "excellent" | "good" | "poor" | "offline" = (() => {
    if (!isOnline) {return "offline";}
    
    if (effectiveType === "4g" && downlink > 1.5) {return "excellent";}
    if (effectiveType === "4g" || (effectiveType === "3g" && downlink > 0.7)) {return "good";}
    
    return "poor";
  })();

  return {
    isOnline,
    isSlowConnection,
    effectiveType,
    quality,
  };
}