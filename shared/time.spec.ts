import { describe, expect, it } from "vitest";
import { calculateActiveDurationSeconds } from "./time";

describe("calculateActiveDurationSeconds", () => {
  it("excludes completed holds while preserving work before and after them", () => {
    const duration = calculateActiveDurationSeconds(
      0,
      739_000,
      [{ heldAt: 481_000, resumedAt: 739_000 }],
    );

    expect(duration).toBe(481);
  });

  it("continues accumulating after a completed hold", () => {
    const duration = calculateActiveDurationSeconds(
      0,
      841_000,
      [{ heldAt: 481_000, resumedAt: 739_000 }],
    );

    expect(duration).toBe(583);
  });

  it("freezes active duration while a hold is still open", () => {
    const duration = calculateActiveDurationSeconds(
      0,
      739_000,
      [{ heldAt: 481_000 }],
    );

    expect(duration).toBe(481);
  });

  it("subtracts every pause interval intersecting a step", () => {
    const duration = calculateActiveDurationSeconds(
      100_000,
      1_000_000,
      [
        { heldAt: 200_000, resumedAt: 300_000 },
        { heldAt: 700_000, resumedAt: 800_000 },
      ],
    );

    expect(duration).toBe(700);
  });

  it("returns null when a timestamp is missing", () => {
    expect(calculateActiveDurationSeconds(0, null, [])).toBeNull();
  });
});
