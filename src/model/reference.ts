import { isAnchored } from "#/locate.js";

export interface ReferenceInit {
  text: string;
  resource?: string;
  /** UTF-16 index of the text in the resource, serialized formats count code points. */
  offset?: number;
}

/** Text span of a resource that an atom node is based on. */
export class Reference {
  readonly text: string;
  readonly resource?: string;
  /** UTF-16 index of the text in the resource, like JavaScript string indices. */
  readonly offset?: number;

  constructor(init: ReferenceInit) {
    this.text = init.text;
    this.resource = init.resource;
    this.offset = init.offset;
  }

  /** The start and end index of the text in the source, if it is found at its offset. */
  span(source: string): readonly [start: number, end: number] | undefined {
    const { text, offset } = this;

    return isAnchored(source, text, offset) ? [offset, offset + text.length] : undefined;
  }
}
