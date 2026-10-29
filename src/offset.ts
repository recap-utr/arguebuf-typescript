// Serialized formats count offsets in code points, JavaScript indexes strings in UTF-16 code units.

/** Conversion of the offsets of one text. */
export interface Offsets {
  /** UTF-16 index of a code point offset. */
  toUtf16(codePoints: number): number;
  /** Code point offset of a UTF-16 index. */
  toCodePoints(index: number): number;
}

const SURROGATE = /[\uD800-\uDFFF]/;
const identity: Offsets = { toUtf16: (offset) => offset, toCodePoints: (index) => index };
// the references of a graph point to few resource texts
const converters = new Map<string, Offsets>();
const CACHE_SIZE = 8;

/** Lookup tables of both directions, built in one pass over the text. */
function tables(text: string): Offsets {
  const indices: number[] = [];
  const counts = new Uint32Array(text.length + 1);
  let index = 0;

  for (const char of text) {
    indices.push(index);
    counts[index] = indices.length - 1;
    // an index inside a surrogate pair counts the pair, like slicing the text there
    counts[index + 1] = indices.length;
    index += char.length;
  }

  const total = indices.length;
  counts[text.length] = total;

  return {
    toUtf16: (offset) => (offset < total ? indices[offset] : text.length + offset - total),
    toCodePoints: (position) =>
      position <= text.length ? counts[position] : total + position - text.length,
  };
}

/** Offset conversion of the text, the identity unless it contains characters beyond the BMP. */
export function offsets(text: string): Offsets {
  let converter = converters.get(text);

  if (converter === undefined) {
    converter = SURROGATE.test(text) ? tables(text) : identity;
    converters.set(text, converter);

    const [oldest] = converters.keys();

    if (converters.size > CACHE_SIZE && oldest !== undefined) {
      converters.delete(oldest);
    }
  }

  return converter;
}
