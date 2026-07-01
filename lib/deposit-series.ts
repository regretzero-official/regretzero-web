export interface DepositSeriesPoint {
  date: string;
  price: number;
}

export type SyntheticSeriesResolution = "daily" | "monthly" | "weekly";

export const DEPOSIT_ANNUAL_RATE = 0.0304;

const DEPOSIT_MONTHLY_RATE = Math.pow(1 + DEPOSIT_ANNUAL_RATE, 1 / 12) - 1;
const AVG_MONTH_MS = 365.25 * 24 * 60 * 60 * 1000 / 12;

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addMonths(date: Date, monthsToAdd: number) {
  const targetMonth = date.getMonth() + monthsToAdd;
  const firstDayOfTargetMonth = new Date(date.getFullYear(), targetMonth, 1);
  const lastDayOfTargetMonth = new Date(
    firstDayOfTargetMonth.getFullYear(),
    firstDayOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();

  return new Date(
    firstDayOfTargetMonth.getFullYear(),
    firstDayOfTargetMonth.getMonth(),
    Math.min(date.getDate(), lastDayOfTargetMonth),
  );
}

function addDays(date: Date, daysToAdd: number) {
  return new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

function getElapsedMonths(startDate: string, endDate: string) {
  const diffMs = parseDate(endDate).getTime() - parseDate(startDate).getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return diffMs / AVG_MONTH_MS;
}

export function getDepositGrowthFactor(startDate: string, endDate: string) {
  return Math.pow(1 + DEPOSIT_MONTHLY_RATE, getElapsedMonths(startDate, endDate));
}

export function getDepositValueAtDate(
  principalKrw: number,
  startDate: string,
  currentDate: string,
) {
  return principalKrw * getDepositGrowthFactor(startDate, currentDate);
}

export function buildDepositSyntheticSeries(
  startDate: string,
  endDate: string,
  resolution: SyntheticSeriesResolution = "monthly",
): DepositSeriesPoint[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (end.getTime() <= start.getTime()) {
    return [{ date: startDate, price: 1 }];
  }

  const points: DepositSeriesPoint[] = [];
  const addedDates = new Set<string>();

  const pushPoint = (date: string) => {
    if (addedDates.has(date)) {
      return;
    }

    points.push({
      date,
      price: getDepositGrowthFactor(startDate, date),
    });
    addedDates.add(date);
  };

  pushPoint(startDate);

  let cursor = start;
  while (true) {
    cursor =
      resolution === "daily"
        ? addDays(cursor, 1)
        : resolution === "weekly"
          ? addDays(cursor, 7)
          : addMonths(cursor, 1);
    const nextDate = formatDate(cursor);

    if (nextDate >= endDate) {
      break;
    }

    pushPoint(nextDate);
  }

  pushPoint(endDate);

  return points;
}
