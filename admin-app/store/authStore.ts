import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  /** "admin" once verified; null while unknown/anonymous. */
  userType: "admin" | "driver" | "unknown" | null;
  initialised: boolean;
  /** True between a PASSWORD_RECOVERY deep link and setting the new password. */
  recovering: boolean;
  setSession: (session: Session | null) => void;
  setUserType: (t: AuthState["userType"]) => void;
  setInitialised: (v: boolean) => void;
  setRecovering: (v: boolean) => void;
  reset: () => void;
}

/** Global auth state — hydrated by the root layout's onAuthStateChange. */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  userType: null,
  initialised: false,
  recovering: false,
  setSession: (session) => set({ session }),
  setUserType: (userType) => set({ userType }),
  setInitialised: (initialised) => set({ initialised }),
  setRecovering: (recovering) => set({ recovering }),
  reset: () => set({ session: null, userType: null, recovering: false }),
}));
