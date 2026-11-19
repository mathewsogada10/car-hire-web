import { useEffect, useState } from "react";
import { applyAppearance, readAppearance, themeStorageKey } from "./appearance";
import type { AppearanceState, ThemePreference } from "./appearance";

export function useAppearance(initial: AppearanceState) {
  const [preference, setPreference] = useState(initial.preference);
  const [error, setError] = useState(initial.error);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => applyAppearance(preference);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== themeStorageKey && event.key !== null) return;
      const state = readAppearance();
      setPreference(state.preference);
      setError(state.error);
      applyAppearance(state.preference);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function changeTheme(next: ThemePreference) {
    setPreference(next);
    applyAppearance(next);
    try {
      window.localStorage.setItem(themeStorageKey, next);
      setError("");
    } catch {
      setError(
        "Theme changed for this tab, but could not be saved. Check browser storage permissions.",
      );
    }
  }

  return { preference, changeTheme, error };
}

export type AppearanceController = ReturnType<typeof useAppearance>;
