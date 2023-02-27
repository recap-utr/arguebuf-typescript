export interface ReferenceConstructor {
  resource?: string;
  offset?: number;
  text: string;
}

export interface ReferenceInterface {
  resource?: string;
  offset?: number;
  text: string;
}

export class Reference implements ReferenceInterface {
  readonly resource?: string;
  offset?: number;
  text: string;

  constructor(data: ReferenceConstructor) {
    this.resource = data?.resource;
    this.offset = data?.offset;
    this.text = data.text;
  }
}
