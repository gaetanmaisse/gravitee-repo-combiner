#!/usr/bin/env zx

import {
  addRemote,
  checkoutBranch,
  commitEverything,
  doesBranchExistsOnRemote,
  initBranch,
  initGitRepo,
  removeRemote,
} from "./src/git-helper.mjs";
import { fileOrDirectoryExist, listFilesOrDirectories, } from "./src/fs-helper.mjs";

const newRootRepo = `gravitee-apim-repository`;
const reposToMerge = [
  `gravitee-repository`,
  `gravitee-repository-test`,
  `gravitee-repository-mongodb`,
  `gravitee-repository-jdbc`,
  `gravitee-repository-redis`,
  `gravitee-repository-gateway-bridge-http`,
  `gravitee-repository-hazelcast`,
];

const filesOrDirectoriesToExcludeDuringCopy = [
  `.gitignore`,
  `appveyor.yml`,
  `LICENSE.txt`,
  `.circleci`,
  `CONTRIBUTING.adoc`,
  `Jenkinsfile`,
];

const patchDirPath = `${__dirname}/patches`;

const branches = [`master`, `3.9.x`, `3.5.x`];

await $`rm -rf ../tmp/${newRootRepo}`;
await $`mkdir -p ../tmp/${newRootRepo}`;

// ⚠️ Changes the current working directory, all other commands will be run in this folder
cd(`../tmp/${newRootRepo}`);

await initGitRepo();

// First create the branches from the first empty commit
for (const branch of branches) {
  await initBranch(branch);
}

// Then merge the branches of the different repository in the monorepo
for (const branch of branches) {
  await checkoutBranch(branch);

  for (const repoToMerge of reposToMerge) {
    const branchToMerge = (await doesBranchExistsOnRemote(repoToMerge, branch))
      ? branch
      : "master";

    await addRemote(repoToMerge);

    await $`git fetch --all`;
    await $`git merge ${repoToMerge}/${branchToMerge} --allow-unrelated-histories`;

    await $`mkdir -p ${newRootRepo}/${repoToMerge}`;

    // Remove files we don't want to keep as part of the monorepo because they are not relevant anymore or would be
    // duplicated
    for (const fileOrDirectory of filesOrDirectoriesToExcludeDuringCopy) {
      await $`rm -rf ${fileOrDirectory}`;
    }

    let folderData = await listFilesOrDirectories();
    // Do not move .git folder or any previously merged repository
    let dataToMove = folderData.filter((fileOrDirectory) =>
        ![".git", newRootRepo].includes(fileOrDirectory));
    for (const fileOrDirectory of dataToMove) {
      await $`mv ${fileOrDirectory} ${newRootRepo}/${repoToMerge}`;
    }
    await commitEverything(
      `chore: move ${newRootRepo}/${repoToMerge} to its own directory`
    );
    await removeRemote(repoToMerge);
  }

  // Check for Git patch to apply
  for (const branch of branches) {
    const patchDirForBranch = `${patchDirPath}/${branch}`;
    if (await fileOrDirectoryExist(patchDirForBranch)) {
      // Apply patches
      let patches = await listFilesOrDirectories(patchDirForBranch);
      for (const patch of patches) {
        await $`git apply ${patchDirForBranch}/${patch}`;
      }

      await commitEverything(
        `chore: applied manual changes via a patch file on branch ${branch}`
      );
    }
  }
}
