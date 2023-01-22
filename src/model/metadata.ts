import { DateType, now } from "../services/date.js";

export interface Metadata {
  created: DateType;
  updated: DateType;
}

export class Metadata {
  constructor(data?: Partial<Metadata>) {
    const fallback = now();
    this.created = data?.created ?? fallback;
    this.updated = data?.updated ?? fallback;
  }

  update() {
    this.updated = now();
  }
}
