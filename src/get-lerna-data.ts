import { relative as relativePath } from "path";

import getLernaDeps from "./get-lerna-deps";
import getLernaPackages from "./get-lerna-packages";

interface IPackageData {
  dependencies: string[];
  name: string;
  path: string;
  private: boolean;
  version: string;
}

const getLernaData = async (forPackage?: string): Promise<IPackageData[]> => {
  if (forPackage) {
    const data = await getLernaData();

    const targetPackage = data.find(({ name }) => name === forPackage);

    if (!targetPackage) {
      if (data.length) {
        console.error(
          new Error(
            `Target package [${forPackage}] not found in ${data
              .map(({ name }) => name)
              .join(",")}`
          )
        );
        return [];
      }
      console.error("No packages found");
      return [];
    }

    const keep = [targetPackage.name, ...targetPackage.dependencies];

    return data.filter(({ name }) => keep.includes(name));
  }

  const [deps, packages] = await Promise.all([
    getLernaDeps(),
    getLernaPackages(),
  ]);

  const packageNames = packages.map(({ name }) => name);

  return packages.map(({ name, version, private: isPrivate, location }) => {
    const dependencies = deps[name].filter((depName) =>
      packageNames.includes(depName)
    );
    const path = relativePath(process.cwd(), location);

    return {
      dependencies,
      name,
      path,
      private: isPrivate,
      version,
    };
  });
};

export default getLernaData;
