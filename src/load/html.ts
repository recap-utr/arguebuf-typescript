// Plain text and spans of the highlighted texts of OVA and xAIF.
import { type DefaultTreeAdapterTypes, parseFragment } from "parse5";

/** Text of a `<span>` element and its UTF-16 offset in the parsed text. */
export interface Span {
  readonly text: string;
  readonly offset: number;
}

interface Range {
  readonly start: number;
  end: number;
}

/**
 * Get the plain text of an HTML fragment and its spans by their `id`.
 *
 * Character references are decoded, `<br>` becomes a newline,
 * and other elements only contribute the text of their children.
 * The first `id` attribute of a span is used, spans with an empty id are ignored,
 * and the first span in document order wins for duplicate ids.
 */
export function parseHtml(html: string): [string, Map<string, Span>] {
  const chunks: string[] = [];
  const ranges = new Map<string, Range>();
  let length = 0;

  const add = (chunk: string) => {
    chunks.push(chunk);
    length += chunk.length;
  };

  const stack: (DefaultTreeAdapterTypes.ChildNode | Range)[] =
    parseFragment(html).childNodes.toReversed();

  for (let item = stack.pop(); item !== undefined; item = stack.pop()) {
    if (!("nodeName" in item)) {
      item.end = length;
    } else if ("value" in item) {
      add(item.value);
    } else if (item.nodeName === "br") {
      add("\n");
    } else if ("tagName" in item) {
      const id =
        item.nodeName === "span" ? item.attrs.find(({ name }) => name === "id")?.value : undefined;

      if (id && !ranges.has(id)) {
        const range = { start: length, end: length };
        ranges.set(id, range);
        stack.push(range);
      }

      for (const child of item.childNodes.toReversed()) {
        stack.push(child);
      }
    }
  }

  const text = chunks.join("");
  const spans = ranges
    .entries()
    .map(([id, { start, end }]) => [id, { text: text.slice(start, end), offset: start }] as const);

  return [text, new Map(spans)];
}
