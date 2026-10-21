/**
 * Display time zone for every timestamp the app renders: UTC or the fixed
 * local zone. Persisted in localStorage; profiles store it too and apply it
 * when loaded. Also converts between date-picker values (system zone wall
 * clock) and UTC, so dates the broker interprets in UTC are entered in UTC.
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

/**
 * Reinterprets the wall-clock time of a picker date (system zone) as UTC, so
 * "01.10. 00:00" picked in Berlin becomes 2026-10-01T00:00Z, not T22:00Z of
 * the day before.
 */
export function wallClockAsUtc(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    )
  );
}

/** Inverse of `wallClockAsUtc`: a picker date whose wall clock shows the UTC time. */
export function utcAsWallClock(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  );
}
