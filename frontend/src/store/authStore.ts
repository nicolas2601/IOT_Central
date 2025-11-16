"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthTokens } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  profileOverrides: Partial<User> | null;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
  setProfileOverrides: (overrides: Partial<User> | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      profileOverrides: null,

      setAuth: (user, tokens) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", tokens.access);
          localStorage.setItem("refresh_token", tokens.refresh);
        }
        const overrides = get().profileOverrides ?? null;
        set({
          user: overrides ? { ...user, ...overrides } : user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        const overrides = get().profileOverrides ?? null;
        set({ user: overrides ? { ...user, ...overrides } : user });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          profileOverrides: null,
        });
      },

      // Nuevo flag
      setHasHydrated: (value) => set({ hasHydrated: value }),

      // Establecer overrides de perfil y aplicarlos al usuario en memoria
      setProfileOverrides: (overrides) => {
        const currentUser = get().user;
        set({
          profileOverrides: overrides,
          user: overrides && currentUser ? { ...currentUser, ...overrides } : currentUser,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
