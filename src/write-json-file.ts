import writeFile from "./write-file";

const writeJsonFile = async <T>(path: string, data: T): Promise<void> => {
  const json = JSON.stringify(data, null, 2);
  await writeFile(path, json);
};

export default writeJsonFile;
