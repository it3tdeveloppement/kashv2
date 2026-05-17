import {
  getQueuedOperations,
  removeFromQueue,
  incrementQueueAttempt,
} from "./offlineQueue";
import type { OfflineQueueEntry } from "@kash/types";

const MAX_ATTEMPTS = 5;

type OperationHandler = (entry: OfflineQueueEntry) => Promise<void>;

const handlers = new Map<OfflineQueueEntry["type"], OperationHandler>();

export function registerOfflineHandler(
  type: OfflineQueueEntry["type"],
  handler: OperationHandler
): void {
  handlers.set(type, handler);
}

export async function processOfflineQueue(): Promise<void> {
  const entries = await getQueuedOperations();
  if (entries.length === 0) return;

  for (const entry of entries) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      console.error(`[OfflineQueue] Dropping entry ${entry.id} after ${MAX_ATTEMPTS} attempts`);
      await removeFromQueue(entry.id);
      continue;
    }

    const handler = handlers.get(entry.type);
    if (!handler) {
      console.warn(`[OfflineQueue] No handler registered for type: ${entry.type}`);
      continue;
    }

    try {
      await handler(entry);
      await removeFromQueue(entry.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await incrementQueueAttempt(entry.id, msg);
    }
  }
}

let _processorInterval: ReturnType<typeof setInterval> | null = null;

export function startQueueProcessor(intervalMs = 10_000): void {
  if (_processorInterval) return;
  _processorInterval = setInterval(() => {
    processOfflineQueue().catch(console.error);
  }, intervalMs);
}

export function stopQueueProcessor(): void {
  if (_processorInterval) {
    clearInterval(_processorInterval);
    _processorInterval = null;
  }
}
