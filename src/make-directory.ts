import { mkdir } from "fs";

const makeDirectory = async (path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    mkdir(path, { recursive: true }, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};

export default makeDirectory;
