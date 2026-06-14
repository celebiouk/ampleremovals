import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { apiFetch } from "./api";

/**
 * Offline resilience.
 *
 * Two local buffers, both flushed automatically when the network returns:
 *  - ACTION queue: critical POSTs (journey/start, arrived, status, pickup,
 *    delivery, complete) made while offline. Replayed in order.
 *  - LOCATION buffer: GPS points captured by the background task while offline.
 *    Uploaded in one batch (the /location route keeps the latest).
 */

const ACTION_KEY = "AMPLE_DRIVER_ACTION_QUEUE";
const LOC_KEY = "AMPLE_DRIVER_LOC_BUFFER";

export interface QueuedAction { id: string; path: string; body: unknown; ts: number }
export interface BufferedPoint { lat: number; lng: number; heading?: number | null; speed?: number | null; accuracy?: number | null; recorded_at: string }

async function read<T>(key: string): Promise<T[]> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T[]) : []; } catch { return []; }
}
async function write<T>(key: string, items: T[]): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(items)); } catch { /* storage full — best effort */ }
}

/** Queue a critical POST to retry later. */
export async function enqueueAction(path: string, body: unknown): Promise<void> {
  const items = await read<QueuedAction>(ACTION_KEY);
  items.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, path, body, ts: Date.now() });
  await write(ACTION_KEY, items);
}

/** Buffer a GPS point for batched upload. Caps at 500 to bound storage. */
export async function bufferLocation(p: BufferedPoint): Promise<void> {
  const items = await read<BufferedPoint>(LOC_KEY);
  items.push(p);
  await write(LOC_KEY, items.slice(-500));
}

/** Total pending items across both buffers (for the offline banner). */
export async function getQueueLength(): Promise<number> {
  const [a, l] = await Promise.all([read<QueuedAction>(ACTION_KEY), read<BufferedPoint>(LOC_KEY)]);
  return a.length + (l.length > 0 ? 1 : 0);
}

/**
 * POST to the API; if it fails because we're offline, queue it instead.
 * Returns true if it went through immediately. Use for the critical job actions.
 */
export async function postOrQueue(path: string, body: unknown): Promise<boolean> {
  try {
    await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
    return true;
  } catch {
    await enqueueAction(path, body);
    return false;
  }
}

/** Replay any queued actions + flush buffered locations. Safe to call often. */
export async function flushQueue(): Promise<void> {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  // Locations first (one batch), so an ETA recalculation sees fresh GPS.
  const locs = await read<BufferedPoint>(LOC_KEY);
  if (locs.length > 0) {
    try {
      await apiFetch("/api/drivers/location", { method: "POST", body: JSON.stringify({ batch: locs }) });
      await write<BufferedPoint>(LOC_KEY, []);
    } catch { /* still offline — keep buffered */ }
  }

  const actions = await read<QueuedAction>(ACTION_KEY);
  if (actions.length === 0) return;
  const remaining: QueuedAction[] = [];
  for (const a of actions) {
    try {
      await apiFetch(a.path, { method: "POST", body: JSON.stringify(a.body) });
    } catch {
      remaining.push(a); // keep this and everything after it in order
    }
  }
  await write(ACTION_KEY, remaining);
}

/** Wire flushQueue to network-reconnect. Returns an unsubscribe fn. */
export function registerAutoFlush(): () => void {
  const sub = NetInfo.addEventListener((s) => { if (s.isConnected) flushQueue(); });
  flushQueue();
  return () => sub();
}
