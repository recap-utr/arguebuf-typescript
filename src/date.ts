import {
  type Timestamp,
  timestampDate,
  timestampFromDate,
} from "@bufbuild/protobuf/wkt";
import dayjs from "dayjs";

export type DateType = Date;

export function now(): DateType {
  return new Date();
}

export function parse(value: string, format: string): DateType {
  return dayjs(value, format).toDate();
}

export function format(data: DateType, format: string): string {
  return dayjs(data).format(format);
}

export function fromProtobuf(timestamp: Timestamp | undefined): DateType {
  if (timestamp !== undefined) {
    return timestampDate(timestamp);
  }

  return now();
}

export function toProtobuf(date: DateType): Timestamp {
  return timestampFromDate(date);
}

export function dateFromJSON(value: string): DateType {
  return new Date(value);
}
