"use client";
import { create } from "zustand";

interface ErrorState {
  isOpen: boolean;
  title?: string;
  message?: string;
  details?: string;
  openError: (title: string, message?: string, details?: string) => void;
  closeError: () => void;
}

export const useErrorStore = create<ErrorState>()((set) => ({
  isOpen: false,
  title: undefined,
  message: undefined,
  details: undefined,
  openError: (title, message, details) =>
    set({ isOpen: true, title, message, details }),
  closeError: () =>
    set({ isOpen: false, title: undefined, message: undefined, details: undefined }),
}));

// Helper para abrir el modal desde código no React (servicios, interceptores)
export const openErrorModal = (title: string, message?: string, details?: string) => {
  useErrorStore.getState().openError(title, message, details);
};