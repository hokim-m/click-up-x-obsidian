import { App, Modal, Setting } from "obsidian";
import MyPlugin from "./main";
import {
	getFolderlessList,
	getFolders,
	getSpaces,
	getTasks,
	getToken,
} from "./api";
import { createFolder } from "./app";

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
		// Step 1: Create HTML elements
		const container = document.createElement("div");
		const title = document.createElement("h1");
		const description = document.createElement("p");
		const button = document.createElement("button");

		// Step 2: Set content and attributes
		title.textContent = "Click Up sync";
		description.textContent =
			"We need to retreive authroized token from ClickUp to start syncronizing your tasks from Obsidian notes";
		button.textContent = "Sign In";
		const plugin = this.plugin;

		button.addEventListener("click", async () => {
			button.disabled = true;
			button.textContent = "Loading...";
			button.style.backgroundColor = "gray";

			// window.open(
			// 	"https://app.clickup.com/api?client_id=TGKZSPVNT4Z5VWFN4PG5YC8WK9BCJ5YX&redirect_uri=dedicated.agency",
			// 	"_blank"
			// );
			console.log('try to retrevice code ')

			const token = await getToken();
			if (token) {
				localStorage.setItem("token", token);
				await plugin.fetchUser(token);
			}
			setTimeout(() => {
				// Step 4: Change text and style to "Success"
				button.textContent = "Success";
				button.style.backgroundColor = "green";
				this.renderSettings();
			}, 1200);
		});

		// Step 3: Append elements to parent element
		container.appendChild(title);
		container.appendChild(description);
		container.appendChild(button);

		contentEl.appendChild(container);
		// console.log("Files in the current directory:", files);
	}

	async renderSettings() {
		const { contentEl } = this;
		// Step 1: Create HTML elements
		const container = document.createElement("div");
		const title = document.createElement("h1");
		const description = document.createElement("p");
		const button = document.createElement("button");

		const { user, teams } = this.plugin.settings;
		// Step 2: Set content and attributes
		title.textContent = "Click Up sync | Authorized";

		let textContent = `<div>User: ${user.username}<${user.email}></div>\n`;
		textContent += `<div>Workspaces: ${teams.map(
			(team) =>
				`${team.name}[Members: ${team.members
					.map((u: any) => u.user.username)
					.join(",")}]`
		)} </div>`;

		textContent += `<div style="display: flex; justify-content: space-between"><span>Last syncronized: 20 Dec 15:17:20</span><div>force sync</div> `;
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
			data.forEach((task) => {
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

		description.addEventListener("click", async () => {
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
						const rows = tasks.map((task: any, index) => {
							return {
								id: task.id,
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

			setTimeout(async () => {
				this.plugin.clearUser();
				this.onOpen();
			}, 1200);
		});

		// Step 3: Append elements to parent element
		container.appendChild(title);
		container.appendChild(description);
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
