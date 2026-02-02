export const APP_TIME_ZONE = 'America/Sao_Paulo';
export const APP_TIME_ZONE_OFFSET = '-03:00';

const getDateTimePartsInTimeZone = (date) => {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = dtf.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second')
  };
};

export const dateOnlyInLondrina = (date) => {
  const { year, month, day } = getDateTimePartsInTimeZone(date);
  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
};

export const dateOnlyNowLondrina = () => dateOnlyInLondrina(new Date());

export const dateTimeIsoNowLondrina = () => dateTimeIsoInLondrina(new Date());

export const dateTimeIsoInLondrina = (date) => {
  const { year, month, day, hour, minute, second } = getDateTimePartsInTimeZone(date);
  if (!year || !month || !day || !hour || !minute || !second) return '';
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${APP_TIME_ZONE_OFFSET}`;
};

export const dateOnlyFromAnyLondrina = (value) => {
  if (!value) return null;
  if (value instanceof Date) return dateOnlyInLondrina(value);
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return dateOnlyInLondrina(parsed);
};

const parseDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
};

export const diffDaysDateOnly = (fromDateOnly, toDateOnly) => {
  const from = parseDateOnly(fromDateOnly);
  const to = parseDateOnly(toDateOnly);
  if (!from || !to) return null;
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / 86400000);
};

