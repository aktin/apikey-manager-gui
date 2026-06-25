/**
 * Thin Moment.js wrappers for creating durations and for formatting dates and
 * durations for display, localized through the app's vue-i18n instance.
 */
import { useI18n } from "vue-i18n";
import moment, { Duration } from "moment";

export type MomentDuration = Duration;

/**
 * Creates a Moment `Duration` from any Moment-accepted input
 * (ISO 8601 string, milliseconds, plain object, …).
 */
export function createDuration(value: any): Duration {
  return moment.duration(value);
}

/**
 * Formats a date as `DD.MM.YYYY HH:mm` in the active locale, or returns an
 * empty string when the date is null/undefined.
 */
export function formatDateToLocale(date: Date | null | undefined): string {
  const { locale } = useI18n({ useScope: "global" });
  return date
    ? moment(date).locale(locale.value).format("DD.MM.YYYY HH:mm")
    : "";
}

/**
 * Renders a duration as a localized, human-readable string
 * (e.g. "2 hour(s), 30 minute(s)"), or the translated "none" when empty.
 */
export function formatDurationToHumanReadable(duration: Duration): string {
  const { t } = useI18n({ useScope: "global" });
  const units: [number, string][] = [
    [duration.years(), "year(s)"],
    [duration.months(), "month(s)"],
    [duration.days(), "day(s)"],
    [duration.hours(), "hour(s)"],
    [duration.minutes(), "minute(s)"],
    [duration.seconds(), "second(s)"]
  ];
  const parts = units
    .filter(([value]) => value)
    .map(([value, key]) => `${Math.abs(value)} ${t(key)}`);
  return parts.length > 0 ? parts.join(", ") : t("none");
}
