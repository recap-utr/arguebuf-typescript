/**
 * Cache the results of a function of a text, keeping the `size` most recently added ones.
 * Graphs refer to few texts, e.g. one resource for all atoms of a patch.
 */
export function memoize<T>(compute: (text: string) => T, size: number): (text: string) => T {
  const cache = new Map<string, T>();

  return (text) => {
    let value = cache.get(text);

    if (value === undefined) {
      value = compute(text);
      cache.set(text, value);

      const [oldest] = cache.keys();

      if (cache.size > size && oldest !== undefined) {
        cache.delete(oldest);
      }
    }

    return value;
  };
}
