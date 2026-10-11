import { useRef, useState } from "react";
export function useLocalStorage<T>(key: string, initial: T) {
  const read = () => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; }
    catch { return initial; }
  };
  const [value, setValue] = useState<T>(read);
  const currentKey = useRef(key);
  if (currentKey.current !== key) { currentKey.current = key; setValue(read()); }
  const update = (next: T | ((previous: T) => T)) => {
    setValue(previous => {
      const result = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
      try { localStorage.setItem(key, JSON.stringify(result)); } catch {}
      return result;
    });
  };
  return [value, update] as const;
}
