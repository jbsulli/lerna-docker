import { exec } from "child_process";

interface ILernaPackage {
  location: string;
  name: string;
  private: boolean;
  version: string;
}

const getLernaPackages = async (): Promise<ILernaPackage[]> => {
  return new Promise((resolve, reject) => {
    exec("npx lerna list -a --json", (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const packages = JSON.parse(stdout);
        resolve(packages);
      } catch (err) {
        reject(err);
      }
    });
  });
};

export default getLernaPackages;
