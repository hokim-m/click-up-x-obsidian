import { CreateTaskModal } from "./components/CreateTaskModal";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { MainAppModal } from "./signIn";
import "./main.css";
import { getAuthorizedUser, getTeams } from "./api";

import * as dotenv from "dotenv";
import { SigninRequiredModal } from "components/SigninRequired";

const basePath = (app.vault.adapter as any).basePath;
dotenv.config({
	path: `${basePath}/.obsidian/plugins/click-up-x-obsidian/.env`,
	debug: false,
});

// Remember to rename these classes and interfaces!

type TClickUpRedirectParams = {
	action: string;
	code: string;
};

interface MyPluginSettings {
	user: any;
	teams: any[];
	token: string;
	teamId: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	user: null,
	teamId: "",
	teams: [],
	token: "",
};

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log("loaded?");

		// Returns ClickUp code
		this.registerObsidianProtocolHandler("plugin", async (e) => {
			const parameters = e as TClickUpRedirectParams;
			localStorage.setItem("CLICK_UP_CODE", parameters.code);
		});

		function getVaultPath() {
			const vaultAdapter = app.vault.adapter;
			if (vaultAdapter) {
				return vaultAdapter.getBasePath();
			} else {
				return null;
			}
		}

		// Example usage
		const vaultPath = getVaultPath();
		console.log(`Vault Path: ${vaultPath}`);
		localStorage.setItem("path", vaultPath);

		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new MainAppModal(this, (result) => {
					new Notice(`Hello, ${result}!`);
				}).open();
			},
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "create-task",
			name: "Create ClickUp task",
			callback: async () => {
				if (!this.settings.token) {
					new SigninRequiredModal(this.app).open();
				} else {
					new CreateTaskModal(this).open();
				}
			},
		});

		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: async () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// // This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			// console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
		);
	}

	onunload() {}

	async fetchUser(token: string) {
		const user = await getAuthorizedUser();
		const teams = await getTeams();
		await this.saveData({ user, token, teams });

		await this.loadSettings();
	}

	async clearUser() {
		localStorage.removeItem("token");
		await this.saveData({ token: "", user: null, teams: [] });
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
