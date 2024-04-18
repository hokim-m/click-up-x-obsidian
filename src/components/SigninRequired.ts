import { App, Modal } from "obsidian";

export class SigninRequiredModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		const container = document.createElement("div");
		const title = document.createElement("h2");
		const content = document.createElement("p");

		content.textContent =
			"Please first click on the desired icon on the sidebar and register.";

		title.textContent = "Please Sign-in to create task";

		contentEl.appendChild(container);
		container.appendChild(title);
		container.appendChild(content);
	}
}
