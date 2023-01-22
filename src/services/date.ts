import { Timestamp } from "@bufbuild/protobuf";
import dayjs from "dayjs";

export type DateType = Date;

export function now(): DateType {
  return new Date();
}

export function parse(dateString: string, format: string): DateType {
  return dayjs(dateString, format).toDate();
}

export function format(data: DateType, format: string): string {
  return dayjs(data).format(format);
}

export function fromProtobuf(timestamp: Timestamp | undefined): DateType {
  if (timestamp !== undefined) {
    return timestamp.toDate();
  }

  return now();
}

export function toProtobuf(date: DateType): Timestamp {
  return Timestamp.fromDate(date);
}
