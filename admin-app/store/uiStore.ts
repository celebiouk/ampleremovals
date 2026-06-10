import { create } from "zustand";

type ThemePref = "system" | "light" | "dark";

interface UIState {
  /** User theme preference (persisted in Phase 2+ via AsyncStorage). */
  themePref: ThemePref;
  setThemePref: (t: ThemePref) => void;
}

/** Lightweight UI/global preferences store. */
export const useUIStore = create<UIState>((set) => ({
  themePref: "system",
  setThemePref: (themePref) => set({ themePref }),
}));
