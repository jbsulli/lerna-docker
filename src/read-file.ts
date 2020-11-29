import { readFile as fsReadFile } from "fs";

async function readFile(fileName: string): Promise<Buffer>;
async function readFile(fileName: string, encoding: string): Promise<string>;
async function readFile(
  fileName: string,
  encoding?: string
): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    fsReadFile(fileName, encoding, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
}

export default readFile;
