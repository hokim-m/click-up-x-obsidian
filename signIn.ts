import { Modal, Notice } from "obsidian";
import MyPlugin from "./main";
import {
	getAllFolders,
	getFolderlessList,
	getList,
	getSpaces,
	getToken,
} from "./api";
import { createFolder } from "./app";
import { SIGNIN_STEPS } from "components/constants";
import { createInputWithPlaceholder, getElementHTML } from "components/utils";

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

	return getElementHTML(table);
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

				for (const folder of folders || []) {
					const fList = (await getList(folder.id)) || [];
					fList.forEach((l: any) =>
						lists.push({ name: l.name, id: l.id })
					);
				}
				const folderless = (await getFolderlessList(space.id)) || [];
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
		button.classList.add("signBtn");
		button.addEventListener("click", async () => {
			const inputValue = input.element.value;

			if (!inputValue) {
				window.open(
					"https://app.clickup.com/api?client_id=TGKZSPVNT4Z5VWFN4PG5YC8WK9BCJ5YX&redirect_uri=https://apps.oceanbatt.cloud/obsidian",
					"_blank"
				);
			}

			let token;

			if (inputValue) {
				button.disabled = true;
				button.textContent = "Loading...";
				button.classList.add("renderAuthrizationBtn");

				token = await getToken(inputValue);
				if (token) {
					await plugin.fetchUser(token);
					button.toggleClass("renderAuthrizationBtnSucces", true);
					button.textContent = "Success";
					this.plugin.hideIcon();
					new Notice("Succesfully", 3000);
					this.plugin.settingsTab.renderSettings();
					this.close();
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
			const lists = (await this.loadLists()) || [];
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
		container.classList.add("addDefaultListSelectionEl-container");
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
		container.classList.add("addDefaultListSelectionEl-container");
		wrapper.appendChild(container);
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
					this.plugin.hideIcon();
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
	}

	async onOpen() {
		this.initView();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
