import React, { createContext, useContext, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type OpsTabStatus = "OK" | "Running" | "Pausada" | "Erro";
export type OpsTabType = "client" | "campaign";

export interface OpsTab {
  id: string;
  type: OpsTabType;
  title: string;
  status: OpsTabStatus;
  path?: string;
}

interface OpsTabsContextValue {
  tabs: OpsTab[];
  activeId: string | null;
  openTab: (tab: OpsTab) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
}

const OpsTabsContext = createContext<OpsTabsContextValue | null>(null);

export const OpsTabsProvider = ({ children }: { children: React.ReactNode }) => {
  const [tabs, setTabs] = useState<OpsTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const openTab = (tab: OpsTab) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.id === tab.id);
      if (exists) return prev.map((t) => (t.id === tab.id ? { ...t, ...tab } : t));
      return [...prev, tab];
    });
    setActiveId(tab.id);
    if (tab.path) navigate(tab.path);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) {
      const next = tabs.find((t) => t.id !== id);
      setActiveId(next ? next.id : null);
      if (next?.path) navigate(next.path);
      else if (location.pathname.startsWith("/campaigns/")) navigate("/");
    }
  };

  const setActive = (id: string) => {
    const t = tabs.find((x) => x.id === id);
    if (t) {
      setActiveId(id);
      if (t.path) navigate(t.path);
    }
  };

  const value = useMemo(
    () => ({ tabs, activeId, openTab, closeTab, setActive }),
    [tabs, activeId]
  );

  return <OpsTabsContext.Provider value={value}>{children}</OpsTabsContext.Provider>;
};

export const useOpsTabs = () => {
  const ctx = useContext(OpsTabsContext);
  if (!ctx) throw new Error("useOpsTabs must be used within OpsTabsProvider");
  return ctx;
};
