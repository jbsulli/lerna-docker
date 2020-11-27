import { join as pathJoin } from "path";

import readJsonFile from "./read-json-file";

interface IPackageConfig {
  author?: string;
  bin?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  license?: string;
  name?: string;
  peerDependencies?: { [key: string]: string };
  repository?: string;
  scripts?: { [key: string]: string };
  version?: string;
  workspaces?: string[];
}

const getPackageConfig = async (
  subfolder?: string
): Promise<IPackageConfig | undefined> => {
  try {
    const cwd = process.cwd();
    const pkgPath = subfolder
      ? pathJoin(cwd, subfolder, "package.json")
      : pathJoin(cwd, "package.json");

    return await readJsonFile(pkgPath);
  } catch (err) {
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw err;
  }
};

export default getPackageConfig;
