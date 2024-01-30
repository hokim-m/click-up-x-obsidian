import { App, Modal, prepareQuery } from "obsidian";
import "../main.css";
import {
	applyStylesToContainer,
	createInputWithPlaceholder,
	createSelectWithOptions,
	getElementValue,
	validateForm,
} from "./utils";
import {
	assigneeSelectOptions,
	listSelectOptions,
	prioritySelectOptions,
} from "./constants";

export class CreateTaskModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		const container = document.createElement("div");
		const title = document.createElement("h2");
		title.textContent = "Create task";
		container.appendChild(title);

		const listSelect = createSelectWithOptions(
			listSelectOptions,
			"Select list",
			true,
		);
		const assigneeSelect = createSelectWithOptions(
			assigneeSelectOptions,
			"Select assignee",
			true,
		);
		const prioritySelect = createSelectWithOptions(
			prioritySelectOptions,
			"Select priority",
			true,
		);

		const titleInput = createInputWithPlaceholder(
			"Title",
			"Enter title",
			true,
		);

		const descriptionInput = createInputWithPlaceholder(
			"Description",
			"Enter description",
			true,
			"textarea",
		);

		const containerChilds = [
			listSelect,
			titleInput,
			descriptionInput,
			assigneeSelect,
			prioritySelect,
		];

		containerChilds.forEach((child) => {
			const wrapperDiv = document.createElement("div");

			applyStylesToContainer(wrapperDiv, child);

			container.appendChild(wrapperDiv);
			container.appendChild(document.createElement("br"));
		});

		const submitButton = document.createElement("button");
		submitButton.textContent = "Add";
		submitButton.classList.add("submit-btn");

		const errorMessage = document.createElement("p");
		container.appendChild(errorMessage);

		submitButton.addEventListener("click", () => {
			console.clear();
			if (validateForm(container)) {
				errorMessage.style.visibility = "hidden";
				this.handleFormSubmit({
					title: getElementValue(titleInput),
					assignee: getElementValue(assigneeSelect),
					description: getElementValue(descriptionInput),
					list: getElementValue(listSelect),
					priority: getElementValue(prioritySelect),
				});
			} else {
				errorMessage.style.color = "red";
				errorMessage.style.fontSize = "14px";
				errorMessage.textContent =
					"Please fill in all required fields!";
			}
		});

		const submitContainer = document.createElement("div");
		submitContainer.appendChild(submitButton);

		submitContainer.style.textAlign = "right";
		submitContainer.style.paddingRight = "25px";

		container.appendChild(submitContainer);

		contentEl.appendChild(container);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private handleFormSubmit(data: {
		title: string;
		description: string;
		list: string;
		assignee: string;
		priority: string;
	}) {
		const { assignee, description, list, priority, title } = data;
		console.log("Title:", title);
		console.log("Description:", description);
		console.log("List:", list);
		console.log("Assignee:", assignee);
		console.log("Priority:", priority);
	}
}
