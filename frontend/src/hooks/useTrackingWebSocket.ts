/**
 * useTrackingWebSocket.ts
 *
 * Real-time STOMP/SockJS hook for FleetVane live tracking.
 *
 * Subscribes to two backend topics:
 *   /topic/fleet.vehicles            — live VehicleLocationEvent frames (manager map)
 *   /topic/shipment.{id}.tracking   — per-shipment milestone events (client/driver)
 *
 * On each telemetry frame the hook patches the Zustand vehicle slice in-place,
 * so Leaflet marker positions update without any page reload.
 *
 * Dependencies already in package.json:
 *   "@stomp/stompjs": "^7.3.0"
 *   "sockjs-client":  "^1.6.1"
 */

import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ── Shape of an incoming telemetry frame from TrackingService ──────────────
export interface VehicleLocationEvent {
  vehicleId: number;
  plateNumber: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  activeShipmentId: number | null;
}

export type MilestoneMessage = string;

interface UseTrackingWebSocketOptions {
  /** JWT bearer token — passed as STOMP connect header for authentication. */
  token: string | null;

  /**
   * Called on every vehicle location frame from /topic/fleet.vehicles.
   * Merge this into the Zustand vehicle store inside the callback.
   */
  onVehicleUpdate?: (event: VehicleLocationEvent) => void;

  /**
   * Specific shipment ID to subscribe to.
   * When provided, also subscribes to /topic/shipment.{shipmentId}.tracking.
   */
  shipmentId?: string | number | null;

  /** Called with the raw milestone string (e.g. "✅ Shipment #42 ARRIVED"). */
  onMilestone?: (message: MilestoneMessage) => void;

  /**
   * WebSocket endpoint exposed by Spring Boot's WebSocket config.
   * Defaults to the local dev backend — override via NEXT_PUBLIC_WS_URL env var.
   */
  wsUrl?: string;
}

const DEFAULT_WS_URL =
  (typeof process !== 'undefined' && (process.env as any).NEXT_PUBLIC_WS_URL) ||
  'http://localhost:8080/ws-fleetvane';

export function useTrackingWebSocket({
  token,
  onVehicleUpdate,
  shipmentId,
  onMilestone,
  wsUrl = DEFAULT_WS_URL,
}: UseTrackingWebSocketOptions): void {
  const clientRef = useRef<Client | null>(null);
  const vehicleSubRef = useRef<StompSubscription | null>(null);
  const shipmentSubRef = useRef<StompSubscription | null>(null);

  // Stable callback refs — avoid re-triggering effect on every render cycle
  const onVehicleUpdateRef = useRef(onVehicleUpdate);
  const onMilestoneRef = useRef(onMilestone);
  useEffect(() => { onVehicleUpdateRef.current = onVehicleUpdate; }, [onVehicleUpdate]);
  useEffect(() => { onMilestoneRef.current = onMilestone; }, [onMilestone]);

  const handleVehicleFrame = useCallback((msg: IMessage) => {
    try {
      const event: VehicleLocationEvent = JSON.parse(msg.body);
      onVehicleUpdateRef.current?.(event);
    } catch {
      // Malformed frame — ignore silently
    }
  }, []);

  const handleMilestoneFrame = useCallback((msg: IMessage) => {
    try {
      // Milestone may arrive as a plain string or a JSON-wrapped string
      const text = msg.body.startsWith('"') ? JSON.parse(msg.body) : msg.body;
      onMilestoneRef.current?.(text);
    } catch {
      onMilestoneRef.current?.(msg.body);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const stompClient = new Client({
      // SockJS factory provides the HTTP→WS upgrade negotiation path
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      // Exponential back-off: reconnect every 5 s after a drop
      reconnectDelay: 5000,

      onConnect: () => {
        // ── Fleet-wide live vehicle position stream ─────────────────────
        vehicleSubRef.current = stompClient.subscribe(
          '/topic/fleet.vehicles',
          handleVehicleFrame,
        );

        // ── Per-shipment milestone channel (if caller provides an ID) ───
        if (shipmentId != null) {
          shipmentSubRef.current = stompClient.subscribe(
            `/topic/shipment.${shipmentId}.tracking`,
            handleMilestoneFrame,
          );
        }
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message'], frame.body);
      },

      onDisconnect: () => {
        vehicleSubRef.current = null;
        shipmentSubRef.current = null;
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      // Graceful teardown — unsubscribe before deactivating
      vehicleSubRef.current?.unsubscribe();
      shipmentSubRef.current?.unsubscribe();
      vehicleSubRef.current = null;
      shipmentSubRef.current = null;
      stompClient.deactivate();
      clientRef.current = null;
    };
  // Re-connects only when token, shipmentId, or wsUrl changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, shipmentId, wsUrl]);
}
