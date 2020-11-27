import readFile from "./read-file";

const readJsonFile = async <T = unknown>(
  filename: string,
  encoding = "utf8"
): Promise<T> => {
  const jsonStr = await readFile(filename, encoding);
  return JSON.parse(jsonStr);
};

export default readJsonFile;
