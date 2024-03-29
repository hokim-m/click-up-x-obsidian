const fs = app.vault;
export const createFolder = (folder: string) => {
	function createPath(folder: string) {
		try {
			fs.createFolder(folder);
			console.log(`Folder created: ${folder}`);
			return true;
		} catch (error) {
			console.error(`Error creating folder: ${folder}`, error);
			return false;
		}
	}

	createPath(`${folder}`);
};
