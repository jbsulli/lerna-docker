import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { createGunzip } from "zlib";

const gunzip = (
  sourceFilename: string,
  targetFilename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const source = createReadStream(sourceFilename);
    const dest = createWriteStream(targetFilename);
    const gzip = createGunzip();

    pipeline(source, gzip, dest, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

export default gunzip;
