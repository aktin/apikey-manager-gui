/**
 * ToastWrapper.ts
 *
 * Reusable toast utility functions for PrimeVue.
 * Requires `useToast()` to be passed from the caller for instance safety.
 */

import {useToast} from "primevue/usetoast";

type ToastType = ReturnType<typeof useToast>;

const toastLife = 5000;

export function createErrorToast(toast: ToastType, title: string, detail: string): void {
  toast.add({
    severity: 'error',
    summary: title,
    detail,
    life: toastLife,
  });
}

export function createSuccessToast(toast: ToastType, title: string, detail: string): void {
  toast.add({
    severity: 'success',
    summary: title,
    detail,
    life: toastLife,
  });
}

export function createInfoToast(toast: ToastType, title: string, detail: string): void {
  toast.add({
    severity: 'info',
    summary: title,
    detail,
    life: toastLife,
  });
}
