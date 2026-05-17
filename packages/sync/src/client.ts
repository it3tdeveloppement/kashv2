import { PowerSyncDatabase, WASQLiteOpenFactory } from "@powersync/web";
import { AppSchema } from "./schema";

export type { AppDatabase } from "./schema";

let _db: PowerSyncDatabase | null = null;

export interface PowerSyncConfig {
  url: string;
  token: string;
}

export function getPowerSyncDb(): PowerSyncDatabase {
  if (!_db) {
    throw new Error("PowerSync database not initialized. Call initPowerSync() first.");
  }
  return _db;
}

export async function initPowerSync(config: PowerSyncConfig): Promise<PowerSyncDatabase> {
  if (_db) {
    await _db.disconnect();
    _db = null;
  }

  const db = new PowerSyncDatabase({
    schema: AppSchema,
    database: new WASQLiteOpenFactory({
      dbFilename: "kash.db",
    }),
  });

  await db.init();

  await db.connect({
    fetchCredentials: async () => ({ endpoint: config.url, token: config.token }),
    // Writes go through edge functions, not PowerSync uploads
    uploadData: async () => {},
  });

  _db = db;
  return db;
}

export async function disconnectPowerSync(): Promise<void> {
  if (_db) {
    await _db.disconnect();
    _db = null;
  }
}
