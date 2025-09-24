import {useI18n} from "vue-i18n";
import moment, {Duration} from "moment";

export type MomentDuration = Duration;

export function createDuration(value: any): Duration {
  return moment.duration(value);
}

export function formatDateToLocale(date: Date | null | undefined): string {
  const {locale} = useI18n({useScope: "global"})
  return date ? moment(date).locale(locale.value).format("DD.MM.YYYY HH:mm") : ""
}

export function formatDurationToHumanReadable(duration: Duration): string {
  const {t} = useI18n({useScope: "global"})
  const parts: string[] = []
  if (duration.years())
    parts.push(`${Math.abs(duration.years())} ${t("year(s)")}`)
  if (duration.months())
    parts.push(`${Math.abs(duration.months())} ${t("month(s)")}`)
  if (duration.days())
    parts.push(`${Math.abs(duration.days())} ${t("day(s)")}`)
  if (duration.hours())
    parts.push(`${Math.abs(duration.hours())} ${t("hour(s)")}`)
  if (duration.minutes())
    parts.push(`${Math.abs(duration.minutes())} ${t("minute(s)")}`)
  if (duration.seconds())
    parts.push(`${Math.abs(duration.seconds())} ${t("second(s)")}`)
  return parts.length > 0 ? parts.join(", ") : t("none")
}
