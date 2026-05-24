"use client";

/**
 * 로컬 데이터에 변경이 일어났음을 알리는 가벼운 pub/sub.
 * Repository 함수가 mutation 후 markDirty()를 호출 → AutoSync가 5초 debounce push.
 */

type Listener = (revision: number) => void;

let revision = 0;
const listeners = new Set<Listener>();

export function markDirty(): void {
  revision += 1;
  for (const l of listeners) {
    try {
      l(revision);
    } catch (err) {
      console.error("dirty listener error", err);
    }
  }
}

export function currentDirtyRevision(): number {
  return revision;
}

export function subscribeDirty(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
