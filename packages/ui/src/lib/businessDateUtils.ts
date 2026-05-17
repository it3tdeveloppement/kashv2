/**
 * Kash uses a "business day" that starts at 04:00 local time (not midnight).
 * This means a 2:00 AM sale belongs to the previous calendar day's business day.
 */

export function getBusinessDayStart(date: Date, startHour = 4): Date {
  const d = new Date(date);
  if (d.getHours() < startHour) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(startHour, 0, 0, 0);
  return d;
}

export function getBusinessDayEnd(date: Date, startHour = 4): Date {
  const start = getBusinessDayStart(date, startHour);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

export function toBusinessDateRange(
  startDate: Date,
  endDate: Date,
  startHour = 4
): { start: string; end: string } {
  return {
    start: getBusinessDayStart(startDate, startHour).toISOString(),
    end: getBusinessDayEnd(endDate, startHour).toISOString(),
  };
}
