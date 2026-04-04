"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const rawValue = window.localStorage.getItem(key);

      if (rawValue != null) {
        return JSON.parse(rawValue) as T;
      }
    } catch {
      // Ignore malformed or unavailable localStorage entries.
    }

    return defaultValue;
  });
  const isFirstPersistRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (isFirstPersistRef.current) {
        isFirstPersistRef.current = false;
      }

      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore write failures such as private mode quota errors.
    }
  }, [key, state]);

  return [state, setState] as [T, Dispatch<SetStateAction<T>>];
}
