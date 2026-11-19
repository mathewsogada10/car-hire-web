export type ThemePreference = "system" | "light" | "dark";
export type AppearanceState = { preference: ThemePreference; error: string };
export const themeStorageKey = "carhire.theme";

export function readAppearance(): AppearanceState {
  try {
    const saved = window.localStorage.getItem(themeStorageKey);
    if (
      saved === null ||
      saved === "system" ||
      saved === "light" ||
      saved === "dark"
    )
      return { preference: saved ?? "system", error: "" };
    return {
      preference: "system",
      error:
        "The saved theme is invalid. System default is in use; choose a theme again.",
    };
  } catch {
    return {
      preference: "system",
      error:
        "Theme storage is unavailable. Changes will only apply to this tab until it is closed.",
    };
  }
}

export function applyAppearance(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function initializeAppearance() {
  const state = readAppearance();
  applyAppearance(state.preference);
  return state;
}
