"use client";
import { useErrorStore } from "@/store/errorStore";
import { Button } from "@/components/ui/button";

export default function ErrorModal() {
  const { isOpen, title, message, details, closeError } = useErrorStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay oscuro global */}
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
      {/* Panel centrado */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]">
        <div className="min-w-[300px] max-w-sm rounded-xl border p-5 shadow-2xl backdrop-blur-md bg-red-600/30 border-red-400/60">
          {title && (
            <p className="text-center font-semibold text-red-200">{title}</p>
          )}
          {message && (
            <p className="mt-1 text-center text-white/90 text-sm">{message}</p>
          )}
          {details && (
            <p className="mt-1 text-center text-white/70 text-xs">{details}</p>
          )}
          <div className="mt-4 flex justify-center">
            <Button
              onClick={closeError}
              variant="secondary"
              className="bg-white/30 hover:bg-white/40 text-white border-white/30"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}