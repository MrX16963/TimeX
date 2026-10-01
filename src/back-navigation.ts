export const DOUBLE_BACK_EXIT_WINDOW_MS = 2000;

export function isDoubleBackPress(now: number, lastPress: number | null): boolean {
  return (
    lastPress !== null &&
    now >= lastPress &&
    now - lastPress <= DOUBLE_BACK_EXIT_WINDOW_MS
  );
}
