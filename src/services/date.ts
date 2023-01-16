import { Timestamp } from "@bufbuild/protobuf";
import dayjs from "dayjs";

export function now(): string {
  return dayjs().toJSON();
}

export function parse(dateString: string, format: string): string {
  return dayjs(dateString, format).toJSON();
}

export function format(dateJson: string, format: string): string {
  return dayjs(dateJson).format(format);
}

export function fromProtobuf(timestamp: Timestamp | undefined): string {
  if (timestamp !== undefined) {
    return dayjs(timestamp.toDate()).toJSON();
  }

  return now();
}

export function toProtobuf(dateJson: string): Timestamp {
  return Timestamp.fromDate(dayjs(dateJson).toDate());
}
