import { Modal } from "obsidian";
import MyPlugin from "./main";
import {
	getAllFolders,
	getFolderlessList,
	getFolders,
	getList,
	getSpaces,
	getTasks,
	getToken,
} from "./api";
import { createFolder } from "./app";
import { SIGNIN_STEPS } from "components/constants";
import { createInputWithPlaceholder } from "components/utils";

interface ISpace {
	name: string;
	id: string;
}
interface IList {
	name: string;
	id: string;
}
export const createTable = (data: any) => {
	const table = document.createElement("table");
	table.classList.add("my-table");

	// Create table header
	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");
	const headers = [
		"Order",
		"Name",
		"Status",
		"Date Created",
		"Creator",
		"Assignee",
		"Priority",
	];
	headers.forEach((headerText) => {
		const th = document.createElement("th");
		th.textContent = headerText;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	// Create table body
	const tbody = document.createElement("tbody");
	data.forEach((task: any) => {
		const row = document.createElement("tr");
		Object.values(task).forEach((value) => {
			const cell = document.createElement("td");
			if (Array.isArray(value)) {
				const select = document.createElement("select");
				value.map(String).forEach((item) => {
					const option = document.createElement("option");
					option.value = item;
					option.textContent = item;
					select.appendChild(option);
				});
				cell.appendChild(select);
			} else {
				cell.textContent = String(value);
			}
			row.appendChild(cell);
		});
		tbody.appendChild(row);
	});
	table.appendChild(tbody);

	// Return the table as a string
	return table.outerHTML;
};

export class MainAppModal extends Modal {
	result: string;
	plugin: MyPlugin;

	onSubmit: (result: string) => void;

	constructor(plugin: MyPlugin, onSubmit: (result: string) => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
	}

	async loadSpaces(): Promise<ISpace[]> {
		const { teams } = this.plugin.settings;

		const spaces: ISpace[] = [];
		for (const team of teams) {
			const sps = await getSpaces(team.id);
			sps.forEach((sp: any) => spaces.push({ name: sp.name, id: sp.id }));
		}

		return spaces;
	}

	async configureListsLocally() {
		const lists: IList[] = await this.loadLists();
		localStorage.setItem("lists", JSON.stringify(lists));
	}
	async loadLists(): Promise<IList[]> {
		const { teams } = this.plugin.settings;
		const lists: IList[] = [];
		for (const team of teams) {
			const spaces = await getSpaces(team.id);
			for (const space of spaces) {
				const folders = await getAllFolders(space.id);

				for (const folder of folders) {
					const fList = await getList(folder.id);
					fList.forEach((l: any) =>
						lists.push({ name: l.name, id: l.id })
					);
				}
				const folderless = await getFolderlessList(space.id);
				folderless.forEach((l: any) =>
					lists.push({ name: l.name, id: l.id })
				);
			}
		}
		return lists;
	}

	renderAuthrization() {
		const { contentEl } = this;
		contentEl.empty();

		const plugin = this.plugin;

		// Step 1: Create HTML elements
		const container = document.createElement("div");
		const title = document.createElement("h1");
		const description = document.createElement("p");
		const button = document.createElement("button");
		const steps = document.createElement("div");
		const input = createInputWithPlaceholder("Code", "Enter code", true);

		SIGNIN_STEPS.forEach((stepItem) => {
			const step = document.createElement("p");
			step.textContent = stepItem;
			steps.appendChild(step);
		});

		// Step 2: Set content and attributes
		title.textContent = "Click Up sync";
		description.textContent =
			"We need to retreive authroized token from ClickUp to start syncronizing your tasks from Obsidian notes";
		button.textContent = "Sign In";

		button.addEventListener("click", async () => {
			const inputValue = input.element.value;

			if (!inputValue) {
				window.open(
					"https://app.clickup.com/api?client_id=TGKZSPVNT4Z5VWFN4PG5YC8WK9BCJ5YX&redirect_uri=https://clickup.dedicated.agency/obsidian",
					"_blank"
				);
			}

			let token;

			if (inputValue) {
				button.disabled = true;
				button.textContent = "Loading...";
				button.style.backgroundColor = "gray";

				token = await getToken(inputValue);
				if (token) {
					await plugin.fetchUser(token);

					button.textContent = "Success";
					button.style.backgroundColor = "green";
					this.renderSettings();
				}
			}
		});

		// Step 3: Append elements to parent element
		steps.appendChild(input.element);
		container.appendChild(title);
		container.appendChild(description);
		container.appendChild(steps);
		container.appendChild(button);

		contentEl.appendChild(container);
		// console.log("Files in the current directory:", files);
	}

	async addDefaultListSelectionEl(wrapper: any) {
		const selectedSpace = localStorage.getItem("selectedList");
		const selectThisListContent = document.createElement("p");
		const disabledOption = document.createElement("option");
		const listSelect = document.createElement("select");

		selectThisListContent.textContent = "Select default list";

		disabledOption.textContent = "Loading..";
		disabledOption.selected = true;
		disabledOption.disabled = true;
		listSelect.appendChild(disabledOption);

		setTimeout(async () => {
			const lists = await this.loadLists();
			disabledOption.textContent = "Lists";
			lists.forEach(async (list: any) => {
				const option = document.createElement("option");
				option.textContent = list.name;
				option.id = list.id;
				listSelect.appendChild(option);
			});
			if (selectedSpace) {
				try {
					const parsed = JSON.parse(selectedSpace);
					listSelect.value = parsed.name;
				} catch (e: any) {
					localStorage.removeItem("selectedList");
				}
			}
		}, 1);

		listSelect.addEventListener("change", () => {
			const id = listSelect.options[listSelect.selectedIndex].id;
			localStorage.setItem(
				"selectedList",
				JSON.stringify({ name: listSelect.value, id })
			);
		});

		const container = document.createElement("div");
		container.appendChild(selectThisListContent);
		container.appendChild(listSelect);
		container.style.display = "flex";
		container.style.justifyContent = "space-between";
		container.style.alignItems = "center";
		wrapper.appendChild(container);
	}

	async addSpacesSelectionEl(wrapper: any) {
		const selectedSpace = localStorage.getItem("selectedSpace");
		const selectThisListContent = document.createElement("p");
		const disabledOption = document.createElement("option");
		const listSelect = document.createElement("select");

		selectThisListContent.textContent = "Select workspace";

		disabledOption.textContent = "Loading...";
		disabledOption.selected = true;
		disabledOption.disabled = true;
		listSelect.appendChild(disabledOption);

		setTimeout(async () => {
			const spaces = await this.loadSpaces();
			disabledOption.textContent = "Spaces";
			spaces.forEach(async (space: any) => {
				const option = document.createElement("option");
				option.textContent = space.name;
				option.id = space.id;
				listSelect.appendChild(option);
			});
			if (selectedSpace) {
				try {
					const parsed = JSON.parse(selectedSpace);
					listSelect.value = parsed.name;
				} catch (e: any) {
					localStorage.removeItem("selectedSpace");
				}
			}
		}, 100);
		listSelect.addEventListener("change", () => {
			const id = listSelect.options[listSelect.selectedIndex].id;
			localStorage.setItem(
				"selectedSpace",
				JSON.stringify({ name: listSelect.value, id })
			);
		});
		const container = document.createElement("div");
		container.appendChild(selectThisListContent);
		container.appendChild(listSelect);
		container.style.display = "flex";
		container.style.justifyContent = "space-between";
		container.style.alignItems = "center";
		wrapper.appendChild(container);
	}

	async renderSettings() {
		const { contentEl } = this;
		contentEl.empty();
		// Step 1: Create HTML elements
		if (!localStorage.getItem("token")) {
			this.renderAuthrization();
			return;
		}

		const container = document.createElement("div");
		const title = document.createElement("h1");
		const descriptionWrapper = document.createElement("div");
		const forceSyncBtn = document.createElement("button");

		const description = document.createElement("p");
		const button = document.createElement("button");
		const wrapperList = document.createElement("div");

		descriptionWrapper.appendChild(description);
		descriptionWrapper.appendChild(forceSyncBtn);

		forceSyncBtn.textContent = "Force sync";
		descriptionWrapper.style.display = "flex";
		descriptionWrapper.style.justifyContent = "space-between";
		wrapperList.style.display = "block";

		const { user, teams } = this.plugin.settings;
		// Step 2: Set content and attributes
		title.textContent = "Click Up sync | Authorized";

		let textContent = `<div>User: ${user.username}<${user.email}></div>\n`;
		textContent += `<div>Workspaces: ${teams.map(
			(team) =>
				`${team.name}[Members: ${team.members
					.map(
						(u: any) =>
							`<div style="margin-top:10px">${u.user.username}</div>`
					)
					.join(",")}]`
		)} </div>`;

		description.innerHTML = textContent;

		forceSyncBtn.addEventListener("click", async () => {
			await this.configureListsLocally();

			const vaultPath = localStorage.getItem("path");
			createFolder(`${vaultPath}/ClickUp`);
			for (const team of teams) {
				createFolder(`${vaultPath}/ClickUp/${team.name}`);
				const spaces = await getSpaces(team.id);
				for (const space of spaces) {
					createFolder(
						`${vaultPath}/ClickUp/${team.name}/${space.name} - [${space.id}]`
					);
					const folders = await getFolders(space.id);

					for (const folder of folders || []) {
						// const list = await getList(folder.id)
						createFolder(
							`${vaultPath}/ClickUp/${team.name}/${space.name} - [${space.id}]/${folder.name}`
						);
					}

					const folderless = await getFolderlessList(space.id);
					for (const list_item of folderless) {
						const vault = this.plugin.app.vault;
						const tasks = await getTasks(list_item.id);
						const rows = tasks.map((task: any, index: any) => {
							return {
								// id: task.id,
								order: index + 1,
								name: task.name,
								status: task.status.status,
								date_created: new Date(
									Number(task.date_created)
								).toLocaleString("en-US"),
								creator: task.creator.username,
								assignees: task.assignees.map(
									(u: any) => u.username
								),
								priority: ["Low", "Medium", "High", "Critical"],
							};
						});
						const tableHTML = createTable(rows);
						const filePath = `/ClickUp/${team.name}/${space.name} - [${space.id}]/${list_item.name}[${list_item.id}].md`;
						console.log(filePath);
						vault.create(filePath, tableHTML);
					}
				}
			}
		});
		button.textContent = "Log out";

		button.addEventListener("click", () => {
			// Step 3: Open link in a new browser tab/window
			// Step 3: Add loading style

			button.disabled = true;
			button.textContent = "Loading...";
			button.style.backgroundColor = "gray";
			localStorage.removeItem("token");
			// isOpenSigninModal = true;

			setTimeout(async () => {
				button.disabled = false;
				this.plugin.clearUser();
				this.renderAuthrization();
			}, 1200);
		});

		//space selection
		await this.addSpacesSelectionEl(wrapperList);
		await this.addDefaultListSelectionEl(wrapperList);

		container.appendChild(title);
		container.appendChild(wrapperList);
		container.appendChild(descriptionWrapper);
		container.appendChild(button);

		contentEl.appendChild(container);
	}

	async initView() {
		const { contentEl } = this;
		const { user, token } = this.plugin.settings;
		if (!token) {
			return this.renderAuthrization();
		}

		if (!user) {
			const container = document.createElement("div");
			const title = document.createElement("h1");
			title.textContent = "Loading...";
			container.appendChild(title);
			contentEl.appendChild(container);

			try {
				const response: any = await this.plugin.fetchUser(
					this.plugin.settings.token
				);
				if (response) {
					this.plugin.settings.user = response;
					await this.plugin.saveSettings();
					this.renderSettings();
				} else {
					await this.plugin.clearUser();
					this.onOpen();
					return;
				}
			} catch (e: any) {
				console.log(e);
			}
			return;
		}

		return this.renderSettings();
	}

	async onOpen() {
		this.initView();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
