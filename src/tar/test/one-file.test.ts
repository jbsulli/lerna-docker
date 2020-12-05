import testTar from "./utils/test-tar";

testTar(__filename, [
  {
    accessed: new Date(1606520061000),
    created: new Date(1606408871000),
    gid: 1750,
    modified: new Date(1606408871000),
    name: "test.js",
    src: () => 'console.log("Hello world!");\n',
    uid: 1750,
    userName: "jbsulli",
  },
]);
