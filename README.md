# Gravitee Repositories Combiner

## 📝 Description 

This repo contains a simple [zx](https://github.com/google/zx) script merging multiple Git repositories a monorepo.

### 👨‍🏫 How does this work?

#### combine-repositories

The script will:
 1. Create a new Git repository in `../tmp/gravitee-apim-repository`
 2. Merge all the repositories and branches listed in `combine-repositories.mjs` in the newly created repository
 3. Apply all the patches defined in `patches/xxx`, they will be applied branch-by-branch in alphabetical order.

Notes: Everything is idempotent and does not push anything on GitHub so feel free to run the script as much as you want.

#### add-repository

The script will:
1. Clone `gravitee-api-management` repository in `../tmp/gravitee-api-management`
2. Merge the repository branches listed in `add-repository.mjs` in the newly cloned repository
3. Apply all the patches defined in `patches/xxx`, they will be applied branch-by-branch in alphabetical order.

Notes: Everything is idempotent and does not push anything on GitHub so feel free to run the script as much as you want.

## 👨‍💻 Code

### 👮 Prerequisites

To run the script you need to have: 
  - Node.js >= 14.8.0
  - [zx](https://github.com/google/zx); to install it just run:
    ```bash
    npm i -g zx
    # Check everything is ok:
    zx -v
    ```

### 🏗 Structure

The structure is the following: 

    |- combine-repositories.mjs: Entrypoint of the script creating the new monorepo, contains the overall logic
    |- add-repository.mjs: Entrypoint of the script adding a repo in the APIM monorepo, contains the overall logic
    | 
    |- src 
    |   |- fs-helper.mjs: A bunch of handy functions to work with the filesystem   
    |   |- git-helper.mjs: A bunch of handy functions to work with Git  
    | 
    |- patches: directory containing all the patches applied after merging repo in the monorepo (they are branch-ordered)
    |   |- master: directory containing patches for the master branch
    |       |- 0001-XXXXXX.patch: A Git patch file 


### 🏁 Run the script

To run the script just use `./combine-repositories.mjs` or `./add-repository.mjs`

To check if everything is fine with the monorepo you can Maven build the project: 
```shell
cd ../tmp/gravitee-apim-repository
mvn clean install
```


Notes: Everything is idempotent and does not push anything on GitHub so feel free to run the script as much as you want.
