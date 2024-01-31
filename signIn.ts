import { Modal } from "obsidian";
import MyPlugin from "./main";
import {
	getAllFolders,
	getClickupLists,
	getFolderlessList,
	getFolders,
	getSpaces,
	getTasks,
	getToken,
} from "./api";
import { createFolder } from "./app";
import { SIGNIN_STEPS } from "components/constants";
import {
	createInputWithPlaceholder,
	createSelectWithOptions,
} from "components/utils";

export class MainAppModal extends Modal {
	result: string;
	plugin: MyPlugin;
	onSubmit: (result: string) => void;

	constructor(plugin: MyPlugin, onSubmit: (result: string) => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
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
					"_blank",
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

	async renderSettings() {
		const { contentEl } = this;
		const allLists: any[] = [];

		let isOpenSigninModal: boolean = false;

		contentEl.empty();
		// Step 1: Create HTML elements
		if (!localStorage.getItem("token")) {
			this.renderAuthrization();
		} else {
			const selectedSpace = localStorage.getItem("selectedSpace");

			const container = document.createElement("div");
			const title = document.createElement("h1");
			const descriptionWrapper = document.createElement("div");
			const forceSyncBtn = document.createElement("button");

			const description = document.createElement("p");
			const button = document.createElement("button");
			const listSelect = document.createElement("select");
			const wrapperList = document.createElement("div");
			const disabledOption = document.createElement("option");

			descriptionWrapper.appendChild(description);
			descriptionWrapper.appendChild(forceSyncBtn);

			const selectThisListContent = document.createElement("p");
			selectThisListContent.textContent =
				"Please select space before create task!";

			disabledOption.textContent = "Spaces";
			disabledOption.selected = true;

			disabledOption.disabled = true;
			listSelect.appendChild(disabledOption);
			if (selectedSpace) {
				listSelect.value = selectedSpace;
			}

			listSelect.addEventListener("change", () => {
				localStorage.setItem("selectedSpace", listSelect.value);
			});

			forceSyncBtn.textContent = "Force sync";
			descriptionWrapper.style.display = "flex";
			descriptionWrapper.style.justifyContent = "space-between";
			wrapperList.style.display = "flex";
			wrapperList.style.justifyContent = "space-between";
			wrapperList.style.alignItems = "center";

			const { user, teams } = this.plugin.settings;
			// Step 2: Set content and attributes
			title.textContent = "Click Up sync | Authorized";

			teams.forEach(async (team) => {
				const spaces = await getSpaces(team.id);
				spaces.forEach(async (space: any) => {
					const option = document.createElement("option");
					option.textContent = space.name;
					option.id = space.id;
					listSelect.appendChild(option);
					const folders = await getAllFolders(space.id);
					for (const folder of folders) {
						const lists = await getClickupLists(folder.id);
						localStorage.setItem("lists", JSON.stringify(lists));
					}
				});
			});

			let textContent = `<div>User: ${user.username}<${user.email}></div>\n`;
			textContent += `<div>Workspaces: ${teams.map(
				(team) =>
					`${team.name}[Members: ${team.members
						.map(
							(u: any) =>
								`<div style="margin-top:10px">${u.user.username}</div>`,
						)
						.join(",")}]`,
			)} </div>`;

			description.innerHTML = textContent;

			function createTable(data: any) {
				const table = document.createElement("table");
				table.classList.add("my-table");

				// Create table header
				const thead = document.createElement("thead");
				const headerRow = document.createElement("tr");
				const headers = [
					"ID",
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
			}

			forceSyncBtn.addEventListener("click", async () => {
				//do send requests
				//fetch teams, spaces, folders, lists, forderless list from clickapi
				//fetch team / spaces

				const vaultPath = localStorage.getItem("path");
				createFolder(`${vaultPath}/ClickUp`);
				for (const team of teams) {
					createFolder(`${vaultPath}/ClickUp/${team.name}`);
					const spaces = await getSpaces(team.id);
					for (const space of spaces) {
						createFolder(
							`${vaultPath}/ClickUp/${team.name}/${space.name} - [${space.id}]`,
						);
						const folders = await getFolders(space.id);

						for (const folder of folders || []) {
							// const list = await getList(folder.id)
							createFolder(
								`${vaultPath}/ClickUp/${team.name}/${space.name} - [${space.id}]/${folder.name}`,
							);
						}

						const folderless = await getFolderlessList(space.id);
						for (const list_item of folderless) {
							const vault = this.plugin.app.vault;
							const tasks = await getTasks(list_item.id);
							const rows = tasks.map((task: any, index: any) => {
								return {
									id: task.id,
									order: index + 1,
									name: task.name,
									status: task.status.status,
									date_created: new Date(
										Number(task.date_created),
									).toLocaleString("en-US"),
									creator: task.creator.username,
									assignees: task.assignees.map(
										(u: any) => u.username,
									),
									priority: [
										"Low",
										"Medium",
										"High",
										"Critical",
									],
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
				isOpenSigninModal = true;

				setTimeout(async () => {
					button.disabled = false;
					this.plugin.clearUser();
					this.renderAuthrization();
				}, 1200);
			});

			// Step 3: Append elements to parent element
			wrapperList.appendChild(selectThisListContent);

			wrapperList.appendChild(listSelect);

			container.appendChild(title);
			container.appendChild(wrapperList);
			container.appendChild(descriptionWrapper);
			container.appendChild(button);

			contentEl.appendChild(container);
		}
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
					this.plugin.settings.token,
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
