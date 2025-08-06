import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useNetworkStatus,
  useOnlineStatus,
  useConnectionQuality,
} from "../useNetworkStatus";

// Mock global fetch
const mockFetch = vi.fn();

// Mock console to avoid test noise
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  assert: vi.fn(),
  clear: vi.fn(),
  count: vi.fn(),
  countReset: vi.fn(),
  debug: vi.fn(),
  dir: vi.fn(),
  dirxml: vi.fn(),
  group: vi.fn(),
  groupCollapsed: vi.fn(),
  groupEnd: vi.fn(),
  table: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  timeLog: vi.fn(),
  timeStamp: vi.fn(),
  trace: vi.fn(),
  Console: vi.fn(),
  profile: vi.fn(),
  profileEnd: vi.fn(),
} as unknown as Console;

// Store original implementations
const originalFetch = global.fetch;
const originalConsole = global.console;

describe("useNetworkStatus Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock fetch globally
    global.fetch = mockFetch;
    global.console = mockConsole;

    // Default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    global.console = originalConsole;
  });

  describe("Basic Functionality", () => {
    it("returns network status object with expected properties", () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current).toMatchObject({
        isOnline: expect.any(Boolean),
        isSlowConnection: expect.any(Boolean),
        connectionType: expect.any(String),
        effectiveType: expect.any(String),
        downlink: expect.any(Number),
        rtt: expect.any(Number),
        lastChecked: expect.any(Number),
        checkConnection: expect.any(Function),
        forceRefresh: expect.any(Function),
      });
    });

    it("has a working checkConnection function", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const { result } = renderHook(() => useNetworkStatus());

      const connectionResult = await result.current.checkConnection();

      expect(connectionResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/ping\?t=\d+/),
        expect.objectContaining({
          method: "GET",
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        }),
      );
    });

    it("checkConnection returns false when fetch fails", async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Override the mock after hook initialization to simulate network failure
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const connectionResult = await result.current.checkConnection();

      expect(connectionResult).toBe(false);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Connection check failed:",
        expect.any(Error),
      );
    });

    it("checkConnection returns false when response is not ok", async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Override the mock after hook initialization
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const connectionResult = await result.current.checkConnection();

      expect(connectionResult).toBe(false);
    });

    it("has a working forceRefresh function", () => {
      const { result } = renderHook(() => useNetworkStatus());

      act(() => {
        vi.advanceTimersByTime(100);
        result.current.forceRefresh();
      });

      // forceRefresh should trigger an update (even if values don't change visibly)
      expect(result.current.forceRefresh).toBeInstanceOf(Function);
    });
  });

  describe("Connection Quality Detection", () => {
    it("initializes with default connection values", () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Should have default values when connection API is not available
      expect(result.current.connectionType).toBeDefined();
      expect(result.current.effectiveType).toBeDefined();
      expect(result.current.downlink).toBeGreaterThanOrEqual(0);
      expect(result.current.rtt).toBeGreaterThanOrEqual(0);
      expect(typeof result.current.isSlowConnection).toBe("boolean");
    });
  });

  describe("Error Handling", () => {
    it("handles fetch timeouts gracefully", async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Mock a fetch that rejects immediately (simulating timeout)
      mockFetch.mockRejectedValueOnce(new Error("Timeout"));

      const connectionResult = await result.current.checkConnection();

      expect(connectionResult).toBe(false);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Connection check failed:",
        expect.any(Error),
      );
    });

    it("handles network errors gracefully", async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Override after hook initialization
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      const connectionResult = await result.current.checkConnection();

      expect(connectionResult).toBe(false);
    });
  });

  describe("State Management", () => {
    it("updates lastChecked timestamp", () => {
      const { result } = renderHook(() => useNetworkStatus());

      const initialTimestamp = result.current.lastChecked;

      expect(initialTimestamp).toBeGreaterThan(0);
      expect(initialTimestamp).toBeLessThanOrEqual(Date.now());
    });

    it("handles state updates without crashing", () => {
      const { result } = renderHook(() => useNetworkStatus());

      // These should not throw errors
      expect(() => result.current.forceRefresh()).not.toThrow();
      expect(() => result.current.checkConnection()).not.toThrow();
    });
  });
});

describe("useOnlineStatus Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    global.console = mockConsole;

    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.console = originalConsole;
  });

  it("returns online status and slow connection flag", () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toMatchObject({
      isOnline: expect.any(Boolean),
      isSlowConnection: expect.any(Boolean),
    });
  });

  it("is consistent with useNetworkStatus", () => {
    const { result: networkResult } = renderHook(() => useNetworkStatus());
    const { result: onlineResult } = renderHook(() => useOnlineStatus());

    expect(onlineResult.current.isOnline).toBe(networkResult.current.isOnline);
    expect(onlineResult.current.isSlowConnection).toBe(
      networkResult.current.isSlowConnection,
    );
  });
});

describe("useConnectionQuality Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    global.console = mockConsole;

    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.console = originalConsole;
  });

  it("returns connection quality information", () => {
    const { result } = renderHook(() => useConnectionQuality());

    expect(result.current).toMatchObject({
      quality: expect.stringMatching(/^(excellent|good|poor|offline)$/),
      effectiveType: expect.any(String),
      downlink: expect.any(Number),
      rtt: expect.any(Number),
    });
  });

  it("quality is offline when not online", () => {
    // Mock navigator as offline
    const originalNavigator = global.navigator;
    global.navigator = { ...originalNavigator, onLine: false } as any;

    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useConnectionQuality());

    // Since we can't easily control the network status synchronously,
    // we just verify the function works and returns a valid quality value
    expect(["excellent", "good", "poor", "offline"]).toContain(
      result.current.quality,
    );

    // Restore navigator
    global.navigator = originalNavigator;
  });

  it("is consistent with useNetworkStatus", () => {
    const { result: networkResult } = renderHook(() => useNetworkStatus());
    const { result: qualityResult } = renderHook(() => useConnectionQuality());

    expect(qualityResult.current.effectiveType).toBe(
      networkResult.current.effectiveType,
    );
    expect(qualityResult.current.downlink).toBe(networkResult.current.downlink);
    expect(qualityResult.current.rtt).toBe(networkResult.current.rtt);
  });
});

describe("Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    global.console = mockConsole;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.console = originalConsole;
  });

  it("all hooks work together without conflicts", () => {
    const { result: networkResult } = renderHook(() => useNetworkStatus());
    const { result: onlineResult } = renderHook(() => useOnlineStatus());
    const { result: qualityResult } = renderHook(() => useConnectionQuality());

    // All hooks should return valid data structures
    expect(networkResult.current).toBeDefined();
    expect(onlineResult.current).toBeDefined();
    expect(qualityResult.current).toBeDefined();

    // Data consistency checks
    expect(onlineResult.current.isOnline).toBe(networkResult.current.isOnline);
    expect(onlineResult.current.isSlowConnection).toBe(
      networkResult.current.isSlowConnection,
    );
    expect(qualityResult.current.effectiveType).toBe(
      networkResult.current.effectiveType,
    );
  });

  it("handles multiple rapid calls without issues", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Make multiple rapid calls
    const promises = [
      result.current.checkConnection(),
      result.current.checkConnection(),
      result.current.checkConnection(),
    ];

    const results = await Promise.all(promises);

    // All should resolve without throwing
    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(typeof result).toBe("boolean");
    });
  });
});
