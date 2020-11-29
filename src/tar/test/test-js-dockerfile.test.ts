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
  {
    accessed: new Date(1606520145000),
    created: new Date(1606408855000),
    gid: 1750,
    modified: new Date(1606408855000),
    name: "Dockerfile",
    src: () =>
      'FROM node:14.15.0-alpine\n\nCOPY ./test.js ./\n\nCMD ["node", "test.js"]\n',
    uid: 1750,
    userName: "jbsulli",
  },
]);
