'use client';

import { useState, useEffect } from 'react';

/**
 * A typed localStorage hook that syncs state with a storage key.
 * Falls back to `defaultValue` when the key is missing or SSR.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Hydrate from storage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Storage unavailable or corrupt — keep default
    }
  }, [key]);

  const set = (newValue: T) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      // Ignore quota errors etc.
    }
  };

  return [value, set];
}
