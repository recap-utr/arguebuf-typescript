import { DateType, now } from "../date.js";

export interface MetadataConstructor {
  created?: DateType;
  updated?: DateType;
}

export interface MetadataInterface {
  created: DateType;
  updated: DateType;
}

export class Metadata implements MetadataInterface {
  created: DateType;
  updated: DateType;

  constructor(data?: MetadataConstructor) {
    const fallback = now();
    this.created = data?.created ?? fallback;
    this.updated = data?.updated ?? fallback;
  }

  update() {
    this.updated = now();
  }

  // toJSON() {
  //   return { ...this };
  // }

  // static fromJSON(obj: JSONObject) {
  //   const cls = new Metadata();
  //   cls.created = dateFromJSON(obj.created);
  //   cls.updated = dateFromJSON(obj.updated);

  //   return cls;
  // }
}
