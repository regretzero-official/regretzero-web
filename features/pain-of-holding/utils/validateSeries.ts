import type { PricePoint } from "@/features/pain-of-holding/types";

function isValidDate(value: string) {
  return Number.isFinite(Date.parse(`${value}T00:00:00`));
}

export function validateSeries(series: PricePoint[]) {
  if (!Array.isArray(series) || series.length === 0) {
    throw new Error("Price series must contain at least one point.");
  }

  for (let index = 0; index < series.length; index += 1) {
    const point = series[index];

    if (!point) {
      throw new Error(`Price series point at index ${index} is missing.`);
    }

    if (!isValidDate(point.date)) {
      throw new Error(`Price series point at index ${index} has an invalid ISO date.`);
    }

    if (!Number.isFinite(point.price) || Number.isNaN(point.price)) {
      throw new Error(`Price series point at index ${index} has an invalid price.`);
    }

    if (point.price <= 0) {
      throw new Error(`Price series point at index ${index} must have a positive price.`);
    }

    if (index > 0) {
      const previousPoint = series[index - 1];

      if (!previousPoint) {
        continue;
      }

      if (previousPoint.date >= point.date) {
        throw new Error("Price series must be sorted by strictly ascending date.");
      }
    }
  }
}
