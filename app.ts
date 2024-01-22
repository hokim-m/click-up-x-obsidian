import * as fs from "fs";

export const createFolder = (folder: string) => {
	function createPath(path: string) {
		try {
			fs.mkdirSync(path, { recursive: true });
			console.log(`Folder created: ${path}`);
			return true;
		} catch (error) {
			console.error(`Error creating folder: ${path}`, error);
			return false;
		}
	}

	// Example usage
	createPath(`${folder}`);
};
