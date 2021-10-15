const fsPromise = require("fs/promises");
const vscode = require('vscode');
const path = require("path");


module.exports = {

    getAllWorkspaceFiles(extFilter = [], recursive = false, withFolderStructue = false, includeEmptyFolder = false) {
        return new Promise((resolve, reject) => {
            // Create list of Promises
            let promisesListGetFiles = []
            // For each folder in workspace of vscode
            vscode.workspace.workspaceFolders.forEach((workspaceFolder) => {
                promisesListGetFiles.push(
                    // get list of all file including folder structure
                    this.getFiles(workspaceFolder.uri.fsPath, extFilter, recursive, withFolderStructue, includeEmptyFolder).then((data) => {
                        return data
                    })
                );
            });

            // When we get all data of all folder
            Promise.all(promisesListGetFiles).then(function (data) {
                var list = []
                data.forEach(elem => {
                    if (elem != null) {
                        list.push(elem);
                    }
                });
                resolve(list)
            }, reject);

        });

    },


    getAllImagesOfFolderList(folderList, extFilter, recursive) {
        return new Promise((resolve, reject) => {
            // Create list of Promises
            let promisesListGetFiles = []
            // For each folder in workspace of vscode
            folderList.forEach((folder) => {
                promisesListGetFiles.push(
                    // get list of all file including folder structure
                    this.getFiles(folder, extFilter, recursive).then((data) => {
                        return data
                    })
                );
            });

            // When we get all data of all folder
            Promise.all(promisesListGetFiles).then(function (data) {
                var list = []
                data.forEach(elem => {
                    if (elem != null) {
                        list.push(...elem);
                    }
                });
                resolve(list)
            }, reject);

        });
    },


    getFiles(folderPath, extFilter = [], recursive = false, withFolderStructue = false, includeEmptyFolder = false) {
        return new Promise((resolve, reject) => {

            // Create objFolder to make folder structure
            var objFolder = {
                isFile: false,
                isFolder: true,
                name: path.basename(folderPath),
                files: [],
                fullPath: folderPath
            }

            // Read the current directory
            fsPromise.readdir(folderPath, { withFileTypes: true })
                .then((entries) => {
                    // Get files within the current directory and add other info to the file objects
                    const files = entries
                        .filter((file) => {
                            if (extFilter.length > 0) {
                                return file.isDirectory() == false && extFilter.includes(path.extname(file.name))
                            } else {
                                return file.isDirectory() == false
                            }
                        })
                        .map(file => {
                            return {
                                isFile: true,
                                isFolder: false,
                                name: file.name,
                                extname: path.extname(file.name),
                                nameOnly: path.basename(file.name, path.extname(file.name)),
                                fullPath: path.join(folderPath, file.name),
                            }
                        });

                    if (recursive) {
                        // Get folders within the current directory
                        const folders = entries.filter(folder => folder.isDirectory());

                        // Call getFiles for each directory and place all Promise in an array
                        var promisesArr = []
                        for (const folder of folders) {
                            promisesArr.push(this.getFiles(path.join(folderPath, folder.name), extFilter, recursive, withFolderStructue, includeEmptyFolder)
                                .then((files) => {
                                    return files
                                })
                            )
                        }

                        // resolve Promise when all promise is complete
                        Promise.all(promisesArr).then((arrOfArrOfFiles) => {

                            const arrOfFiles = arrOfArrOfFiles.filter(elem => elem != null)
                            const arrOfFilesMergeed = files.concat(arrOfFiles)

                            if (withFolderStructue) {
                                if (arrOfFilesMergeed.length > 0 || includeEmptyFolder) {
                                    objFolder.files = arrOfFilesMergeed;
                                    resolve(objFolder)
                                } else {
                                    resolve()
                                }

                            } else {
                                resolve(arrOfFilesMergeed.flat())
                            }
                        })
                    } else {
                        resolve(files)
                    }

                });
            //END fsPromise.readdir(...

        });
    }



}