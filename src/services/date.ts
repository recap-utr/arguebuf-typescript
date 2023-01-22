import { Timestamp } from "@bufbuild/protobuf";
import dayjs from "dayjs";

export type DateType = dayjs.Dayjs;

export function now(): DateType {
  return dayjs();
}

export function parse(dateString: string, format: string): DateType {
  return dayjs(dateString, format);
}

export function format(data: DateType, format: string): string {
  return dayjs(data).format(format);
}

export function fromProtobuf(timestamp: Timestamp | undefined): DateType {
  if (timestamp !== undefined) {
    return dayjs(timestamp.toDate());
  }

  return now();
}

export function toProtobuf(date: DateType): Timestamp {
  return Timestamp.fromDate(date.toDate());
}
