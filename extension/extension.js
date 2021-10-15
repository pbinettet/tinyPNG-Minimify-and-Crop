// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require("path");
const tiny = require("./tiny-png-api");
const fileExplorer = require("./file-explorer");

const ApiImageAccepted = ['.jpeg', '.jpg', '.png']

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json





	// ---------------------------------------------------
	// TinyPNG - Minimize image
	// TinyPNG - Minimize all images of folder

	let tinySingleImageVsFn = vscode.commands.registerCommand('tinypngminimifyandcrop.tiny-image', async function (selectedFile, allSelectedFile) {

		let allFilesPathList = allSelectedFile.map(elem => elem.fsPath)
		let imgFilePathList = allFilesPathList.filter(elem => ApiImageAccepted.includes(path.extname(elem).toLowerCase()));
		let folderPathList = allFilesPathList.filter(elem => path.extname(elem) == "");



		//if (folderPathList.length) {

		//get all img path inside of all selected folder and it subfolder
		const data = await fileExplorer.getAllImagesOfFolderList(folderPathList, ApiImageAccepted)
		//Keep only full path
		let imgFilePathListFromFolder = data.map(elem => elem.fullPath);
		// concat tow array
		imgFilePathList.push(...imgFilePathListFromFolder)
		// Cancel if no image found
		if (!imgFilePathList.length) { return }


		let allWorkspace = vscode.workspace.workspaceFolders.map(elem => path.dirname(elem.uri.fsPath) + "\\")
		// Set message to be sure want to minify all image
		let msg = "Are you sure you want minimify all following image? Files will be automaticly overwritted. \n\n"
		imgFilePathList.forEach(elem => {
			allWorkspace.forEach((workspaceUri) => {
				console.log(workspaceUri)
				elem = elem.replace(workspaceUri, "")
			})
			msg += "• " + elem + "\n";
		});

		// Ask Are you sure
		vscode.window
			.showInformationMessage(msg, { modal: true }, ...["Yes"])
			.then((answer) => {
				if (answer === "Yes") {
					tiny.minimifyAndCropAllListImg(imgFilePathList)
				}
			});

		//} else {
		//	tiny.minimifyAndCropAllListImg(imgFilePathList)
		//}

	});




	// ---------------------------------------------------
	// TinyPNG - Minimize and crop image
	// TinyPNG - Minimize and crop all images of folder

	let tinyAndCropSingleImageVsFn = vscode.commands.registerCommand('tinypngminimifyandcrop.tiny-and-crop-image', async function (selectedFile, allSelectedFile) {

		let allFilesPathList = allSelectedFile.map(elem => elem.fsPath)
		let imgFilePathList = allFilesPathList.filter(elem => ApiImageAccepted.includes(path.extname(elem).toLowerCase()));
		let folderPathList = allFilesPathList.filter(elem => path.extname(elem) == "");


		//get all img path inside of all selected folder and it subfolder
		const data = await fileExplorer.getAllImagesOfFolderList(folderPathList, ApiImageAccepted)
		//Keep only full path
		let imgFilePathListFromFolder = data.map(elem => elem.fullPath);
		// concat tow array
		imgFilePathList.push(...imgFilePathListFromFolder)
		// Cancel if no image found
		if (!imgFilePathList.length) { return }


		let allWorkspace = vscode.workspace.workspaceFolders.map(elem => path.dirname(elem.uri.fsPath) + "\\")
		// Set message to be sure want to minify all image
		let msg = "Are you sure you want minimify and resize all following image? Files will be automaticly overwritted. \n\n"
		imgFilePathList.forEach(elem => {
			allWorkspace.forEach((workspaceUri) => {
				console.log(workspaceUri)
				elem = elem.replace(workspaceUri, "")
			})
			msg += "• " + elem + "\n";
		});

		// Ask Are you sure
		vscode.window
			.showInformationMessage(msg, { modal: true }, ...["Yes"])
			.then(async (answer) => {
				if (answer !== "Yes") { return }

				// Ask resize method with option
				let items = [{
					label: "SELECT RESIZE METHOD...",
					description: ""
				}, {
					label: "Scale",
					description: "Scales the image down proportionally."
				}, {
					label: "Cover",
					description: "Scales the image proportionally and crops."
				}]
				const selection = await vscode.window.showQuickPick(items);
				if (!selection) { return; }

				switch (selection.label) {

					case "Scale":

						// Ask Scale image with
						const selectionWidthOrHeight = await vscode.window.showQuickPick(["SCALE IMAGE WITH...", "width", "height"])
						if (!selectionWidthOrHeight) { return; }

						switch (selectionWidthOrHeight) {
							case "width":

								// Ask width size
								let widthInput = await vscode.window.showInputBox({ prompt: 'Width wanted in px', placeHolder: '1200' });
								let widthNumber = parseInt(widthInput)
								if (widthInput === undefined || isNaN(widthNumber)) { return; }

								// Tiny and crop image
								tiny.minimifyAndCropAllListImg(imgFilePathList, { method: "cover", width: widthNumber })
								break;

							case "height":

								// Ask height size
								const heightInput = await vscode.window.showInputBox({ prompt: 'Height wanted in px', placeHolder: (parseInt(widthInput) * 9 / 16).toString() })
								let heightNumber = parseInt(heightInput)
								if (heightInput === undefined || isNaN(heightNumber)) { return; }

								// Tiny and crop image
								tiny.minimifyAndCropAllListImg(imgFilePathList, { method: "cover", height: heightNumber })
								break;
							//.....
							default:
								break;
						}
						break;


					case "Cover":

						// Ask width size
						let widthInput = await vscode.window.showInputBox({ prompt: 'Width wanted in px', placeHolder: '1200' });
						let widthNumber = parseInt(widthInput)
						if (widthInput === undefined || isNaN(widthNumber)) { return; }

						// Ask height size
						const heightInput = await vscode.window.showInputBox({ prompt: 'Height wanted in px', placeHolder: (parseInt(widthInput) * 9 / 16).toString() })
						let heightNumber = parseInt(heightInput)
						if (heightInput === undefined || isNaN(heightNumber)) { return; }

						// Tiny and crop image
						tiny.minimifyAndCropAllListImg(imgFilePathList, { method: "cover", width: widthNumber, height: heightNumber })
						break;
				}

			});

	});


	// ---------------------------------------------------

	tiny.validateApiKey().then(function () {
		context.subscriptions.push(tinySingleImageVsFn, tinyAndCropSingleImageVsFn);
	});

	// ---------------------------------------------------


}




// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
