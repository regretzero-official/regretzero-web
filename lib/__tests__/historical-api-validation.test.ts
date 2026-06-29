import { describe, expect, it } from "vitest";

import { validateHistoricalRequestParams } from "@/app/api/historical/route";

describe("validateHistoricalRequestParams", () => {
  it("accepts a supported ticker and valid date range", () => {
    expect(
      validateHistoricalRequestParams({
        end: "2026-05-08",
        start: "2016-05-08",
        ticker: "QQQ",
      }),
    ).toEqual({
      end: "2026-05-08",
      start: "2016-05-08",
      ticker: "QQQ",
    });
  });

  it("rejects unsupported tickers before fetching upstream data", () => {
    expect(
      validateHistoricalRequestParams({
        end: "2026-05-08",
        start: "2016-05-08",
        ticker: "https://example.com",
      }),
    ).toEqual({
      error: "Unsupported ticker.",
      status: 400,
    });
  });

  it("rejects impossible calendar dates", () => {
    expect(
      validateHistoricalRequestParams({
        end: "2026-02-31",
        start: "2016-05-08",
        ticker: "QQQ",
      }),
    ).toEqual({
      error: "start and end must be valid calendar dates.",
      status: 400,
    });
  });

  it("rejects reversed or zero-length ranges", () => {
    expect(
      validateHistoricalRequestParams({
        end: "2016-05-08",
        start: "2026-05-08",
        ticker: "QQQ",
      }),
    ).toEqual({
      error: "end must be later than start.",
      status: 400,
    });
  });

  it("caps historical ranges to avoid oversized upstream requests", () => {
    expect(
      validateHistoricalRequestParams({
        end: "2026-05-08",
        start: "1900-01-01",
        ticker: "QQQ",
      }),
    ).toEqual({
      error: "Requested date range is too large.",
      status: 400,
    });
  });
});
