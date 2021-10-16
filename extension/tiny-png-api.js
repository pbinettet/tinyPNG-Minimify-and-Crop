const vscode = require('vscode');
const tinify = require("tinify");
const path = require("path");

module.exports = {

    compressionCount: undefined,
    tinyPngLimitDefined: undefined,
    fetchTime: undefined,


    // ---------------------------------------------------
    validateApiKey() {
        return new Promise((resolve, reject) => {
            tinify.key = vscode.workspace.getConfiguration('tinypngminimifyandcrop').tinyPngApiKey;
            tinify.validate(function (err) {
                if (err) {
                    vscode.window.showErrorMessage("TinyPNG - Invalid activation key. Please enter a valid activation key in the extension setting's.");
                    reject(err);
                } else {
                    resolve()
                }
            })
        });
    },


    // ---------------------------------------------------
    getImageCompressionLeft() {
        return new Promise((resolve, reject) => {
            this.validateApiKey().then(() => {
                this.compressionCount = tinify.compressionCount.toString();
                this.tinyPngLimitDefined = vscode.workspace.getConfiguration('tinypngminimifyandcrop').tinyPngLimit.toString();

                let d = new Date();
                this.fetchTime = `${d.getHours()}h${d.getMinutes()}:${d.getSeconds()}`;

                resolve();
            }, function (err) {
                reject(err);
            })
        });
    },


    // ---------------------------------------------------
    printImageCompressionLeft() {
        this.getImageCompressionLeft().then(() => {
            vscode.window.showInformationMessage(`TinyPNG - ${this.compressionCount} compressions done this month out of ${this.tinyPngLimitDefined}`);
        })
    },


    // ---------------------------------------------------
    tinySingleImage(imgSourcePath, imgDestinationPath, resizeOption = null) {

        return new Promise((resolve, reject) => {
            // Check if the limit is reached before trying to minify img
            if (tinify.compressionCount < vscode.workspace.getConfiguration('tinypngminimifyandcrop').tinyPngLimit) {

                // set file to minimify
                let tinyApiObj = tinify.fromFile(imgSourcePath)


                // set resize option to minimify
                if (resizeOption) {
                    tinyApiObj = tinyApiObj.resize(resizeOption)
                }


                // set destination path
                tinyApiObj.toFile(imgDestinationPath, function (err) {
                    if (err) {  // handle error
                        console.error("The error message is: " + err.message)
                        if (err instanceof tinify.AccountError) {
                            console.error("Verify your API key and account limit.")
                        } else if (err instanceof tinify.ClientError) {
                            console.error("Check your source image and request options.")
                        } else if (err instanceof tinify.ServerError) {
                            console.error("Temporary issue with the Tinify API.")
                        } else if (err instanceof tinify.ConnectionError) {
                            console.error("A network connection error occurred.")
                        } else {
                            console.error("Something else went wrong, unrelated to the Tinify API.")
                        }
                        const imgName = path.basename(imgSourcePath)
                        vscode.window.showErrorMessage("TinyPNG - Image " + imgName + " not processed correctly")
                        // reject tinyImg function Promise
                        reject();

                    } else {  //handle sucess
                        // resolve tinyImg function Promise
                        resolve();
                    }
                });


            } else {
                const imgName = path.basename(imgSourcePath)
                vscode.window.showErrorMessage("TinyPNG - Image " + imgName + " not processed correctly - Compression limit reached")
                // reject tinyImg function Promise
                reject()
            }

        });
    },


    // ---------------------------------------------------
    minimifyAndCropAllListImg(pathList, resizeOption = null) {
        // Check if the API key is valid
        this.validateApiKey().then(() => {
            // vscode notification with progress bar
            vscode.window.withProgress({ location: vscode.ProgressLocation.Notification },
                (progress, token) => {

                    let promisesList = []

                    // Open notification with welcome message
                    progress.report({ increment: 0, message: 'TinyPNG: minification in progress...' });

                    // Set value for notification
                    let totalPromises = pathList.length
                    let promiseDoneCounter = 0;
                    const incrementStep = promiseDoneCounter * 100 / totalPromises

                    // For all files selected
                    pathList.forEach(path => {
                        promisesList.push(
                            // Tiny image
                            this.tinySingleImage(path, path, resizeOption).then(function () {
                                promiseDoneCounter++;
                                progress.report({ increment: incrementStep, message: `TinyPNG: ${promiseDoneCounter} images compresse on ${totalPromises}` });
                            })
                        );
                    });

                    // Close notifaction when all image is done or fail
                    // @ts-ignore
                    return Promise.allSettled(promisesList);
                })
                // When all promises is process show notification of how many compression left
                .then(() => {
                    this.printImageCompressionLeft()
                });
        });
    }

}