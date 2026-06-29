import { describe, expect, it } from "vitest";

import {
  buildRealEstateProxySeries,
  getRealEstateGrowthFactor,
  getRealEstateProxyAnchors,
  getRealEstateProxyPriceAtDate,
} from "@/lib/seoul-apartment-proxy";

describe("seoul-apartment-proxy", () => {
  it("returns a monthly proxy series across the requested range", () => {
    const series = buildRealEstateProxySeries("seoul_apt", "2020-01-01", "2020-04-01");

    expect(series.map((point) => point.date)).toEqual([
      "2020-01-01",
      "2020-02-01",
      "2020-03-01",
      "2020-04-01",
    ]);
  });

  it("keeps seoul and gangnam on distinct real-estate paths", () => {
    const seoulAnchors = getRealEstateProxyAnchors("seoul_apt");
    const gangnamGuAnchors = getRealEstateProxyAnchors("gangnam_gu_apt");

    expect(seoulAnchors).not.toEqual(gangnamGuAnchors);
    expect(getRealEstateProxyPriceAtDate("seoul_apt", "2015-08-01")).toBe(520_000_000);
    expect(getRealEstateProxyPriceAtDate("gangnam_gu_apt", "2015-08-01")).toBe(900_000_000);
    expect(getRealEstateProxyPriceAtDate("seoul_apt", "2025-08-01")).toBe(1_430_000_000);
    expect(getRealEstateProxyPriceAtDate("gangnam_gu_apt", "2025-08-01")).toBe(3_350_000_000);
  });

  it("grows according to separate interpolated paths", () => {
    expect(getRealEstateProxyPriceAtDate("seoul_apt", "2020-08-01")).toBeGreaterThan(
      getRealEstateProxyPriceAtDate("seoul_apt", "2016-08-01"),
    );
    expect(getRealEstateProxyPriceAtDate("gangnam_gu_apt", "2025-08-01")).toBeGreaterThan(
      getRealEstateProxyPriceAtDate("seoul_apt", "2025-08-01"),
    );
    expect(getRealEstateGrowthFactor("seoul_apt", "2015-08-01", "2025-08-01")).toBeCloseTo(
      1_430_000_000 / 520_000_000,
      6,
    );
    expect(getRealEstateGrowthFactor("gangnam_gu_apt", "2015-08-01", "2025-08-01")).toBeCloseTo(
      3_350_000_000 / 900_000_000,
      6,
    );
  });
});
