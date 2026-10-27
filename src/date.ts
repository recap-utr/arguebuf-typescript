import { create } from "@bufbuild/protobuf";
import { type Timestamp, TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Temporal } from "temporal-polyfill";

// Each format has one explicit pattern, naive timestamps are read as UTC and all output is UTC.
// Missing input yields undefined, malformed input throws a RangeError.

const NANOS_PER_SECOND = 1_000_000_000n;
// Mirror Python's strptime: one or two digits per field and any whitespace for a space
const AIF_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})\s+(?<hour>\d{1,2}):(?<minute>\d{1,2}):(?<second>\d{1,2})$/;
const OVA_PATTERN =
  /^(?<day>\d{1,2})\/(?<month>\d{1,2})\/(?<year>\d{4})\s+-\s+(?<hour>\d{1,2}):(?<minute>\d{1,2}):(?<second>\d{1,2})$/;
const OVA_DATE_PATTERN = /^(?<day>\d{1,2})\/(?<month>\d{1,2})\/(?<year>\d{4})$/;

export function now(): Temporal.Instant {
  return Temporal.Now.instant();
}

function parsePattern(
  text: string | undefined | null,
  pattern: RegExp,
): Temporal.Instant | undefined {
  if (!text) {
    return undefined;
  }

  const groups = pattern.exec(text)?.groups;

  if (groups === undefined) {
    throw new RangeError(`Invalid date '${text}', expected the pattern ${pattern.source}.`);
  }

  const { year, month, day, hour = "0", minute = "0", second = "0" } = groups;

  return Temporal.PlainDateTime.from(
    {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
    },
    { overflow: "reject" },
  )
    .toZonedDateTime("UTC")
    .toInstant();
}

/** Parse an AIF timestamp (`YYYY-MM-DD HH:mm:ss`). */
export function parseAif(text: string | undefined | null): Temporal.Instant | undefined {
  return parsePattern(text, AIF_PATTERN);
}

/** Parse an OVA timestamp (`DD/MM/YYYY - HH:mm:ss`). */
export function parseOva(text: string | undefined | null): Temporal.Instant | undefined {
  return parsePattern(text, OVA_PATTERN);
}

/** Parse an OVA date (`DD/MM/YYYY`) as midnight. */
export function parseOvaDate(text: string | undefined | null): Temporal.Instant | undefined {
  return parsePattern(text, OVA_DATE_PATTERN);
}

/** Parse an ISO 8601 timestamp, honoring an offset or a time zone annotation if present. */
export function parseIso(text: string | undefined | null): Temporal.Instant | undefined {
  if (!text) {
    return undefined;
  }

  return text.includes("[")
    ? Temporal.ZonedDateTime.from(text).toInstant()
    : Temporal.ZonedDateTime.from(`${text}[UTC]`, { offset: "use" }).toInstant();
}

/** Format as AIF timestamp (`YYYY-MM-DD HH:mm:ss`) in UTC. */
export function formatAif(value: Temporal.Instant): string {
  // an instant is formatted in UTC with a trailing `Z`
  return value.toString({ smallestUnit: "second" }).slice(0, -1).replace("T", " ");
}

export function fromProtobuf(timestamp: Timestamp | undefined): Temporal.Instant | undefined {
  return timestamp === undefined
    ? undefined
    : Temporal.Instant.fromEpochNanoseconds(
        timestamp.seconds * NANOS_PER_SECOND + BigInt(timestamp.nanos),
      );
}

export function toProtobuf(value: Temporal.Instant): Timestamp {
  const total = value.epochNanoseconds;
  const nanos = ((total % NANOS_PER_SECOND) + NANOS_PER_SECOND) % NANOS_PER_SECOND;

  return create(TimestampSchema, {
    seconds: (total - nanos) / NANOS_PER_SECOND,
    nanos: Number(nanos),
  });
}
