const fs = app.vault;
export const createFolder = (folder: string) => {
	function createPath(folder: string) {
		fs.createFolder(folder)
			.then(() => {
				console.log(`Folder created: ${folder}`);
				return true;
			})
			.catch((err: { message: string }) => {
				if (
					err.message === "Folder already exists." ||
					err.message === "File already exists."
				) {
					return true;
				} else {
					console.error("failed create folder/file" + folder);

					return false;
				}
			});
	}

	createPath(`${folder}`);
};
