export type KdsBroadcastMessage =
  | { type: "STATUS_CHANGED"; orderId: string; status: string }
  | { type: "NEW_ORDER"; orderId: string };

const CHANNEL_NAME = "kash-kds";

let bc: BroadcastChannel | null = null;
let ws: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<(msg: KdsBroadcastMessage) => void>();

function getBC(): BroadcastChannel {
  if (!bc) {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (ev: MessageEvent<KdsBroadcastMessage>) => {
      listeners.forEach((fn) => fn(ev.data));
    };
  }
  return bc;
}

function connectWS(wsUrl: string) {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(wsUrl);

    ws.onmessage = (ev) => {
      try {
        const msg: KdsBroadcastMessage = JSON.parse(ev.data as string);
        listeners.forEach((fn) => fn(msg));
      } catch {
        /* ignore malformed messages */
      }
    };

    ws.onclose = () => {
      ws = null;
      wsReconnectTimer = setTimeout(() => connectWS(wsUrl), 5_000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    wsReconnectTimer = setTimeout(() => connectWS(wsUrl), 5_000);
  }
}

export function initKitchenBroadcast(wsUrl = "ws://localhost:8765") {
  getBC();
  connectWS(wsUrl);
}

export function destroyKitchenBroadcast() {
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
  ws?.close();
  ws = null;
  bc?.close();
  bc = null;
  listeners.clear();
}

export function broadcastStatusChange(orderId: string, status: string) {
  const msg: KdsBroadcastMessage = { type: "STATUS_CHANGED", orderId, status };
  getBC().postMessage(msg);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function onKitchenBroadcast(fn: (msg: KdsBroadcastMessage) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
