import { useState, useCallback, useSyncExternalStore } from 'react';

let readIds = new Set<number>();
let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function getSnapshot() {
  return readIds;
}

export function markNotificationRead(id: number) {
  readIds = new Set(readIds).add(id);
  emitChange();
}

export function useReadNotifications() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
