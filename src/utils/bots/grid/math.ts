const EXP_REGEX = /e/i;

export const round = (value: number, precision = 2): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const stringValue = value.toString();
  if (EXP_REGEX.test(stringValue)) {
    return Number(value.toFixed(precision));
  }

  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const toFixedDown = (value: number, precision = 2): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** precision;
  return Math.floor(value * factor) / factor;
};

export const calcDuration = (
  start?: number | string | Date,
  end: Date = new Date()
): string => {
  if (!start) {
    return '–';
  }

  const startDate = new Date(start);
  const diffMs = end.getTime() - startDate.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return '–';
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months >= 1) {
    const remainingDays = days % 30;
    return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`;
  }

  if (days >= 1) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours >= 1) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  return `${minutes}m`;
};

export const calcTimeAgo = (date?: number | string | Date): string => {
  if (!date) {
    return '–';
  }

  const target = new Date(date);
  const diffMs = Date.now() - target.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(months / 12);
  return `${years}y ago`;
};
