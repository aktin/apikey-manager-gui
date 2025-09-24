import moment, {Duration} from "moment";

export class MomentWrapper {
  static formatDateToGermanLocale(date: Date | undefined | null): string {
    return date ? moment(date).locale("de").format("DD.MM.YYYY HH:mm") : "";
  }

  static createDuration(value: any): Duration {
    return moment.duration(value);
  }

  static computeDurationBetweenDates(date1: Date, date2: Date): Duration {
    const roundedDate1 = moment(date1).startOf("minute");
    const roundedDate2 = moment(date2).startOf("minute");
    return moment.duration(roundedDate1.diff(roundedDate2));
  }

  static addDurationToDate(referenceDate: Date, duration: Duration): Date {
    return moment(referenceDate).add(duration).toDate();
  }

  static addHoursToDuration(duration: Duration, hours: number): Duration {
    return duration.add(hours, "hours");
  }

  static formatDurationToHumanReadable(
      duration: Duration,
      localize: (key: string) => string
  ): string {
    const parts = new Array<string>();
    if (duration.years())
      parts.push(`${Math.abs(duration.years())} ${localize("year(s)")}`);
    if (duration.months())
      parts.push(
          `${Math.abs(duration.months())} ${localize("month(s)")}`
      );
    if (duration.days())
      parts.push(`${Math.abs(duration.days())} ${localize("day(s)")}`);
    if (duration.hours())
      parts.push(`${Math.abs(duration.hours())} ${localize("hour(s)")}`);
    if (duration.minutes())
      parts.push(
          `${Math.abs(duration.minutes())} ${localize("minute(s)")}`
      );
    if (duration.seconds())
      parts.push(
          `${Math.abs(duration.seconds())} ${localize("second(s)")}`
      );
    return parts.length > 0 ? parts.join(", ") : localize("none");
  }
}

export type MomentDuration = Duration;

export default MomentWrapper;