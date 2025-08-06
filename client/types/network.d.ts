/**
 * Network Information API Type Declarations
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
 */

/**
 * Connection types for the Network Information API
 */
type ConnectionType =
  | "bluetooth"
  | "cellular"
  | "ethernet"
  | "mixed"
  | "none"
  | "other"
  | "unknown"
  | "wifi"
  | "wimax";

/**
 * Effective connection types based on network quality
 */
type EffectiveConnectionType = "slow-2g" | "2g" | "3g" | "4g";

/**
 * Network Information API interface
 * Provides information about the network connection
 */
interface NetworkInformation extends EventTarget {
  /**
   * The type of connection a device is using
   */
  readonly type?: ConnectionType;
  
  /**
   * The effective type of the connection based on recently observed RTT and downlink values
   */
  readonly effectiveType?: EffectiveConnectionType;
  
  /**
   * The estimated effective round-trip time (RTT) in milliseconds
   */
  readonly rtt?: number;
  
  /**
   * The estimated effective bandwidth in megabits per second
   */
  readonly downlink?: number;
  
  /**
   * The maximum downlink speed in megabits per second
   */
  readonly downlinkMax?: number;
  
  /**
   * Whether the user has requested a reduced data usage mode
   */
  readonly saveData?: boolean;
  
  /**
   * Event handler for connection changes
   */
  onchange?: ((this: NetworkInformation, ev: Event) => any) | null;
  
  addEventListener(
    type: "change",
    listener: (this: NetworkInformation, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  
  removeEventListener(
    type: "change",
    listener: (this: NetworkInformation, ev: Event) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

/**
 * Extends the Navigator interface with network information properties
 * These are vendor-prefixed versions for browser compatibility
 */
interface Navigator {
  /**
   * Standard Network Information API
   */
  readonly connection?: NetworkInformation;
  
  /**
   * Mozilla Firefox prefixed version
   */
  readonly mozConnection?: NetworkInformation;
  
  /**
   * WebKit/Chrome prefixed version
   */
  readonly webkitConnection?: NetworkInformation;
}

/**
 * Extends the WorkerNavigator interface for use in Web Workers
 */
interface WorkerNavigator {
  /**
   * Standard Network Information API in Worker context
   */
  readonly connection?: NetworkInformation;
}