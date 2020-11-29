import { format } from "util";

import tarHeaderFormat, { ITarHeaderField } from "./header-format";

const ZEROS = "0000000000 \u0000";

export enum TarEntryType {
  DIRECTORY = "5",
  FILE = "0",
  HARD_LINK = "1",
  SYMBOLIC_LINK = "2",
}

export interface ITarEntryOptions {
  accessed?: Date;
  created?: Date;
  deviceMajor?: number;
  deviceMinor?: number;
  gid?: number;
  groupName?: string;
  link?: string;
  mode?: number;
  modified?: Date;
  name: string;
  prefix?: string;
  size?: number;
  type?: TarEntryType;
  uid?: number;
  userName?: string;
}

interface ITarFieldHandler<T> {
  (value: T, field: string, bytes: number): Buffer;
}

const checksumHandler: ITarFieldHandler<Buffer> = (buf, field, bytes) => {
  let sum = 8 * 32;
  for (let i = 0; i < 148; i++) sum += buf[i];
  for (let j = 156; j < 512; j++) sum += buf[j];
  return octalHandler(sum, field, bytes);
};

const constHandler = (constValue: string): ITarFieldHandler<string> => {
  const value = Buffer.from(constValue, "ascii");
  return () => value;
};

const errorHandler = (
  message: string,
  name: string,
  ...args: Array<string | number>
) => {
  throw new Error(format(message, name, ...args));
};

const enumHandler = (...values: string[]): ITarFieldHandler<string> => {
  return (value: string, field: string) => {
    if (!values.includes(value))
      errorHandler(
        "Invalid or unsupported value used for %s [$s]",
        field,
        value
      );

    return Buffer.from(value, "ascii");
  };
};

const modeHandler: ITarFieldHandler<number> = (mode, field, bytes) => {
  if (mode > 7777) errorHandler("Invalid value used for %s [$s]", field, mode);

  const buf = Buffer.from(mode.toString(10), "ascii");

  for (const v of buf) {
    if (v < 48 || v > 55)
      errorHandler("Invalid value used for %s [$s]", field, mode);
  }

  return numberHandler(parseInt(buf.toString(), 10), field, bytes);
};

const numberHandler: ITarFieldHandler<number> = (value, field, bytes) => {
  if (isNaN(value) || value < 0) {
    errorHandler("Invalid number value %s [%s]", field, value);
  }

  const allowedBytes = bytes - 1;
  const num = Buffer.from(value.toString(), "ascii");
  const len = Buffer.byteLength(num);

  if (len > allowedBytes)
    errorHandler(
      "Value too large for %s [%s > $s]",
      field,
      value,
      8 ** allowedBytes
    );

  const buf = Buffer.from(ZEROS.substr(12 - bytes));

  if (len === allowedBytes) {
    num.copy(buf, 0);
  } else {
    num.copy(buf, allowedBytes - 1 - len);
  }

  return buf;
};

const octalHandler: ITarFieldHandler<number> = (value, field, bytes) => {
  const oct = parseInt(value.toString(8), 10);
  return numberHandler(oct, field, bytes);
};

const stringHandler: ITarFieldHandler<string> = (str, field, bytes) => {
  if (!str) {
    return Buffer.alloc(0);
  }

  const len = Buffer.byteLength(str);

  if (len !== str.length)
    errorHandler("Value must be ascii for $s [$s]", field, str);

  if (len >= bytes)
    errorHandler("Value too long for %s [%s > %s]", field, len, bytes);

  const buf = Buffer.alloc(bytes);
  if (str) buf.write(str);

  return buf;
};

const timeHandler: ITarFieldHandler<Date> = (time, field, bytes) => {
  if (!time) {
    return Buffer.alloc(0);
  }

  const ts = Math.floor(time.getTime() / 1000);
  return octalHandler(ts, field, bytes);
};

const handlers = {
  enum: enumHandler(),
  mode: modeHandler,
  number: numberHandler,
  octal: octalHandler,
  string: stringHandler,
  time: timeHandler,
  type: enumHandler(TarEntryType.FILE),
  ustarMagic: constHandler("ustar\u0000"),
  ustarVersion: constHandler("00"),
};

export const packHeader = ({
  accessed = new Date(),
  created = new Date(),
  deviceMajor = 0,
  deviceMinor = 0,
  gid = 0,
  groupName,
  link,
  mode = 644,
  modified = new Date(),
  name,
  prefix,
  size,
  type = TarEntryType.FILE,
  uid = 0,
  userName,
}: ITarEntryOptions): Buffer => {
  const buf = Buffer.alloc(512);
  const options: ITarEntryOptions = {
    accessed,
    created,
    deviceMajor,
    deviceMinor,
    gid,
    groupName,
    link,
    mode,
    modified,
    name,
    prefix,
    size,
    type,
    uid,
    userName,
  };

  let checksumField: ITarHeaderField | undefined;

  tarHeaderFormat.forEach(({ name, size, offset, type }, i) => {
    if (name === "checksum") {
      checksumField = tarHeaderFormat[i];
      return;
    }

    const handler = handlers[name] ?? handlers[type];
    const fieldBuf = handler(options[name], `${options.name}:${name}`, size);
    fieldBuf.copy(buf, offset);
  });

  if (checksumField) {
    checksumHandler(
      buf,
      `${options.name}:${checksumField.name}`,
      checksumField.size
    ).copy(buf, checksumField.offset);
  }

  return buf;
};

export const packFile = (
  src: string | Buffer,
  options: ITarEntryOptions
): Buffer => {
  const bodyBuf: Buffer =
    typeof src === "string" ? Buffer.from(src, "utf8") : src;
  const size = Buffer.byteLength(bodyBuf);
  const headBuf = packHeader({ ...options, size });
  const buf = [headBuf, bodyBuf];
  const pad = size % 512;

  if (pad !== 0) {
    buf.push(Buffer.alloc(512 - pad));
  }

  return Buffer.concat(buf);
};
