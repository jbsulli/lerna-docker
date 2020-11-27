import { readFile as fsReadFile } from "fs";

const readFile = async (
  filename: string,
  encoding = "utf8"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    fsReadFile(filename, encoding, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
};

export default readFile;
