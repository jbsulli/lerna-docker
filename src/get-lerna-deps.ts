import { exec } from "child_process";

const getLernaDeps = async (): Promise<{
  [packageName: string]: string[];
}> => {
  return new Promise((resolve, reject) => {
    exec("npx lerna list -a --graph", (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const packageDeps = JSON.parse(stdout);
        resolve(packageDeps);
      } catch (err) {
        reject(err);
      }
    });
  });
};

export default getLernaDeps;
