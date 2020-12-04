import testTar from "./utils/test-tar";

testTar(__filename, [
  {
    accessed: new Date(1606630274235),
    created: new Date(1606630291815),
    gid: 1750,
    modified: new Date(1606630291815),
    name:
      "thisisareallystupidlylongfilenamethatshouldneverbeusedasafilenamebutireallymustknowwhathappensifiusethisreallylongfilenamedothingsbreakdoesitworkwilltheuniverseforeverhatemeorwillisimplynotbeabletocreateatarfilewiththisreallylongnamewewillseeiguessmanitis",
    src: () =>
      "thisisareallystupidlylongfilenamethatshouldneverbeusedasafilenamebutireallymustknowwhathappensifiusethisreallylongfilenamedothingsbreakdoesitworkwilltheuniverseforeverhatemeorwillisimplynotbeabletocreateatarfilewiththisreallylongnamewewillseeiguessmanitis\n      ",
    uid: 1750,
    userName: "jbsulli",
  },
]);
