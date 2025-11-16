"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
  theme: "light" | "dark" | "system";
  telemetryRate: number;
  smooth: boolean;
  defaultDevice: string;
  setTheme: (t: "light" | "dark" | "system") => void;
  setTelemetryRate: (v: number) => void;
  setSmooth: (v: boolean) => void;
  setDefaultDevice: (id: string) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      telemetryRate: 1000,
      smooth: true,
      defaultDevice: "",
      setTheme: (t) => set({ theme: t }),
      setTelemetryRate: (v) => set({ telemetryRate: v > 0 ? v : 1000 }),
      setSmooth: (v) => set({ smooth: v }),
      setDefaultDevice: (id) => set({ defaultDevice: id || "" }),
      reset: () => set({ theme: "system", telemetryRate: 1000, smooth: true, defaultDevice: "" }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);