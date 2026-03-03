const WAT_TIMEZONE = 'Africa/Lagos';

export function isSameDayWAT(utcTimestamp: string): boolean {
  const recordDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: WAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(utcTimestamp));

  const todayDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: WAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return recordDate === todayDate;
}

export function getTodayWAT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
