import search from "approx-string-match";
import { memoize } from "#/cache.js";

/** Options of the functions that match texts approximately. */
export interface ThresholdOptions {
  /** Minimal similarity between the query and the span, from 0 to 1. */
  readonly threshold?: number;
}

export interface LocateOptions extends ThresholdOptions {
  /** Preferred offset among equally similar spans. */
  readonly near?: number;
}

/** Span of a source text, its offset is a UTF-16 index like those of JavaScript strings. */
export interface Match {
  readonly offset: number;
  readonly text: string;
  /** One minus the edit distance of the normalized texts relative to the query length. */
  readonly similarity: number;
}

export const defaultThreshold = 0.85;

const WORD = /^[\p{L}\p{N}]$/u;

interface Normalized {
  readonly text: string;
  /** UTF-16 start and end in the original text of the code point behind each code unit. */
  readonly starts: number[];
  readonly ends: number[];
}

/**
 * Reduce the text to its lowercase words separated by single spaces.
 * Letters and numbers form words, everything else separates them.
 */
function normalize(source: string): Normalized {
  let text = "";
  const starts: number[] = [];
  const ends: number[] = [];
  // the last separator before the next word, which the space stands for
  let separator: [number, number] | undefined;
  let index = 0;

  for (const codePoint of source) {
    const end = index + codePoint.length;

    if (!WORD.test(codePoint)) {
      separator = text.length > 0 ? [index, end] : undefined;
    } else {
      if (separator !== undefined) {
        text += " ";
        starts.push(separator[0]);
        ends.push(separator[1]);
        separator = undefined;
      }

      const lowered = codePoint.toLowerCase();
      text += lowered;
      starts.push(...Array<number>(lowered.length).fill(index));
      ends.push(...Array<number>(lowered.length).fill(end));
    }

    index = end;
  }

  return { text, starts, ends };
}

// the same sources are searched repeatedly, e.g. one resource for all atoms of a patch
const normalizeSource = memoize(normalize, 8);

/** The first candidate with the lowest key. */
function closest(candidates: readonly number[], key: (candidate: number) => number): number {
  return candidates.reduce((best, candidate) => (key(candidate) < key(best) ? candidate : best));
}

function exact(source: string, query: string, near: number | undefined): Match | undefined {
  const offsets: number[] = [];

  for (let index = source.indexOf(query); index !== -1; index = source.indexOf(query, index + 1)) {
    offsets.push(index);

    if (near === undefined) {
      break;
    }
  }

  return offsets.length === 0
    ? undefined
    : {
        offset: closest(offsets, (offset) => Math.abs(offset - (near ?? offset))),
        text: query,
        similarity: 1,
      };
}

function approximate(
  source: string,
  query: string,
  { threshold = defaultThreshold, near }: LocateOptions,
): Match | undefined {
  const pattern = normalize(query).text;
  const { text, starts, ends } = normalizeSource(source);

  if (pattern === "" || text === "" || threshold > 1) {
    return undefined;
  }

  const similarity = (errors: number) => 1 - errors / pattern.length;
  const maxErrors = Math.min(pattern.length - 1, Math.ceil((1 - threshold) * pattern.length));
  const distance = (start: number) =>
    near === undefined ? starts[start] : Math.abs(starts[start] - near);
  // all matches are kept, so that overlapping ones compete for the proximity preference
  const [best] = search(text, pattern, maxErrors)
    .filter(({ start, end, errors }) => start < end && similarity(errors) >= threshold)
    .toSorted(
      (a, b) =>
        a.errors - b.errors ||
        distance(a.start) - distance(b.start) ||
        a.start - b.start ||
        b.end - a.end,
    );

  if (best === undefined) {
    return undefined;
  }

  const offset = starts[best.start];

  return {
    offset,
    text: source.slice(offset, ends[best.end - 1]),
    similarity: similarity(best.errors),
  };
}

/**
 * Find the span of `source` that matches `query` best.
 *
 * Exact matches are preferred, otherwise both texts are reduced to their lowercase words
 * (case, whitespace, and punctuation are ignored) and the span with the lowest edit distance is chosen.
 * Returns undefined if the similarity is below the threshold.
 */
export function locate(
  source: string,
  query: string,
  options: LocateOptions = {},
): Match | undefined {
  if (query === "") {
    return undefined;
  }

  return exact(source, query, options.near) ?? approximate(source, query, options);
}

/** Whether `text` is found at `offset` of `source`. */
export function isAnchored(
  source: string,
  text: string,
  offset: number | undefined,
): offset is number {
  return offset !== undefined && source.startsWith(text, offset);
}
