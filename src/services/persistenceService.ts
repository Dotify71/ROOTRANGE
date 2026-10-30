import { RootrangeSaveState } from '../types/progression';

const DB_NAME = 'ROOTRANGE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'save_state';
const STATE_KEY = 'current_game_save';
const LOCALSTORAGE_KEY = 'rootrange_save_state_v1';

export class PersistenceService {
  private static dbPromise: Promise<IDBDatabase | null> | null = null;

  /**
   * Initializes or returns open IndexedDB connection.
   */
  private static getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            console.warn('[PersistenceService] IndexedDB open error, falling back to localStorage.');
            resolve(null);
          };
        } catch (err) {
          console.warn('[PersistenceService] IndexedDB initialization failed:', err);
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  /**
   * Save game state to IndexedDB with localStorage fallback.
   */
  public static async saveState(state: RootrangeSaveState): Promise<boolean> {
    const validation = this.validateSaveState(state);
    if (!validation.valid || !validation.validatedState) {
      console.error('[PersistenceService] Cannot save invalid state:', validation.error);
      return false;
    }

    const payload = validation.validatedState;

    // 1. Always write to localStorage as immediate synchronous fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('[PersistenceService] localStorage write error:', e);
    }

    // 2. Persist to IndexedDB
    try {
      const db = await this.getDB();
      if (db) {
        return new Promise<boolean>((resolve) => {
          try {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const req = store.put(payload, STATE_KEY);

            req.onsuccess = () => resolve(true);
            req.onerror = () => {
              console.warn('[PersistenceService] IndexedDB put failed');
              resolve(true); // localStorage succeeded
            };
          } catch {
            resolve(true);
          }
        });
      }
    } catch (err) {
      console.warn('[PersistenceService] IndexedDB save error:', err);
    }

    return true;
  }

  /**
   * Load saved state from IndexedDB or localStorage fallback.
   */
  public static async loadState(): Promise<RootrangeSaveState | null> {
    // 1. Try IndexedDB first
    try {
      const db = await this.getDB();
      if (db) {
        const idbState = await new Promise<RootrangeSaveState | null>((resolve) => {
          try {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const req = store.get(STATE_KEY);

            req.onsuccess = () => {
              const res = req.result;
              if (res) {
                const validation = PersistenceService.validateSaveState(res);
                resolve(validation.valid && validation.validatedState ? validation.validatedState : null);
              } else {
                resolve(null);
              }
            };

            req.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        });

        if (idbState) return idbState;
      }
    } catch (err) {
      console.warn('[PersistenceService] IndexedDB load error:', err);
    }

    // 2. Fallback to localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(LOCALSTORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const validation = this.validateSaveState(parsed);
          if (validation.valid && validation.validatedState) {
            return validation.validatedState;
          }
        }
      }
    } catch (e) {
      console.warn('[PersistenceService] localStorage load error:', e);
    }

    return null;
  }

  /**
   * Purge saved state from both storage mechanisms.
   */
  public static async clearState(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(LOCALSTORAGE_KEY);
      }
    } catch {
      // ignore
    }

    try {
      const db = await this.getDB();
      if (db) {
        await new Promise<void>((resolve) => {
          try {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const req = store.delete(STATE_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          } catch {
            resolve();
          }
        });
      }
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Deep validation of save data against versioned schema.
   */
  public static validateSaveState(data: unknown): {
    valid: boolean;
    validatedState?: RootrangeSaveState;
    error?: string;
  } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Malformed save data: Root value must be a valid JSON object.' };
    }

    const obj = data as Record<string, unknown>;

    // Version validation
    if (typeof obj.version !== 'number') {
      return { valid: false, error: 'Schema validation error: Missing version identifier.' };
    }

    if (obj.version !== 1) {
      return {
        valid: false,
        error: `Unsupported save schema version: ${obj.version}. Only version 1 is supported.`,
      };
    }

    // Score validation
    if (typeof obj.score !== 'number' || isNaN(obj.score) || obj.score < 0) {
      return { valid: false, error: 'Schema validation error: "score" must be a non-negative number.' };
    }

    // Claimed flags validation
    let safeFlags: string[] = [];
    if (Array.isArray(obj.claimedFlags)) {
      safeFlags = obj.claimedFlags.filter((f) => typeof f === 'string');
    }

    // Unlocked achievements validation
    const safeAchievements = Array.isArray(obj.unlockedAchievements)
      ? obj.unlockedAchievements.filter((a) => typeof a === 'string')
      : [];

    // Machines validation
    if (!Array.isArray(obj.machines)) {
      return { valid: false, error: 'Schema validation error: "machines" must be an array.' };
    }

    const safeMachines: RootrangeSaveState['machines'] = [];
    for (const m of obj.machines) {
      if (!m || typeof m !== 'object') continue;
      const mObj = m as Record<string, unknown>;
      if (typeof mObj.id !== 'string') continue;

      safeMachines.push({
        id: mObj.id,
        compromiseLevel: (mObj.compromiseLevel as 'NONE' | 'RECON' | 'USER' | 'ROOT') || 'NONE',
        userClaimed: Boolean(mObj.userClaimed),
        rootClaimed: Boolean(mObj.rootClaimed),
      });
    }

    // Fallback flags derivation if claimedFlags was absent in legacy simulation export
    if (safeFlags.length === 0) {
      for (const m of safeMachines) {
        if (m.id === 'ecorp-hr') {
          if (m.userClaimed) safeFlags.push('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
          if (m.rootClaimed) safeFlags.push('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');
        } else if (m.id === 'iron-vault') {
          if (m.userClaimed) safeFlags.push('ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}');
          if (m.rootClaimed) safeFlags.push('ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}');
        } else if (m.id === 'corp-dc01') {
          if (m.userClaimed) safeFlags.push('ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}');
          if (m.rootClaimed) safeFlags.push('ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}');
        }
      }
    }

    const validated: RootrangeSaveState = {
      version: 1,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
      score: obj.score,
      rank: typeof obj.rank === 'string' ? obj.rank : 'Script Kiddie',
      claimedFlags: safeFlags,
      unlockedAchievements: safeAchievements,
      activeMachineId: typeof obj.activeMachineId === 'string' ? obj.activeMachineId : 'ecorp-hr',
      machines: safeMachines,
      evidence: Array.isArray(obj.evidence) ? (obj.evidence as any) : [],
      events: Array.isArray(obj.events) ? (obj.events as any) : [],
    };

    return { valid: true, validatedState: validated };
  }

  /**
   * Export state to clean JSON string.
   */
  public static exportStateToJson(state: RootrangeSaveState): string {
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import and validate save string.
   */
  public static importStateFromJson(jsonString: string): {
    valid: boolean;
    validatedState?: RootrangeSaveState;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      return this.validateSaveState(parsed);
    } catch {
      return {
        valid: false,
        error: 'JSON parse failure: The provided file or string is not valid JSON.',
      };
    }
  }
}
