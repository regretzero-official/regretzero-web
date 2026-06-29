import { describe, expect, it } from "vitest";

import {
  buildNeonRankFlashEvents,
  buildNeonTempoSegments,
  chooseNeonMediaRecorderMimeType,
  getTargetNeonCameraDomain,
  inferVolatilityThreshold,
  lerpNeonCameraDomain,
} from "@/lib/neon-race-engine";
import type { RacePoint } from "@/lib/race-engine";

function point(index: number, date: string, left: number, right: number): RacePoint {
  return {
    date,
    index,
    label: date.slice(0, 7),
    left,
    right,
  };
}

describe("neon race engine", () => {
  it("infers the volatility threshold from data resolution", () => {
    expect(
      inferVolatilityThreshold([
        point(0, "2024-01-01", 100, 100),
        point(1, "2024-01-02", 101, 100),
      ]),
    ).toBe(0.025);

    expect(
      inferVolatilityThreshold([
        point(0, "2024-01-01", 100, 100),
        point(1, "2024-01-08", 101, 100),
      ]),
    ).toBe(0.04);

    expect(
      inferVolatilityThreshold([
        point(0, "2024-01-01", 100, 100),
        point(1, "2024-02-01", 101, 100),
      ]),
    ).toBe(0.08);
  });

  it("slows down volatile or rank-changing segments and speeds up flat segments", () => {
    const segments = buildNeonTempoSegments(
      [
        point(0, "2024-01-01", 100, 90),
        point(1, "2024-02-01", 100.6, 90.2),
        point(2, "2024-03-01", 117, 90.5),
        point(3, "2024-04-01", 118, 130),
      ],
      ["left", "right"],
      0.08,
    );

    expect(segments[0]?.multiplier).toBe(3);
    expect(segments[0]?.classification).toBe("fast-forward");
    expect(segments[1]?.multiplier).toBe(0.5);
    expect(segments[1]?.classification).toBe("slow-motion");
    expect(segments[2]?.rankChanged).toBe(true);
    expect(segments[2]?.multiplier).toBe(0.5);
  });

  it("creates 0.5 second rank flash events when positions change", () => {
    const events = buildNeonRankFlashEvents(
      [
        point(0, "2024-01-01", 100, 90),
        point(1, "2024-02-01", 80, 110),
      ],
      ["left", "right"],
    );

    expect(events).toEqual([
      { assetId: "left", durationMs: 500, pointIndex: 1 },
      { assetId: "right", durationMs: 500, pointIndex: 1 },
    ]);
  });

  it("lerps the camera toward a clamped log-domain target", () => {
    const target = getTargetNeonCameraDomain([0.4, 1, 8]);
    expect(target.min).toBe(0.55);
    expect(target.max).toBeCloseTo(9.2);

    const next = lerpNeonCameraDomain({ max: 2, min: 0.8 }, target, 0.12);
    expect(next.min).toBeCloseTo(0.77);
    expect(next.max).toBeCloseTo(2.864);
  });

  it("chooses the best supported MediaRecorder mime type in priority order", () => {
    expect(
      chooseNeonMediaRecorderMimeType((mimeType) => mimeType === "video/webm;codecs=vp8"),
    ).toEqual({ extension: "webm", mimeType: "video/webm;codecs=vp8" });

    expect(
      chooseNeonMediaRecorderMimeType((mimeType) => mimeType === "video/mp4"),
    ).toEqual({ extension: "mp4", mimeType: "video/mp4" });

    expect(chooseNeonMediaRecorderMimeType(() => false)).toBeNull();
  });
});
