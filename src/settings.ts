import {
	getAllFolders,
	getFolderlessList,
	getFolders,
	getList,
	getSpaces,
	getTasks,
	showError,
} from "src/api";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { createFolder, createTable } from "./components/utils";
import ClickUpPlugin from "src/main";
import { IList, ISpace } from "./interfaces/api.types";

export class ClickUpSettingTab extends PluginSettingTab {
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
		let lists: IList[] = [];

		for (const team of teams) {
			const spaces = await getSpaces(team.id);

			for (const space of spaces) {
				const folders = await getAllFolders(space.id);
				const folderlessLists = await getFolderlessList(space.id);
				lists.push(...folderlessLists);
				for (const folder of folders) {
					const folderlists = await getList(folder.id);

					lists.push(...folderlists);
				}
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
		new Setting(containerEl)
			.setName("Select space")
			.addDropdown(async (dropdown) => {
				dropdown.setDisabled(true);
				try {
					// title.textContent = "Loadings...";
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
					const handlerorr = await showError(error);
					if (!handlerorr.isAuth) {
						this.plugin.logOut();
					}
					dropdown.disabled;
					this.renderSignIn();
					// title.textContent = "Something get wrong, please re-login";
					dropdown.addOption("", "error");
				}
			});
		new Setting(containerEl)
			.setName("Select default sheet")

			.addDropdown(async (dropdown) => {
				dropdown.setDisabled(true);
				try {
					const lists = await this.loadLists();
					let selectedSheet = "";
					lists.forEach((list) => {
						dropdown.addOption(list.id.toString(), list.name);
					});
					if (localStorage.getItem("selectedList")) {
						const selectedList =
							localStorage.getItem("selectedList");
						selectedSheet = selectedList ?? lists[0].id;
					} else {
					}
					dropdown.setValue(selectedSheet);
					dropdown.onChange((value) => {
						localStorage.setItem(
							"selectedList",
							JSON.stringify(value)
						);
					});
					dropdown.setDisabled(false);
				} catch (error) {
					const handlerorr = await showError(error);
					if (!handlerorr.isAuth) {
						this.plugin.logOut();
					}
					this.renderSignIn();
					dropdown.disabled;
					dropdown.addOption("", "error");
				}
			})
			.setDesc("");
		new Setting(containerEl)
			.setName(`WorkSpaces: ${teams[0]?.name}`)
			.setDesc(
				`Members:[${teams[0]?.members.map(
					(member: { user: { username: string } }) =>
						`${member.user.username},`
				)}]`
			)
			.addButton((btn) => {
				btn.setButtonText("sync");

				btn.onClick(async () => {
					new Notice(`Loading...`, 3000);
					await this.configureListsLocally();
					createFolder({ folder: `ClickUp`, vault: this.app.vault });
					for (const team of teams) {
						createFolder({
							folder: `ClickUp/${team.name}`,
							vault: this.app.vault,
						});
						const spaces = await getSpaces(team.id);
						for (const space of spaces) {
							createFolder({
								folder: `ClickUp/${team.name}/${space.name} - [${space.id}]`,
								vault: this.app.vault,
							});
							const folders = await getFolders(space.id);

							for (const folder of folders || []) {
								createFolder({
									folder: `ClickUp/${team.name}/${space.name} - [${space.id}]/${folder.name}`,
									vault: this.app.vault,
								});
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
											priority:
												task?.priority?.priority ??
												"Low",
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
					this.plugin.logOut();
				})
			);
	}
	renderSignIn() {
		let { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName("Sign In").addButton((button) =>
			button.setButtonText("Sign In").onClick(async () => {
				// new MainAppModal(this.plugin).open();
				this.plugin.modal.open();
				console.log("clicked");
			})
		);
	}
	async display(): Promise<void> {
		if (localStorage.getItem("click_up_token")) {
			this.renderSettings();
		}

		if (!localStorage.getItem("click_up_token")) {
			this.renderSignIn();
		}
	}
}
