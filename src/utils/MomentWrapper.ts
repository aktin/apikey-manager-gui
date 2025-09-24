import {useI18n} from "vue-i18n";
import moment, {Duration} from "moment";

export type MomentDuration = Duration;

export function createDuration(value: any): Duration {
  return moment.duration(value);
}

export function formatDateToLocale(date: Date | null | undefined): string {
  const {locale} = useI18n()
  return date ? moment(date).locale(locale.value).format('DD.MM.YYYY HH:mm') : ''
}

export function formatDurationToHumanReadable(duration: Duration, localize: (key: string) => string): string {
  const parts: string[] = [];
  if (duration.years())
    parts.push(`${Math.abs(duration.years())} ${localize("year(s)")}`);
  if (duration.months())
    parts.push(`${Math.abs(duration.months())} ${localize("month(s)")}`);
  if (duration.days())
    parts.push(`${Math.abs(duration.days())} ${localize("day(s)")}`);
  if (duration.hours())
    parts.push(`${Math.abs(duration.hours())} ${localize("hour(s)")}`);
  if (duration.minutes())
    parts.push(`${Math.abs(duration.minutes())} ${localize("minute(s)")}`);
  if (duration.seconds())
    parts.push(`${Math.abs(duration.seconds())} ${localize("second(s)")}`);
  return parts.length > 0 ? parts.join(", ") : localize("none");
}
