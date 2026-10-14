export interface PauseInterval {
  heldAt: number;
  resumedAt?: number | null;
}

export function calculateActiveDurationSeconds(
  startedAt: number | null | undefined,
  endedAt: number | null | undefined,
  pauses: readonly PauseInterval[],
): number | null {
  if (startedAt == null || endedAt == null) return null;

  const pausedMilliseconds = pauses.reduce((total, pause) => {
    const overlapStart = Math.max(startedAt, pause.heldAt);
    const overlapEnd = Math.min(endedAt, pause.resumedAt ?? endedAt);
    return total + Math.max(0, overlapEnd - overlapStart);
  }, 0);

  return Math.max(
    0,
    Math.round((endedAt - startedAt - pausedMilliseconds) / 1000),
  );
}
