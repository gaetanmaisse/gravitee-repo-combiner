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
const reposToMerge =
  {
    "3.0.x": {
      "gravitee-repository": "3.0.x",
      "gravitee-repository-test": "3.0.x",
      "gravitee-repository-mongodb": "3.0.x",
      "gravitee-repository-jdbc": "3.0.x",
      "gravitee-repository-redis": "3.0.x",
      "gravitee-repository-gateway-bridge-http": "3.0.x",
      // "gravitee-repository-hazelcast": "master",
    },
    "3.5.x": {
      "gravitee-repository": "3.5.x",
      "gravitee-repository-test": "3.5.x",
      "gravitee-repository-mongodb": "3.5.x",
      "gravitee-repository-jdbc": "3.5.x",
      "gravitee-repository-redis": "3.2.x",
      "gravitee-repository-gateway-bridge-http": "3.5.x",
      "gravitee-repository-hazelcast": "3.4.x",
    },
    "3.8.x": {
      "gravitee-repository": "3.8.x",
      "gravitee-repository-test": "3.8.x",
      "gravitee-repository-mongodb": "3.8.x",
      "gravitee-repository-jdbc": "3.8.x",
      "gravitee-repository-redis": "3.2.x",
      "gravitee-repository-gateway-bridge-http": "3.8.x",
      "gravitee-repository-hazelcast": "3.4.x",
    },
    "3.9.x": {
      "gravitee-repository": "3.9.x",
      "gravitee-repository-test": "3.9.x",
      "gravitee-repository-mongodb": "3.9.x",
      "gravitee-repository-jdbc": "3.9.x",
      "gravitee-repository-redis": "3.2.x",
      "gravitee-repository-gateway-bridge-http": "3.9.x",
      "gravitee-repository-hazelcast": "3.4.x",
    },
    "master": {
      "gravitee-repository": "master",
      "gravitee-repository-test": "master",
      "gravitee-repository-mongodb": "master",
      "gravitee-repository-jdbc": "master",
      "gravitee-repository-redis": "master",
      "gravitee-repository-gateway-bridge-http": "master",
      "gravitee-repository-hazelcast": "master",
    },
  };

const filesOrDirectoriesToExcludeDuringCopy = [
  `.gitignore`,
  `appveyor.yml`,
  `LICENSE.txt`,
  `.circleci`,
  `CONTRIBUTING.adoc`,
  `Jenkinsfile`,
];

const patchDirPath = `${__dirname}/patches`;

const branches = Object.keys(reposToMerge);

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

  const reposToMergeForThisBranch = Object.keys(reposToMerge[branch])

  for (const repoToMerge of reposToMergeForThisBranch) {
    let branchToMerge = reposToMerge[branch][repoToMerge];
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
