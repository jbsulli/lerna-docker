import { Readable } from "stream";

import testTar from "./utils/test-tar";

const src = () =>
  new Readable({
    read() {
      this.push("Hello world!");
      this.push(null);
    },
  });

testTar(__filename, [
  {
    accessed: new Date(1607152882000),
    created: new Date(1607152885000),
    deviceMajor: 0,
    deviceMinor: 0,
    gid: 1750,
    mode: 644,
    modified: new Date(1607152885000),
    name: "hello-world.txt",
    size: 12,
    src,
    uid: 1750,
    userName: "jbsulli",
  },
]);
