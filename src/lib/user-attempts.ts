import type { SchoolId, SubjectId } from "@/types/exam";

const DEVICE_KEY = "mock-device-id";
const ATTEMPTS_KEY = "mock-user-attempts";

interface AttemptStore {
  deviceId: string;
  bySubject: Partial<Record<SubjectId, number>>;
}

function readStore(): AttemptStore {
  if (typeof window === "undefined") {
    return { deviceId: "server", bySubject: {} };
  }

  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AttemptStore;
    } catch {
      // fall through
    }
  }

  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, deviceId);
  }

  return { deviceId, bySubject: {} };
}

function writeStore(store: AttemptStore): void {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(store));
}

export function getDeviceId(): string {
  return readStore().deviceId;
}

export function getUserAttemptCount(subjectId: SubjectId): number {
  return readStore().bySubject[subjectId] ?? 0;
}

export function getUserAttempts(
  subjects: SubjectId[]
): Partial<Record<SubjectId, number>> {
  const store = readStore();
  const out: Partial<Record<SubjectId, number>> = {};
  for (const subjectId of subjects) {
    out[subjectId] = store.bySubject[subjectId] ?? 0;
  }
  return out;
}

export function incrementUserAttempts(
  schoolId: SchoolId,
  subjects: SubjectId[]
): void {
  void schoolId;
  const store = readStore();
  for (const subjectId of subjects) {
    store.bySubject[subjectId] = (store.bySubject[subjectId] ?? 0) + 1;
  }
  writeStore(store);
}
