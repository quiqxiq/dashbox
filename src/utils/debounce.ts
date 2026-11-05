export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs = 200,
): (...args: A) => void {
  let timer: number | null = null;

  return (...args: A) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}
