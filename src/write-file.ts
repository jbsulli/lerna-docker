import { writeFile as fsWriteFile } from "fs";

const writeFile = async (
  filename: string,
  body: string | Buffer
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fsWriteFile(filename, body, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};

export default writeFile;
