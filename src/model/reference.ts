
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
}
