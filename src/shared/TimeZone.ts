/**
 * Display time zone for every timestamp the app renders: UTC or the fixed
 * local zone. Persisted in localStorage; profiles store it too and apply it
 * when loaded.
 */
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

export const UTC_TIME_ZONE = "UTC";
export const LOCAL_TIME_ZONE = "Europe/Berlin";

export const timeZone = ref<string>(
  localStorage.getItem("timeZone") ?? LOCAL_TIME_ZONE
);
watch(timeZone, (zone) => localStorage.setItem("timeZone", zone));

/**
 * Formats a date as `DD.MM.YYYY HH:mm` plus the zone abbreviation in the
 * active display zone, or returns an empty string for missing or invalid dates.
 */
export function formatDateToLocale(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "";
  const { locale } = useI18n({ useScope: "global" });
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat(locale.value, {
      timeZone: timeZone.value,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short"
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute} ${parts.timeZoneName}`;
}
