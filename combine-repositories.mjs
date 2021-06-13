#!/usr/bin/env zx

const newRootRepo = `gravitee-repositories`;
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

const branchesExceptMaster = [`3.9.x`, `3.5.x`];
const branches = [`master`, ...branchesExceptMaster];

await $`rm -rf ${newRootRepo}`;
await $`mkdir ${newRootRepo}`;

cd(`${newRootRepo}/`);
await $`git init`;
await $`git commit --allow-empty -m "chore: init monorepo"`;

for (const branch of branchesExceptMaster) {
  await $`git checkout -b ${branch}`;
  await $`git commit --allow-empty -m "chore: create ${branch} branch"`;
}

for (const branch of branches) {
  await $`git checkout ${branch}`;

  for (const repoToMerge of reposToMerge) {
    let branchToMerge = branch;
    try {
      await $`git branch -a  | grep remotes/${repoToMerge}/${branch}`;
    } catch (e) {
      branchToMerge = "master";
    }

    await $`git remote add ${repoToMerge} https://github.com/gravitee-io/${repoToMerge}.git`;
    await $`git fetch --all`;
    await $`git merge ${repoToMerge}/${branchToMerge} --allow-unrelated-histories`;

    await $`mkdir ${repoToMerge}`;

    for (const fileOrDirectory of filesOrDirectoriesToExcludeDuringCopy) {
      await $`rm -rf ${fileOrDirectory}`;
    }

    let isInterestingData = (fileOrDirectory) =>
      fileOrDirectory !== ".git" && !reposToMerge.includes(fileOrDirectory);

    let folderData = await fs.readdir(`${newRootRepo}`);
    let dataToMove = folderData.filter(isInterestingData);
    for (const fileOrDirectory of dataToMove) {
      await $`mv ${fileOrDirectory} ${repoToMerge}`;
    }

    await $`git add -A`;
    await $`git commit -m "chore: move ${repoToMerge} to its own directory"`;
    await $`git remote remove ${repoToMerge}`;
  }
}
