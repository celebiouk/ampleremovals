"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { AddressOption } from "@/types";

interface WizardContextValue {
  /** Fetched address options keyed by group ("origin" | "destination"). */
  addresses: Record<string, AddressOption[]>;
  setAddresses: (group: string, list: AddressOption[]) => void;
  /** Jump to a step index (used by the Review step's Edit buttons). */
  goToStep: (step: number) => void;
  /** True when an admin is completing a lead — unlocks the manual price field. */
  admin: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  goToStep,
  admin = false,
  children,
}: {
  goToStep: (step: number) => void;
  admin?: boolean;
  children: React.ReactNode;
}) {
  const [addresses, setAddressesState] = useState<
    Record<string, AddressOption[]>
  >({});

  const setAddresses = useCallback((group: string, list: AddressOption[]) => {
    setAddressesState((prev) => ({ ...prev, [group]: list }));
  }, []);

  return (
    <WizardContext.Provider value={{ addresses, setAddresses, goToStep, admin }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within a WizardProvider");
  return ctx;
}
