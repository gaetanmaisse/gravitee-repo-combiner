/**
 * @param {string?} path
 * @return {Promise<Array<string>>}
 */
export async function listFilesOrDirectories(path) {
  const directoryToCheck = path || (await $`pwd`).stdout.replace("\n", "");
  return await fs.readdir(directoryToCheck);
}

/**
 * @param {string} path
 * @return {Promise<boolean>}
 */
export async function fileOrDirectoryExist(path) {
  try {
    await fs.access(path);
    return true;
  } catch (e) {
    return false;
  }
}
