import { useState, useEffect, useCallback } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  lastChecked: number;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  forceRefresh: () => void;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: "unknown",
    effectiveType: "unknown",
    downlink: 0,
    rtt: 0,
    lastChecked: Date.now(),
  });

  // Get connection info if available (Chrome/Edge)
  const getConnectionInfo = useCallback((): Partial<NetworkStatus> => {
    // @ts-expect-error - NetworkInformation is not in TypeScript types yet
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        connectionType: connection.type || "unknown",
        effectiveType: connection.effectiveType || "unknown",
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        isSlowConnection: connection.effectiveType === "slow-2g" || connection.effectiveType === "2g",
      };
    }

    return {
      connectionType: "unknown",
      effectiveType: "unknown",
      downlink: 0,
      rtt: 0,
      isSlowConnection: false,
    };
  }, []);

  // Test actual connectivity by making a request
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Use a small API endpoint with cache-busting
      const response = await fetch(`/api/ping?t=${Date.now()}`, {
        method: "GET",
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      
      return response.ok;
    } catch (error) {
      console.warn("Connection check failed:", error);
      return false;
    }
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(async () => {
    const connectionInfo = getConnectionInfo();
    const actuallyOnline = navigator.onLine ? await checkConnection() : false;

    setNetworkStatus(prev => ({
      ...prev,
      ...connectionInfo,
      isOnline: actuallyOnline,
      lastChecked: Date.now(),
    }));
  }, [getConnectionInfo, checkConnection]);

  // Force refresh network status
  const forceRefresh = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // Set up event listeners
  useEffect(() => {
    // Initial check
    updateNetworkStatus();

    // Standard online/offline events
    const handleOnline = () => {
      console.log("🌐 Network: Online event detected");
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log("📴 Network: Offline event detected");
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        lastChecked: Date.now(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Connection change events (Chrome/Edge)
    // @ts-expect-error - NetworkInformation is not in TypeScript types yet
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const handleConnectionChange = () => {
        console.log("🔄 Network: Connection change detected");
        setTimeout(updateNetworkStatus, 100); // Small delay to let connection stabilize
      };

      connection.addEventListener("change", handleConnectionChange);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        connection.removeEventListener("change", handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateNetworkStatus]);

  // Periodic connectivity check (every 30 seconds when online)
  useEffect(() => {
    if (!networkStatus.isOnline) {return;}

    const interval = setInterval(async () => {
      const isStillOnline = await checkConnection();
      if (!isStillOnline) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: false,
          lastChecked: Date.now(),
        }));
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [networkStatus.isOnline, checkConnection]);

  // Retry connection check when offline (every 10 seconds)
  useEffect(() => {
    if (networkStatus.isOnline) {return;}

    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const isBackOnline = await checkConnection();
        if (isBackOnline) {
          console.log("🌐 Network: Connection restored");
          updateNetworkStatus();
        }
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [networkStatus.isOnline, checkConnection, updateNetworkStatus]);

  return {
    ...networkStatus,
    checkConnection,
    forceRefresh,
  };
}

// Hook for simple online/offline status
export function useOnlineStatus(): { isOnline: boolean; isSlowConnection: boolean } {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  return { isOnline, isSlowConnection };
}

// Hook for connection quality
export function useConnectionQuality(): {
  quality: "excellent" | "good" | "poor" | "offline";
  effectiveType: string;
  downlink: number;
  rtt: number;
} {
  const { isOnline, effectiveType, downlink, rtt } = useNetworkStatus();

  const quality = (() => {
    if (!isOnline) {return "offline";}
    
    if (effectiveType === "4g" && downlink > 1.5) {return "excellent";}
    if (effectiveType === "4g" || (effectiveType === "3g" && downlink > 0.7)) {return "good";}
    
    return "poor";
  })();

  return {
    quality,
    effectiveType,
    downlink,
    rtt,
  };
}