import React from "react"
import { useStore } from "@/store/StoreContext"
import { CheckIcon, CloseIcon } from "@/components/Icons"

export default function ToastContainer() {
  const { toasts, removeToast } = useStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 shadow-2xl border flex items-start justify-between gap-3 transform transition-all duration-300 animate-slide-up ${
            toast.type === "success"
              ? "bg-[#1f2937] border-[#4a5c2d] text-white"
              : toast.type === "error"
                ? "bg-[#1f2937] border-red-500 text-white"
                : "bg-[#1f2937] border-[#4b5563] text-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                toast.type === "success"
                  ? "bg-[#4a5c2d] text-white"
                  : toast.type === "error"
                    ? "bg-red-600 text-white"
                    : "bg-[#374151] text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckIcon className="w-3 h-3" />
              ) : toast.type === "error" ? (
                "!"
              ) : (
                "•"
              )}
            </span>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {toast.title}
              </p>
              <p className="text-xs text-[#9ca3af] mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#9ca3af] hover:text-white p-1"
            aria-label="Close notification"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
