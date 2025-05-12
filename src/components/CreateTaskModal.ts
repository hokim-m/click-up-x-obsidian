import { Modal, Notice } from "obsidian";
import "../../styles.css";
import {
	applyStylesToContainer,
	createInputWithPlaceholder,
	createSelectWithOptions,
	getElementValue,
	validateForm,
} from "../utils";
import {
	firstAssigneeOption,
	firstListOption,
	prioritySelectOptions,
} from "./constants";
import { IList, TCreateTask, TMember } from "../interfaces";
import ClickUpPlugin from "../main";
import { ApiService, AuthService, TaskService } from "../services";

export class CreateTaskModal extends Modal {
	plugin: ClickUpPlugin;
	private apiService: ApiService;
	private authService: AuthService;
	private taskService: TaskService;

	constructor(plugin: ClickUpPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.apiService = ApiService.getInstance();
		this.authService = AuthService.getInstance();
		this.taskService = TaskService.getInstance();
		this.configureListsLocally();
	}

	async loadLists(): Promise<IList[]> {
		const { teams } = this.plugin.settings;
		return await this.authService.loadAllLists(teams);
	}

	async configureListsLocally() {
		const { teams } = this.plugin.settings;
		await this.authService.configureListsLocally(teams);
	}

	async onOpen() {
		const { contentEl } = this;
		let listSelects: { value: string | number; text: string }[] | null =
			null;
		const loading = contentEl.createEl("h3", { text: "Loading..." });

		try {
			const lists: { id: string; name: string }[] =
				await this.loadLists();
			listSelects = lists.map((item) => ({
				text: item.name,
				value: item.id,
			}));
			contentEl.removeChild(loading);
		} catch (error) {
			loading.textContent = "Something went wrong";
		}

		if (!listSelects) {
			return;
		}

		let listMember: TMember[] = [];
		const listSelectOptions = [firstListOption, ...listSelects];

		const container = document.createElement("div");
		container.classList.add("task-modal-container");

		const title = document.createElement("h2");
		title.textContent = "Create task";
		title.classList.add("task-modal-title");
		container.appendChild(title);

		const listSelect = createSelectWithOptions(
			listSelectOptions,
			"Select list",
			true
		);
		listSelect.element.classList.add("createSelectWithOptions");

		const assigneeSelectOptions = [firstAssigneeOption, ...listMember];

		listSelect.element.addEventListener("change", async () => {
			const members = await this.apiService.getListMembers(
				listSelect.element.value
			);

			listMember = members.map((member) => ({
				...member,
				value: member.id,
				text: member.username,
			}));

			assigneeSelectOptions.length = 0;
			assigneeSelectOptions.push(...[...listMember]);

			// Refresh the assigneeSelect with updated options
			assigneeSelectOptions.map((option) =>
				assigneeSelect.element.createEl("option", {
					value: String(option.value),
					text: option.text,
				})
			);
		});

		const assigneeSelect = createSelectWithOptions(
			//@ts-ignore
			assigneeSelectOptions,
			"Select assignee",
			true
		);

		const prioritySelect = createSelectWithOptions(
			prioritySelectOptions,
			"Select priority",
			true
		);

		const titleInput = createInputWithPlaceholder(
			"Title",
			"Enter title",
			true
		);

		const descriptionInput = createInputWithPlaceholder(
			"Description",
			"Enter description",
			true,
			"textarea"
		);

		const containerChilds = [
			listSelect,
			titleInput,
			descriptionInput,
			assigneeSelect,
			prioritySelect,
		];

		containerChilds.forEach((child: any) => {
			const wrapperDiv = document.createElement("div");
			wrapperDiv.classList.add("input-container");
			applyStylesToContainer(wrapperDiv, child);
			container.appendChild(wrapperDiv);
			container.appendChild(document.createElement("br"));
		});

		const submitButton = document.createElement("button");
		submitButton.textContent = "Add";
		submitButton.classList.add("submit-btn");

		const errorMessage = container.createEl("p", {
			cls: "error-message",
			text: "Please fill in all required fields!",
		});
		errorMessage.toggleClass("errorMessageHide", true);

		submitButton.addEventListener("click", () => {
			console.clear();
			if (validateForm(container)) {
				errorMessage.toggleClass("errorMessageHide", true);
				this.handleFormSubmit(
					{
						title: getElementValue(titleInput),
						assignee: getElementValue(assigneeSelect),
						description: getElementValue(descriptionInput),
						list: getElementValue(listSelect),
						priority: getElementValue(prioritySelect),
					},
					submitButton
				);
			} else {
				errorMessage.toggleClass("errorMessageHide", false);
			}
		});

		const submitContainer = container.createEl("div", {
			cls: "submit-container",
		});
		submitContainer.classList.add("submitContainer");
		submitContainer.appendChild(submitButton);
		container.appendChild(submitContainer);
		contentEl.appendChild(container);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private async handleFormSubmit(
		data: {
			title: string;
			description: string;
			list: string;
			assignee: string;
			priority: string;
		},
		btn: HTMLButtonElement
	) {
		const { assignee, description, list, priority, title } = data;
		btn.textContent = "Loading...";
		btn.disabled = true;

		const requestData: TCreateTask = {
			name: title,
			description: description,
			assignees: [Number(assignee)],
			priority: Number(priority),
		};

		try {
			const result = await this.taskService.createTask(list, requestData);

			if (result.error) {
				throw new Error(result.error.message);
			}

			btn.textContent = "Success";
			btn.toggleClass("createTaskSucces", true);
			// new Notice("Created new task!", 3000);
			this.close();
			this.plugin.syncronizeListNote(list);
		} catch (error) {
			console.log(error);
			btn.textContent = "Error";
			btn.toggleClass("createTaskError", true);
		} finally {
			btn.disabled = false;
		}
	}
}
