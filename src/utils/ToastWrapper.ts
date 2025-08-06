/**
 * ToastWrapper.ts
 *
 * Reusable toast utility functions for PrimeVue.
 * Requires `useToast()` to be passed from the caller for instance safety.
 */

import type {ToastServiceMethods} from 'primevue/usetoast';

const toastLife = 5000;

/**
 * @param toast - The toast instance from `useToast()`
 * @param title - The error title (e.g. "Error", "Access Denied")
 * @param detail - The error detail message
 */
export function createErrorToast(toast: ToastServiceMethods, title: string, detail: string): void {
  toast.add({
    severity: 'error',
    summary: title,
    detail,
    life: toastLife,
  });
}

/**
 * @param toast - The toast instance from `useToast()`
 * @param title - The success title (e.g. "Success", "Access Granted")
 * @param detail - The success detail message
 */
export function createSuccessToast(toast: ToastServiceMethods, title: string, detail: string): void {
  toast.add({
    severity: 'success',
    summary: title,
    detail,
    life: toastLife,
  });
}
