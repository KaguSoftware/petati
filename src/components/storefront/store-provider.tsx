"use client";

import { createContext, useContext } from "react";

export interface StoreContextValue {
  id: string;
  slug: string;
  name: string;
  currency: string;
  locale: string;
  enabledLocales: string[];
  logoUrl: string | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  value,
  children,
}: {
  value: StoreContextValue;
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside a storefront");
  return ctx;
}
