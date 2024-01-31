import { Modal } from "obsidian";
import "../main.css";
import {
	applyStylesToContainer,
	createInputWithPlaceholder,
	createSelectWithOptions,
	getElementValue,
	validateForm,
} from "./utils";
import {
	firstAssigneeOption,
	firstListOption,
	prioritySelectOptions,
} from "./constants";
import { createTask, getListMembers, getTasks } from "api";
import MyPlugin from "main";
import { TCreateTask, TMember } from "api.types";
import { createTable } from "../signIn";

export class CreateTaskModal extends Modal {
	plugin: MyPlugin;
	constructor(plugin: MyPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	async syncronizeListNote(id: string) {
		// console.log(app.vault)
		const note = app.vault
			.getFiles()
			.filter((f) => f.path.startsWith("ClickUp"))
			.find((f) => f.path.includes(`[${id}]`));

		if (!note) {
			console.log('could not find note to sync')
			return;
		}

		const vault = this.plugin.app.vault;
		const tasks = await getTasks(id);
		const rows = tasks.map((task: any, index: any) => {
			return {
				id: task.id,
				order: index + 1,
				name: task.name,
				status: task.status.status,
				date_created: new Date(
					Number(task.date_created)
				).toLocaleString("en-US"),
				creator: task.creator.username,
				assignees: task.assignees.map((u: any) => u.username),
				priority: ["Low", "Medium", "High", "Critical"],
			};
		});
		const tableHTML = createTable(rows);
		const filePath = note!.path.toString();
		console.log(filePath);
		vault.delete(note!)
		vault.create(filePath, tableHTML);
	}

	onOpen() {
		const lists: { id: string; name: string }[] = JSON.parse(
			localStorage.getItem("lists")
		);
		const listSelects = lists.map((item) => ({
			text: item.name,
			value: item.id,
		}));

		let listMember: TMember[] = [];

		const listSelectOptions = [firstListOption, ...listSelects];

		const { contentEl } = this;

		const container = document.createElement("div");
		const title = document.createElement("h2");
		title.textContent = "Create task";
		container.appendChild(title);

		const listSelect = createSelectWithOptions(
			listSelectOptions,
			"Select list",
			true
		);
		const assigneeSelectOptions = [firstAssigneeOption, ...listMember];

		listSelect.element.addEventListener("change", async () => {
			console.log("list select value", listSelect.element.value);

			const members = await getListMembers(listSelect.element.value);

			listMember = members.map((member) => ({
				...member,
				value: member.id,
				text: member.username,
			}));

			assigneeSelectOptions.length = 0;
			assigneeSelectOptions.push(...[firstAssigneeOption, ...listMember]);

			// Refresh the assigneeSelect with updated options
			assigneeSelect.element.innerHTML = assigneeSelectOptions
				.map(
					(option) =>
						`<option value="${option.value}">${option.text}</option>`
				)
				.join("");

			console.log("listMember", listMember);
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
			const createdTask = await createTask({
				data: requestData,
				listId: list,
			});
			btn.textContent = "Success";
			btn.style.backgroundColor = "green";

			this.close();

			this.syncronizeListNote(list);
		} catch (error) {
			console.log(error);
			btn.textContent = "Error";
			btn.style.backgroundColor = "red";
		} finally {
			btn.disabled = false;
		}
	}
}
