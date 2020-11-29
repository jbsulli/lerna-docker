export interface ITarHeaderField {
  name: string;
  offset: number;
  size: number;
  type: "enum" | "number" | "octal" | "string" | "time";
}

const tarHeaderFormat: ITarHeaderField[] = [
  { name: "name", offset: 0, size: 100, type: "string" },
  { name: "mode", offset: 100, size: 8, type: "number" },
  { name: "uid", offset: 108, size: 8, type: "number" },
  { name: "gid", offset: 116, size: 8, type: "number" },
  { name: "size", offset: 124, size: 12, type: "octal" },
  { name: "modified", offset: 136, size: 12, type: "time" },
  { name: "checksum", offset: 148, size: 8, type: "octal" },
  { name: "type", offset: 156, size: 1, type: "enum" },
  { name: "link", offset: 157, size: 100, type: "string" },
  { name: "ustarMagic", offset: 257, size: 6, type: "string" },
  { name: "ustarVersion", offset: 263, size: 2, type: "enum" },
  { name: "userName", offset: 265, size: 32, type: "string" },
  { name: "groupName", offset: 297, size: 32, type: "string" },
  { name: "deviceMajor", offset: 329, size: 8, type: "number" },
  { name: "deviceMinor", offset: 337, size: 8, type: "number" },
  { name: "prefix", offset: 345, size: 131, type: "string" },
  { name: "accessed", offset: 476, size: 12, type: "time" },
  { name: "created", offset: 488, size: 12, type: "time" },
  { name: "pad", offset: 500, size: 12, type: "string" },
];

export default tarHeaderFormat;
