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

function createToast(
  toast: ToastType,
  severity: "error" | "success" | "info",
  title: string,
  detail: string
): void {
  toast.add({ severity, summary: title, detail, life: toastLife });
}

export function createErrorToast(
  toast: ToastType,
  title: string,
  detail: string
): void {
  createToast(toast, "error", title, detail);
}

export function createSuccessToast(
  toast: ToastType,
  title: string,
  detail: string
): void {
  createToast(toast, "success", title, detail);
}

export function createInfoToast(
  toast: ToastType,
  title: string,
  detail: string
): void {
  createToast(toast, "info", title, detail);
}
