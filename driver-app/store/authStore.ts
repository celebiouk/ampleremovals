import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  driverId: string | null;
  initialised: boolean;
  setSession: (s: Session | null) => void;
  setDriverId: (id: string | null) => void;
  setInitialised: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  driverId: null,
  initialised: false,
  setSession: (session) => set({ session }),
  setDriverId: (driverId) => set({ driverId }),
  setInitialised: (initialised) => set({ initialised }),
}));
