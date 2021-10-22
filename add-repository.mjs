#!/usr/bin/env zx

import {
  addRemote,
  checkoutBranch,
  commitEverything,
  initBranch,
  removeRemote,
} from "./src/git-helper.mjs";
import { listFilesOrDirectories } from "./src/fs-helper.mjs";

const reposToMerge = {
  "3.5.x": {
   "gravitee-portal-webui": "3.5.x",
  },
  // "3.10.x": {
  //   "gravitee-portal-webui": "3.10.x",
  // },
  // "3.11.x": {
  //   "gravitee-portal-webui": "3.11.x",
  // },
  // "3.12.x": {
  //   "gravitee-portal-webui": "3.12.x",
  // },
  // master: {
  //   "gravitee-portal-webui": "master",
  // },
};

const filesOrDirectoriesToExcludeDuringCopy = [`appveyor.yml`, `Jenkinsfile`];

const branches = Object.keys(reposToMerge);

let workingDir = `tmp`;

await $`rm -rf ../${workingDir}/gravitee-api-management`;
await $`mkdir -p ../${workingDir}`;

// ⚠️ Changes the current working directory, all other commands will be run in this folder
cd(`../${workingDir}`);
await $`git clone https://github.com/gravitee-io/gravitee-api-management.git`;

// ⚠️ The origin pwd is always this script dir
cd(`../${workingDir}/gravitee-api-management`);

// Then merge the branches of the different repository in the monorepo
for (const branch of branches) {
  await checkoutBranch(branch);
  await initBranch(`merge-${branch}`);

  const reposToMergeForThisBranch = Object.keys(reposToMerge[branch]);

  for (const repoToMerge of reposToMergeForThisBranch) {
    let currentData = await listFilesOrDirectories();

    let branchToMerge = reposToMerge[branch][repoToMerge];
    await addRemote(repoToMerge);

    await $`git fetch --all`;
    await $`git merge ${repoToMerge}/${branchToMerge} --allow-unrelated-histories -X ours`;

    await $`mkdir -p ${repoToMerge}`;

    // Remove files we don't want to keep as part of the monorepo because they are not relevant anymore or would be
    // duplicated
    for (const fileOrDirectory of filesOrDirectoriesToExcludeDuringCopy) {
      await $`rm -rf ${fileOrDirectory}`;
    }

    let folderData = await listFilesOrDirectories();
    // Do not move .git folder or any previously merged repository
    let dataToMove = folderData.filter(
      (fileOrDirectory) =>
        ![".git", repoToMerge, ...currentData].includes(fileOrDirectory)
    );
    for (const fileOrDirectory of dataToMove) {
      await $`mv ${fileOrDirectory} ${repoToMerge}`;
    }
    await commitEverything(`chore: move ${repoToMerge} to its own directory`);
    await removeRemote(repoToMerge);
  }
}
