import { Modal, Notice } from "obsidian";
import { SIGNIN_STEPS } from "./components/constants";
import { createInputWithPlaceholder } from "./utils";
import ClickUpPlugin from "./main";
import "../styles.css";
import { IList, ISpace } from "./interfaces";
import { AuthService, StorageService } from "./services";

export class MainAppModal extends Modal {
	result: string;
	plugin: ClickUpPlugin;
	onSubmit: (result: string) => void;
	private authService: AuthService;
	private storageService: StorageService;

	constructor(plugin: ClickUpPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.authService = AuthService.getInstance();
		this.storageService = StorageService.getInstance();
		this.renderAuthorization();
	}

	async loadSpaces(): Promise<ISpace[]> {
		const { teams } = this.plugin.settings;
		return await this.authService.loadAllSpaces(teams);
	}

	async configureListsLocally() {
		const { teams } = this.plugin.settings;
		await this.authService.configureListsLocally(teams);
	}

	async loadLists(): Promise<IList[]> {
		const { teams } = this.plugin.settings;
		return await this.authService.loadAllLists(teams);
	}

	renderAuthorization() {
		const { contentEl } = this;
		contentEl.empty();

		const plugin = this.plugin;

		const container = document.createElement("div");
		container.classList.add("signin-container");

		const title = document.createElement("h1");
		title.classList.add("signin-title");

		const description = document.createElement("p");
		description.classList.add("signin-description");

		const button = document.createElement("button");
		button.classList.add("signBtn");

		const steps = document.createElement("div");
		steps.classList.add("signin-steps");

		const input = createInputWithPlaceholder("Code", "Enter code", true);
		input.element.classList.add("createInputWithPlaceholder");

		SIGNIN_STEPS.forEach((stepItem) => {
			const step = document.createElement("p");
			step.textContent = stepItem;
			step.classList.add("signin-step");
			steps.appendChild(step);
		});

		title.textContent = "Click Up sync";
		description.textContent =
			"We need to retrieve authorization token from ClickUp to start synchronizing your tasks from Obsidian notes";
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
				button.classList.add("renderAuthrizationBtn");

				token = await this.authService.authenticate(inputValue);
				if (token) {
					await plugin.fetchUser(token);
					button.toggleClass("renderAuthrizationBtnSucces", true);
					button.textContent = "Success";
					new Notice("Success", 3000);
					this.plugin.settingsTab.renderSettings();
					this.close();
				}
			}
		});

		steps.appendChild(input.element);
		container.appendChild(title);
		container.appendChild(description);
		container.appendChild(steps);
		container.appendChild(button);
		contentEl.appendChild(container);
	}

	async addDefaultListSelectionEl(wrapper: HTMLElement) {
		const selectedList = this.storageService.getSelectedList();
		const selectThisListContent = document.createElement("p");
		selectThisListContent.classList.add("list-selection-label");

		const disabledOption = document.createElement("option");
		const listSelect = document.createElement("select");
		listSelect.classList.add("createSelectWithOptions", "largeSelect");

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

			if (selectedList) {
				listSelect.value = selectedList.name;
			}
		}, 1);

		listSelect.addEventListener("change", () => {
			const id = listSelect.options[listSelect.selectedIndex].id;
			this.storageService.setSelectedList({
				name: listSelect.value,
				id,
			});
		});

		const container = document.createElement("div");
		container.appendChild(selectThisListContent);
		container.appendChild(listSelect);
		container.classList.add("addDefaultListSelectionEl-container");
		wrapper.appendChild(container);
	}

	async addSpacesSelectionEl(wrapper: HTMLElement) {
		const selectedSpace = this.storageService.getSelectedSpace();
		const selectThisListContent = document.createElement("p");
		selectThisListContent.classList.add("space-selection-label");

		const disabledOption = document.createElement("option");
		const listSelect = document.createElement("select");
		listSelect.classList.add("createSelectWithOptions", "largeSelect");

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
				listSelect.value = selectedSpace.name;
			}
		}, 100);

		listSelect.addEventListener("change", () => {
			const id = listSelect.options[listSelect.selectedIndex].id;
			this.storageService.setSelectedSpace({
				name: listSelect.value,
				id,
			});
		});

		const container = document.createElement("div");
		container.appendChild(selectThisListContent);
		container.appendChild(listSelect);
		container.classList.add("addDefaultListSelectionEl-container");
		wrapper.appendChild(container);
	}
}
