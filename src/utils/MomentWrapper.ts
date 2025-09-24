import moment, {Duration} from "moment";

export class MomentWrapper {
  static formatDateToGermanLocale(date: Date | undefined | null): string {
    return date ? moment(date).locale("de").format("DD.MM.YYYY HH:mm") : "";
  }

  static createDuration(value: any): Duration {
    return moment.duration(value);
  }

  static formatDurationToHumanReadable(duration: Duration, localize: (key: string) => string
  ): string {
    const parts = new Array<string>();
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
}

export type MomentDuration = Duration;

export default MomentWrapper;
