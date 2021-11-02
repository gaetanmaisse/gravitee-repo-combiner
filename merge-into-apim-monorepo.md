# Merge external repository into API Monorepo

To run the script just use:
- install zx: `npm install -g zx`
- save this gist
- run `zx ./merge-into-apim-monorepo.md`

This markdown file contains a standalone script that will:
1. Ask for the repository and branch to merge into the APIM monorepo
2. Clone `gravitee-api-management` repository in `../tmp/gravitee-api-management`
3. Merge the branch into the newly cloned repository

Notes: Everything is idempotent and does not push anything on GitHub so feel free to run the script as much as you want.

## Get user inputs

- Get repo to merge into the monorepo

```js
const repoToMerge = await question('Id of the repository to merge into the monorepo (use tab to autocomplete): ', { choices: ['gravitee-gateway'] })
```

- Get the branch to merge into the monorepo

```js
const response = await fetch(`https://api.github.com/repos/gravitee-io/${repoToMerge}/branches`)
const gitHubBranches = ['master', ...(await response.json()).map(branch => branch.name)];
const branchToMerge = await question('Branch of the repo to merge into the monorepo (use tab to autocomplete): ', { choices: gitHubBranches })
```

- Get the branch to merge in

```js
let apimBranch = await question(`APIM branch to merge in (default: ${branchToMerge}): `, { choices: ['master'] })
if (apimBranch === '') {
    apimBranch = branchToMerge
}
```

## Clone and prepare the monorepo

- Create a tmp dir and clone the monorepo

```js
const tmpDir = await fs.mkdtemp(os.tmpdir());
```

- Clone the monorepo

```js
cd(tmpDir)
await $`git clone https://github.com/gravitee-io/gravitee-api-management.git`;
let workingDir = `${tmpDir}/gravitee-api-management`;
cd(workingDir)

console.log(`Merge will be done in ${workingDir}`)
```

- Checkout branch and create merge branch

```js
await $`git checkout ${apimBranch}`;
await $`git checkout -b merge-${apimBranch}`;
await $`git commit --allow-empty -m "chore: create merge-${apimBranch} branch"`;
```

- Add remote and fetch data

```js
await $`git remote add ${repoToMerge} https://github.com/gravitee-io/${repoToMerge}.git`;
await $`git fetch --all`;
```

## Merge and move new sources

```js
const currentData = await fs.readdir(workingDir)
```

- Merge and 💥

```js
await $`git merge ${repoToMerge}/${branchToMerge} --allow-unrelated-histories -X ours`;
await $`mkdir -p ${repoToMerge}`;

// Remove files we don't want to keep as part of the monorepo because they are not relevant anymore or would be duplicated
for (const fileOrDirectory of [`appveyor.yml`, `Jenkinsfile`]) {
    await $`rm -rf ${fileOrDirectory}`;
}

let folderData = await fs.readdir(workingDir)
// Do not move .git folder or any previously merged repository
let dataToMove = folderData.filter(
    (fileOrDirectory) =>
        ![".git", repoToMerge, ...currentData].includes(fileOrDirectory)
);
for (const fileOrDirectory of dataToMove) {
    await $`mv ${fileOrDirectory} ${repoToMerge}`;
}

await $`git add -A`;
await $`git commit -m "chore: move ${repoToMerge} to its own directory"`;
await $`git remote remove ${repoToMerge}`;

console.log(`
    📦 ${chalk.blue(repoToMerge)} has been merged into APIM monorepo in: ${chalk.blue(workingDir)}

    🚨 You now have to rename some sources and ${chalk.red('check everything')} is correct before pushing, especially: 
       - pom.xml
       - README.md
       - circleci config
       - docker files
`)
```
