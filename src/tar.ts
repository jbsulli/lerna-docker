import { Readable } from "stream";

const FILE_MODE_MASK = parseInt("7777", 8);
const USTAR_MAGIC = Buffer.from("ustar\u0000", "binary");
const USTAR_VERSION = Buffer.from("00", "binary");
const ZEROS = "0000000000 \u0000";

enum TarType {
  DIRECTORY = "5",
  FILE = "0",
  HARD_LINK = "1",
  SYMBOLIC_LINK = "2",
}

interface ITarFileCommon {
  accessed?: Date;
  created?: Date;
  deviceMajor?: number;
  deviceMinor?: number;
  groupId?: number;
  groupName?: string;
  mode?: number;
  prefix?: string;
  userId?: number;
  userName?: string;
}

interface ITarFileHeader extends ITarFileCommon {
  link?: string;
  modified?: Date;
  name: string;
  size?: number;
  type?: TarType;
}

interface ITarFileSource extends ITarFileHeader {
  src: () => string | Buffer;
}

interface ITarFileStream extends ITarFileHeader {
  stream: () => ReadableStream;
}

// add glob, directory, symlink

type TarFileSource = ITarFileSource | ITarFileStream;
type TarSource = TarFileSource;

function isTarFileSource(src: TarSource): src is ITarFileSource {
  return "src" in src;
}

const getChecksum = (buf: Buffer) => {
  let sum = 8 * 32;
  for (let i = 0; i < 148; i++) sum += buf[i];
  for (let j = 156; j < 512; j++) sum += buf[j];
  return sum;
};

const encodeString = (str: string, name: string, bytes = 100): Buffer => {
  const len = Buffer.byteLength(str);

  if (len !== str.length) {
    throw new Error(`${name} must be ascii [${str}]`);
  }

  if (len >= bytes) {
    throw new Error(`${name} too long [${len}>=${bytes}]`);
  }

  const buf = Buffer.alloc(bytes);
  buf.write(str);

  return buf;
};

const encodeFileMode = (mode: number): Buffer => {
  if (mode !== (mode & FILE_MODE_MASK)) {
    throw new Error(`File mode is invalid [${mode}]`);
  }
  const str = mode.toString(10);

  if (str.split("").some((c) => c < "0" || c > "7")) {
    throw new Error(`File mode is invalid [${mode}]`);
  }

  return encodeNumber(parseInt(str, 10), "File mode", 8);
};

const encodeNumber = (val: number, name: string, bytes = 8): Buffer => {
  const allowedBytes = bytes - 1;
  const num = Buffer.from(val.toString(), "ascii");
  const len = Buffer.byteLength(num);

  if (len > allowedBytes) {
    throw new Error(`${name} is too big [${val} > ${8 ** allowedBytes}]`);
  }

  const buf = Buffer.from(ZEROS.substr(12 - bytes));

  if (len === allowedBytes) {
    num.copy(buf, 0);
  } else {
    num.copy(buf, allowedBytes - 1 - len);
  }

  return buf;
};

const encodeTime = (time: Date, name: string, bytes = 12): Buffer => {
  const ts = Math.floor(time.getTime() / 1000);
  return encodeNumber(ts, name, bytes);
};

const encodeType = (type: TarType): Buffer => {
  switch (type) {
    case TarType.FILE:
    case TarType.DIRECTORY:
    case TarType.HARD_LINK:
    case TarType.SYMBOLIC_LINK:
      break;
    default:
      throw new Error(`Unsupported type ${type}`);
  }
  return Buffer.from(type, "ascii");
};

const encodeHeader = (header: ITarFileHeader): Buffer => {
  const buf = Buffer.alloc(512);
  const {
    accessed = new Date(),
    created = new Date(),
    deviceMajor = 0,
    deviceMinor = 0,
    groupId = 0,
    groupName,
    link,
    mode = 644,
    modified = new Date(),
    name,
    prefix,
    size: sizeDecimal,
    type = TarType.FILE,
    userId = 0,
    userName,
  } = header;

  const write = (start: number, val: Buffer) => val.copy(buf, start);

  const size = parseInt(sizeDecimal.toString(8), 10);

  write(0, encodeString(name, "Name", 100));
  write(100, encodeFileMode(mode));
  write(108, encodeNumber(userId, "Userid", 8));
  write(116, encodeNumber(groupId, "Groupid", 8));
  write(124, encodeNumber(size, "File size", 12));
  write(136, encodeTime(modified, "Modified time", 12));
  write(156, encodeType(type));
  if (link) write(157, encodeString(link, "Link", 100));
  write(257, USTAR_MAGIC);
  write(263, USTAR_VERSION);
  if (userName) write(265, encodeString(userName, "User name", 32));
  if (groupName) write(297, encodeString(groupName, "Group name", 32));
  write(329, encodeNumber(deviceMajor, "Device major", 8));
  write(337, encodeNumber(deviceMinor, "Device minor", 8));
  if (prefix) write(345, encodeString(prefix, "Prefix", 131));
  write(476, encodeTime(accessed, "Access time", 12));
  write(488, encodeTime(created, "Created time", 12));

  const checksum = getChecksum(buf);

  write(148, encodeNumber(parseInt(checksum.toString(8), 10), "Checksum", 8));

  return buf;
};

// const tar = new Transform({
//   transform(chunk, encoding, callback) {},
// });

const getNextTarSource = (files: Iterable<TarSource>) => {
  const iterate = files[Symbol.iterator]();

  const getNext = (): TarSource | undefined => {
    const next = iterate.next();
    if (next.done) return undefined;
    return next.value;
  };

  return getNext;
};

class Tar extends Readable {
  public promise: Promise<void>;
  private currentFile: TarSource | undefined;
  private getNext: () => TarSource | undefined;
  private resolve: () => void;
  private reject: (err) => void;

  constructor(files: Iterable<TarSource>) {
    super();
    this.promise = new Promise<void>((resolve, reject) => {
      this.getNext = getNextTarSource(files);
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  _read() {
    if (!this.currentFile) {
      this.currentFile = this.getNext();

      if (!this.currentFile) {
        // we're done!
        this.push(Buffer.alloc(1024));
        this.push(null);
        return;
      }

      if (isTarFileSource(this.currentFile)) {
        const { src, ...header } = this.currentFile;
        const bodyBytes = Buffer.from(src());
        const size = Buffer.byteLength(bodyBytes);
        const pad = size % 512;
        const buf = Buffer.concat([
          encodeHeader({ ...header, size, type: TarType.FILE }),
          Buffer.from(bodyBytes),
          Buffer.alloc(pad ? 512 - pad : 0),
        ]);
        this.push(buf);
        this.currentFile = undefined;
        return;
      }

      throw new Error("Unhandled");
    }
  }
}

const tar = (files: Iterable<TarSource>): Tar => {
  return new Tar(files);
};

export default tar;

export const testables = {
  encodeFileMode,
  encodeNumber,
};
