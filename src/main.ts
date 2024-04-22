import { CreateTaskModal } from "./components/CreateTaskModal";
import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { MainAppModal } from "./signIn";
import "../styles.css";
import {
	createTask,
	getAuthorizedUser,
	getTasks,
	getTeams,
	showError,
} from "./api";
import * as dotenv from "dotenv";
import { SigninRequiredModal } from "src/components/SigninRequired";
import { ClickUpSettingTab } from "src/settings";
import { createTable } from "src/components/utils";
import { TCreateTask } from "./interfaces/api.types";
dotenv.config({
	debug: false,
});

type TClickUpRedirectParams = {
	action: string;
	code: string;
};

interface ClickUpPluginSettings {
	user: any;
	teams: any[];
	token: string;
	teamId: string;
}

const DEFAULT_SETTINGS: Partial<ClickUpPluginSettings> = {
	user: null,
	teamId: "",
	teams: [],
	token: "",
};

export default class ClickUpPlugin extends Plugin {
	settings: ClickUpPluginSettings;
	settingsTab: ClickUpSettingTab;
	modal: MainAppModal;
	async onload() {
		this.settingsTab = new ClickUpSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		this.registerObsidianProtocolHandler("ClickUpPlugin", async (e) => {
			const parameters = e as TClickUpRedirectParams;
			localStorage.setItem("CLICK_UP_CODE", parameters.code);
		});

		await this.loadSettings();
		this.modal = new MainAppModal(this);
		if (!Boolean(localStorage.getItem("click_up_token"))) {
			this.logOut();
		} else {
			this.saveSettings();
			this.settingsTab.renderSettings();

			this.fetchUser(JSON.stringify(localStorage.getItem("token")));
		}

		this.addCommand({
			id: "manual-create-task-clickUp",
			name: "Create ClickUp task",
			callback: async () => {
				if (!localStorage.getItem("click_up_token")) {
					new SigninRequiredModal(this.app).open();
				} else {
					new CreateTaskModal(this).open();
				}
			},
		});
		this.addCommand({
			id: "create-task-clickUp-selection",
			name: "Create ClickUp task from selection",
			// hotkeys: [{ modifiers: ["Mod" || "Ctrl", "Shift"], key: "c" }],
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const sel = editor.getSelection();
				console.log(sel, "Selection");
				const defaultList = localStorage.getItem("selectedList");

				if (!sel) {
					return;
				}
				if (!defaultList) {
					new Notice("Please select a sheet in settings");
					return;
				}
				const list = JSON.parse(defaultList);
				const requestData: TCreateTask = {
					name: sel,
					description: "",
					assignees: [],
					priority: 3,
				};
				try {
					const task = await createTask({
						data: requestData,
						listId: list.id,
					});
					console.log(task);
					if (task.err) {
						console.log(task);
						throw new Error(task.err);
					}
					setTimeout(() => {
						editor.replaceRange(
							` [task](${task.url})`,
							editor.getCursor("to")
						);
						new Notice("Created new task!", 3000);
						this.syncronizeListNote(list.id);
					}, 100);
				} catch (err) {
					const handlerorr = await showError(err);
					if (!handlerorr.isAuth) {
						this.logOut();
					}
				}
			},
		});
	}

	async logOut() {
		this.clearUser();
		this.settingsTab.renderSignIn();
	}
	async fetchUser(token: string) {
		const user = await getAuthorizedUser();
		const teams = await getTeams();
		await this.saveData({ user, token, teams });
		await this.loadSettings();
	}

	async clearUser() {
		localStorage.removeItem("lists");
		localStorage.removeItem("selectedList");
		localStorage.removeItem("click_up_token");
		localStorage.removeItem("selectedSpace");
		await this.saveData({ token: null, user: null, teams: [] });
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async syncronizeListNote(id: string) {
		const note = this.app.vault
			.getFiles()
			.filter((f) => f.path.startsWith("ClickUp"))
			.find((f) => f.path.includes(`[${id}]`));

		if (!note) {
			console.log("could not find note to sync");
			return;
		}

		const vault = this.app.vault;
		const tasks = await getTasks(id);
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
				assignees: task.assignees.map((u: any) => u.username),
				priority: task?.priority?.priority ?? "Low",
			};
		});
		const tableHTML = createTable(rows);
		const filePath = note!.path.toString();

		vault.delete(note!);
		vault.create(filePath, tableHTML);
	}
}
