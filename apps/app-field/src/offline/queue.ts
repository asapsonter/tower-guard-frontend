/**
 * Offline message queue for the Field App App.
 *
 * Field officers operate in low-signal rural areas. When the device is
 * offline, this queue persists outgoing dispatch messages, status updates,
 * and evidence upload metadata in IndexedDB. When the network reconnects,
 * the queue flushes in FIFO order.
 *
 * Storage: IndexedDB via the `idb` wrapper.
 * Database: tower-guard-field
 * Stores:
 *   - outgoing_messages    (id, assignment_id, payload, created_at, attempts)
 *   - outgoing_status      (id, assignment_id, new_status, created_at, attempts)
 *   - outgoing_evidence    (id, assignment_id, file_blob, mime, created_at, attempts)
 *
 * Public API:
 *   - enqueueMessage(assignmentId, payload)
 *   - enqueueStatusChange(assignmentId, newStatus)
 *   - enqueueEvidence(assignmentId, file)
 *   - flush() — call on reconnect / on a setInterval
 *   - countPending()
 */
import { openDB, type IDBPDatabase } from "idb";

interface FieldDB {
  outgoing_messages: {
    key: string;
    value: {
      id: string;
      assignment_id: string;
      payload: Record<string, unknown>;
      created_at: string;
      attempts: number;
    };
  };
  outgoing_status: {
    key: string;
    value: {
      id: string;
      assignment_id: string;
      new_status: string;
      created_at: string;
      attempts: number;
    };
  };
  outgoing_evidence: {
    key: string;
    value: {
      id: string;
      assignment_id: string;
      file_blob: Blob;
      mime: string;
      created_at: string;
      attempts: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<FieldDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FieldDB>("tower-guard-field", 1, {
      upgrade(db) {
        db.createObjectStore("outgoing_messages", { keyPath: "id" });
        db.createObjectStore("outgoing_status", { keyPath: "id" });
        db.createObjectStore("outgoing_evidence", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

const newId = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export async function enqueueMessage(assignmentId: string, payload: Record<string, unknown>) {
  const db = await getDB();
  await db.put("outgoing_messages", {
    id: newId(),
    assignment_id: assignmentId,
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
}

export async function enqueueStatusChange(assignmentId: string, newStatus: string) {
  const db = await getDB();
  await db.put("outgoing_status", {
    id: newId(),
    assignment_id: assignmentId,
    new_status: newStatus,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
}

export async function enqueueEvidence(assignmentId: string, file: Blob, mime: string) {
  const db = await getDB();
  await db.put("outgoing_evidence", {
    id: newId(),
    assignment_id: assignmentId,
    file_blob: file,
    mime,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
}

export async function countPending(): Promise<number> {
  const db = await getDB();
  const [m, s, e] = await Promise.all([
    db.count("outgoing_messages"),
    db.count("outgoing_status"),
    db.count("outgoing_evidence"),
  ]);
  return m + s + e;
}

/**
 * Flush queued items by invoking the provided handlers.
 * Each handler returns true on success (item is removed) or false (item is kept).
 * Handlers are injected so this module stays free of supabase/api dependencies.
 */
export interface FlushHandlers {
  sendMessage: (assignmentId: string, payload: Record<string, unknown>) => Promise<boolean>;
  sendStatus: (assignmentId: string, newStatus: string) => Promise<boolean>;
  sendEvidence: (assignmentId: string, file: Blob, mime: string) => Promise<boolean>;
}

export async function flush(handlers: FlushHandlers): Promise<{ sent: number; failed: number }> {
  const db = await getDB();
  let sent = 0;
  let failed = 0;

  // Messages
  for (const item of await db.getAll("outgoing_messages")) {
    try {
      const ok = await handlers.sendMessage(item.assignment_id, item.payload);
      if (ok) {
        await db.delete("outgoing_messages", item.id);
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  // Status updates
  for (const item of await db.getAll("outgoing_status")) {
    try {
      const ok = await handlers.sendStatus(item.assignment_id, item.new_status);
      if (ok) {
        await db.delete("outgoing_status", item.id);
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  // Evidence (binary)
  for (const item of await db.getAll("outgoing_evidence")) {
    try {
      const ok = await handlers.sendEvidence(item.assignment_id, item.file_blob, item.mime);
      if (ok) {
        await db.delete("outgoing_evidence", item.id);
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}
