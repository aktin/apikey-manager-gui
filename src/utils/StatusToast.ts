/**
 * Maps AKTIN Broker HTTP status codes to localized error messages.
 *
 * Owns the error arms shared across components (401, 500, and any unexpected
 * code). Callers pass `overrides` for codes whose message depends on context
 * (e.g. 404, 409). Both the toast and plain-message helpers draw from the same
 * mapping so the wording stays consistent.
 */
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { createErrorToast } from "./ToastWrapper";

type ToastType = ReturnType<typeof useToast>;
type TranslateFn = ReturnType<typeof useI18n>["t"];

/** i18n key pair for an error's title and detail message. */
export type StatusErrorKeys = { title: string; message: string };

const COMMON_STATUS_ERRORS: Record<number, StatusErrorKeys> = {
  401: { title: "accessDenied", message: "noAuthorization" },
  500: { title: "serverError", message: "serverErrorOccurred" }
};

/**
 * Resolves a status code to localized error text, preferring `overrides` over
 * the common defaults and falling back to a generic "unexpected error".
 */
export function resolveStatusError(
  t: TranslateFn,
  status: number,
  overrides: Record<number, StatusErrorKeys> = {}
): { title: string; detail: string } {
  const keys = overrides[status] ?? COMMON_STATUS_ERRORS[status];
  return keys
    ? { title: t(keys.title), detail: t(keys.message) }
    : {
        title: t("unexpectedError"),
        detail: t("unexpectedErrorOccurred", { code: status })
      };
}

/** Shows the resolved error toast for a broker status code. */
export function notifyStatusError(
  toast: ToastType,
  t: TranslateFn,
  status: number,
  overrides: Record<number, StatusErrorKeys> = {}
): void {
  const { title, detail } = resolveStatusError(t, status, overrides);
  createErrorToast(toast, title, detail);
}
