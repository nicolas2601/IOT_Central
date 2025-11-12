"use client";
import { create } from "zustand";

/**
 * 🧩 Estado global para manejar modales de error y éxito
 * Compatible con ErrorModal y SuccessModal.
 */
interface ModalState {
  isOpen: boolean;
  title?: string;
  message?: string;
  details?: string;
  type?: "error" | "success";

  // Métodos principales
  openError: (title: string, message?: string, details?: string) => void;
  openSuccess: (title: string, message?: string, details?: string) => void;
  closeModal: () => void;
}

// 🧠 Store principal (mismo estado para ambos modales)
export const useErrorStore = create<ModalState>((set) => ({
  isOpen: false,
  title: undefined,
  message: undefined,
  details: undefined,
  type: undefined,

  openError: (title, message, details) =>
    set({ isOpen: true, title, message, details, type: "error" }),

  openSuccess: (title, message, details) =>
    set({ isOpen: true, title, message, details, type: "success" }),

  closeModal: () =>
    set({
      isOpen: false,
      title: undefined,
      message: undefined,
      details: undefined,
      type: undefined,
    }),
}));

/**
 * 🚀 Helpers globales
 * Permiten abrir los modales desde cualquier parte del código
 * (hooks, servicios o componentes sin hooks).
 */
export const openErrorModal = (title: string, message?: string, details?: string) => {
  useErrorStore.getState().openError(title, message, details);
};

export const openSuccessModal = (title: string, message?: string, details?: string) => {
  useErrorStore.getState().openSuccess(title, message, details);
};

export const closeModal = () => {
  useErrorStore.getState().closeModal();
};
