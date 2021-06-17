/**
 *
 * @param {string} defaultBranchName
 * @return {Promise<void>}
 */
export async function initGitRepo(defaultBranchName = "main") {
  await $`git init -b ${defaultBranchName}`;
  await $`git commit --allow-empty -m "chore: init repo"`;
}

/**
 *
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function initBranch(branchName ) {
  await $`git checkout -b ${branchName}`;
  await $`git commit --allow-empty -m "chore: create ${branchName} branch"`;
}

/**
 *
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function checkoutBranch(branchName) {
  await $`git checkout ${branchName}`;
}

/**
 *
 * @param {string} repo string
 * @param {string} branchName string
 * @return {Promise<boolean>}
 */
export async function doesBranchExistsOnRemote(repo, branchName ) {
  try {
    await $`git branch -a  | grep remotes/${repo}/${branchName}`;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @param {string} repo
 * @return {Promise<void>}
 */
export async function addRemote(repo) {
  await $`git remote add ${repo} https://github.com/gravitee-io/${repo}.git`;
}

/**
 *
 * @param {string} remoteName
 * @return {Promise<void>}
 */
export async function removeRemote(remoteName) {
  await $`git remote remove ${remoteName}`;
}

/**
 *
 * @param {string} commitMessage
 * @return {Promise<void>}
 */
export async function commitEverything(commitMessage) {
  await $`git add -A`;
  await $`git commit -m "${commitMessage}"`;
}
