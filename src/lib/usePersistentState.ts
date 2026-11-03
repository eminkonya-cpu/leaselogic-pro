"use client";

import {
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(key);
      if (rawValue != null) {
        setState(JSON.parse(rawValue) as T);
      }
    } catch {
      // Ignore malformed or unavailable localStorage entries.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore write failures such as private mode quota errors.
    }
  }, [hydrated, key, state]);

  return [state, setState] as [T, Dispatch<SetStateAction<T>>];
}
