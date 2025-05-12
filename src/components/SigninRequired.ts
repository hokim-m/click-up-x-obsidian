import { App, Modal } from "obsidian";
import { MainAppModal } from "../signIn";
import ClickUpPlugin from "../main";

export class SigninRequiredModal extends Modal {
	constructor(app: App, private plugin?: ClickUpPlugin) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;

		// Create container with proper CSS classes
		const container = document.createElement("div");
		container.classList.add("signin-required-container");

		const title = document.createElement("h2");
		title.textContent = "Please Sign-in to create task";
		title.classList.add("signin-title");

		const content = document.createElement("p");
		content.textContent =
			"Please first click on the desired icon on the sidebar and register.";
		content.classList.add("signin-text");

		contentEl.appendChild(container);
		container.appendChild(title);
		container.appendChild(content);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
