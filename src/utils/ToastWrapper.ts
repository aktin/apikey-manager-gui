/**
 * Utility functions for displaying PrimeVue toasts.
 *
 * These functions simplify the usage of `toast.add()` by wrapping it with
 * preconfigured severity levels and a default display duration.
 *
 * Requires an instance of `useToast()` to be passed in from the caller.
 */
import { useToast } from "primevue/usetoast";

type ToastType = ReturnType<typeof useToast>;

const toastLife = 5000;

export function createErrorToast(toast: ToastType, title: string, detail: string): void {
  toast.add({
    severity: "error",
    summary: title,
    detail,
    life: toastLife,
  });
}

export function createSuccessToast(toast: ToastType, title: string, detail: string): void {
  toast.add({
    severity: "success",
    summary: title,
    detail,
    life: toastLife,
  });
}

export function createInfoToast(toast: ToastType, title: string, detail: string): void {
  toast.add({
    severity: "info",
    summary: title,
    detail,
    life: toastLife,
  });
}
