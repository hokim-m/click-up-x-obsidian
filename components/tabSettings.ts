import {
	getAllFolders,
	getFolderlessList,
	getFolders,
	getList,
	getSpaces,
	getTasks,
} from "api";
import ClickUpPlugin from "../main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { createFolder } from "app";
import { MainAppModal, createTable } from "signIn";
interface ISpace {
	name: string;
	id: string;
}
interface IList {
	name: string;
	id: string;
}
export class ExampleSettingTab extends PluginSettingTab {
	plugin: ClickUpPlugin;
	constructor(app: App, plugin: ClickUpPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
	async configureListsLocally() {
		const lists: IList[] = await this.loadLists();
		localStorage.setItem("lists", JSON.stringify(lists));
	}
	renderSettings() {
		let { containerEl } = this;
		const { teams } = this.plugin.settings;
		containerEl.empty();
		let title = containerEl.createEl("h2", {
			text: "Loadings...",
			cls: "title_settings",
		});

		new Setting(containerEl)
			.setName("Select space")
			.addDropdown(async (dropdown) => {
				dropdown.setDisabled(true);
				try {
					title.textContent = "Loadings...";
					const spaces = await this.loadSpaces();
					let selectedSpace = "";
					if (localStorage.getItem("selectedSpace")) {
						selectedSpace =
							localStorage.getItem("selectedSpace") ??
							JSON.stringify(spaces[0]);
					}
					spaces.forEach((space) => {
						dropdown.addOption(JSON.stringify(space), space.name);
					});
					dropdown.setValue(selectedSpace);
					dropdown.onChange((value) => {
						localStorage.setItem("selectedSpace", value);
					});
					dropdown.setDisabled(false);
				} catch (error) {
					dropdown.disabled;
					dropdown.addOption("", "doesnt registration");
				}
			});
		new Setting(containerEl)
			.setName("Select Default Sheet")

			.addDropdown(async (dropdown) => {
				dropdown.setDisabled(true);
				try {
					const lists = await this.loadLists();
					let selectedSheet = "";
					if (localStorage.getItem("selectedList")) {
						selectedSheet =
							localStorage.getItem("selectedList") ??
							JSON.stringify(lists[0]);
					}
					lists.forEach((list) => {
						dropdown.addOption(JSON.stringify(list), list.name);
					});

					dropdown.setValue(selectedSheet);
					dropdown.onChange((value) => {
						localStorage.setItem("selectedList", value);
					});
					dropdown.setDisabled(false);
					title.textContent = "Settings";
				} catch (error) {
					dropdown.disabled;
					dropdown.addOption("", "doesnt registration");
				}
			})
			.setDesc("");
		new Setting(containerEl)
			.setName(`WorkSpaces: ${teams[0]?.name ?? "doesnt registration"}`)
			.setDesc(
				`Members:[${
					teams[0]?.members.map(
						(member: { user: { username: string } }) =>
							`${member.user.username},`
					) ?? "doesnt registration"
				}]`
			)

			.addButton((btn) => {
				btn.setButtonText("sync");

				btn.onClick(async () => {
					new Notice(`Loading...`, 3000);
					await this.configureListsLocally();
					createFolder(`ClickUp`);
					for (const team of teams) {
						createFolder(`ClickUp/${team.name}`);
						const spaces = await getSpaces(team.id);
						for (const space of spaces) {
							createFolder(
								`ClickUp/${team.name}/${space.name} - [${space.id}]`
							);
							const folders = await getFolders(space.id);

							for (const folder of folders || []) {
								createFolder(
									`ClickUp/${team.name}/${space.name} - [${space.id}]/${folder.name}`
								);
							}

							const folderless = await getFolderlessList(
								space.id
							);
							for (const list_item of folderless) {
								const vault = this.plugin.app.vault;
								const tasks = await getTasks(list_item.id);
								const rows = tasks.map(
									(task: any, index: any) => {
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
											priority: [
												"Low",
												"Medium",
												"High",
												"Critical",
											],
										};
									}
								);
								const tableHTML = createTable(rows);
								const filePath = `/ClickUp/${team.name}/${space.name} - [${space.id}]/${list_item.name}[${list_item.id}].md`;
								vault
									.create(filePath, tableHTML)
									.then(() => {})
									.catch((err: { message: string }) => {
										if (
											err.message ===
											"File already exists."
										) {
											const files =
												vault.getMarkdownFiles();
											for (
												let i = 0;
												i < files.length;
												i++
											) {
												const element = files[i];
												if (
													element.name ===
													`${list_item.name}[${list_item.id}].md`
												) {
													vault.delete(element);
													vault.create(
														filePath,
														tableHTML
													);
													new Notice(
														`Succes update ${list_item.name}`,
														3000
													);
												}
											}
										} else {
											console.error(err);
										}
									});
							}
						}
					}
				});
			});
		new Setting(containerEl)
			.setName(
				"User: " + this.plugin.settings.user?.username ??
					"doesnt registration"
			)
			.addButton((btn) =>
				btn.setButtonText("Log out").onClick(async () => {
					const icons = document.querySelectorAll(".clickable-icon");
					if (icons) {
						console.log("exist");
						icons.forEach((el) => {
							if (el.ariaLabel === "x ClickUp") {
								console.log("find");
								el.classList.remove("hideIcon");
							}
						});
					} else {
						console.log("dont exist");
					}

					this.plugin.clearUser();
					containerEl.empty();

					this.renderSignIn();
				})
			);
	}
	renderSignIn() {
		let { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName("Sign In Modal").addButton((button) =>
			button.setButtonText("Sign In").onClick(async () => {
				let modal = new MainAppModal(this.plugin, () => {});
				modal.renderAuthrization();
				modal.open();
			})
		);
	}
	async display(): Promise<void> {
		if (localStorage.getItem("token")) {
			this.renderSettings();
		}

		if (!localStorage.getItem("token")) {
			this.renderSignIn();
		}
	}
}
