import readJsonFile from "./read-json-file";

interface ILernaConfig {
  npmClient: string;
  packages: string[];
  useWorkspaces?: boolean;
  version: string;
}

const getLernaConfig = async (): Promise<ILernaConfig | undefined> => {
  try {
    return await readJsonFile("lerna.json");
  } catch (err) {
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw err;
  }
};

export default getLernaConfig;
