import { join as pathJoin } from "path";

import getLernaConfig from "./get-lerna-config";
import getLernaData from "./get-lerna-data";
import getPackageConfig from "./get-package-config";
import makeDirectory from "./make-directory";
import writeJsonFile from "./write-json-file";

const args = process.argv.slice(2);

const run = async () => {
  const lernaConfig = await getLernaConfig();

  if (!lernaConfig) {
    console.error("Not a lerna directory");
    return;
  }

  const targetPackage = args[0];
  const cwd = process.cwd();
  const targetDir = pathJoin(cwd, ".dist", targetPackage);

  const targetFile = (...pathSegments: string[]) =>
    pathJoin(targetDir, ...pathSegments);

  const [packages] = await Promise.all([
    getLernaData(targetPackage),
    makeDirectory(targetDir),
  ]);

  console.log("%O", packages);

  await Promise.all([
    writeJsonFile(targetFile("lerna.json"), {
      ...lernaConfig,
      useWorkspaces: true,
    }),
    writeJsonFile(targetFile("package.json"), {
      devDependencies: { lerna: "^3.22.1" },
      private: true,
      workspaces: lernaConfig.packages,
    }),
    ...packages.map(async (pkg) => {
      const [depPackageJson] = await Promise.all([
        getPackageConfig(pkg.path),
        makeDirectory(targetFile(pkg.path)),
      ]);
      await writeJsonFile(targetFile(pkg.path, "package.json"), depPackageJson);
    }),
  ]);

  // const packageConfig = await getPackageConfig();

  // console.log("lerna: %O", lernaConfig);
};

run();

// read lerna file
// get lerna map
// find and copy all package.json files
// add yarn workspaces to package.json
