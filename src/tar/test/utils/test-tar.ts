import { join as pathJoin, parse as parsePath } from "path";

import tar, { TarSource } from "../../";
import readFile from "../../../read-file";
import streamToBuffer from "../../../stream-to-buffer";
import tarHeaderFormat from "../../header-format";

const FILE_NAME = /(?:.*\/)+(.*)\.test\.ts$/;
const NUMBER_VALUE = /([0-9]+)/;
const HEADER_SIZE = tarHeaderFormat
  .slice(-1)
  .reduce((_, { offset, size }) => offset + size, 0);

const sizeField = tarHeaderFormat.find(({ name }) => name === "size");

const getSize = (buff: Buffer, fileOffset: number): number => {
  const offset = fileOffset + sizeField.offset;
  const sizeStr = buff.slice(offset, offset + sizeField.size).toString("ascii");
  const size = parseInt(sizeStr.match(NUMBER_VALUE)[1], 8);
  const pad = 512 - (size % 512);
  return size + pad;
};

const testTar = (fileName: string, entries: TarSource[]): void => {
  const tarFileName = fileName.match(FILE_NAME)[1];
  const { dir } = parsePath(fileName);

  describe(tarFileName + ".tar", () => {
    let testTar: Buffer;
    let resultTar: Buffer;
    let fileOffset = 0;
    let size = 0;

    beforeAll(async () => {
      testTar = await readFile(pathJoin(dir, tarFileName + ".tar"));
      resultTar = await streamToBuffer(tar(entries));
    });

    entries.forEach((entry) => {
      describe(entry.name, () => {
        beforeAll(() => {
          size = getSize(resultTar, fileOffset);
        });

        afterAll(() => {
          fileOffset += HEADER_SIZE + size;
        });

        tarHeaderFormat.forEach((field) => {
          it(field.name, () => {
            const offset = fileOffset + field.offset;
            const target = testTar
              .slice(offset, offset + field.size)
              .toString("hex");
            const result = resultTar
              .slice(offset, offset + field.size)
              .toString("hex");

            expect(result).toEqual(target);
          });
        });
        it("file contents", () => {
          const offset = fileOffset + HEADER_SIZE;
          const target = testTar.slice(offset, offset + size).toString("hex");
          const result = resultTar.slice(offset, offset + size).toString("hex");

          expect(result).toEqual(target);
        });
      });
    });

    describe("tar padding", () => {
      it("should match", () => {
        const offset = fileOffset;
        const target = testTar.slice(offset).toString("hex");
        const result = resultTar.slice(offset).toString("hex");

        expect(result).toEqual(target);
      });
    });
  });
};

export default testTar;
