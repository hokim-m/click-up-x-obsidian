import { Vault } from "obsidian";

/**
 * Creates a folder in the vault
 */
export const createFolder = ({
	folder,
	vault,
}: {
	folder: string;
	vault: Vault;
}) => {
	try {
		vault.createFolder(folder);
	} catch (e) {
		console.log(`Folder ${folder} already exists`);
	}
};

/**
 * Creates an HTML table from row data
 */
export const createTable = (rows: any[]) => {
	if (!rows.length) {
		return "No tasks found";
	}

	const headers = Object.keys(rows[0]);
	let tableHTML = "| ";
	headers.forEach((header) => {
		tableHTML += `${header} | `;
	});
	tableHTML += "\n|";
	headers.forEach(() => {
		tableHTML += " --- |";
	});
	tableHTML += "\n";

	rows.forEach((row) => {
		tableHTML += "| ";
		headers.forEach((header) => {
			const value = Array.isArray(row[header])
				? row[header].join(", ")
				: row[header];
			tableHTML += `${value} | `;
		});
		tableHTML += "\n";
	});

	return tableHTML;
};

/**
 * Creates an input with a label and placeholder
 */
export const createInputWithPlaceholder = (
	label: string,
	placeholder: string,
	required = false,
	type = "input"
) => {
	const element =
		type === "textarea"
			? document.createElement("textarea")
			: document.createElement("input");

	element.placeholder = placeholder;

	// Apply CSS classes
	element.classList.add("createInputWithPlaceholder");
	if (type === "textarea") {
		element.classList.add("largeInput");
	}

	const labelElement = document.createElement("label");
	labelElement.textContent = label;
	labelElement.classList.add("input-label");

	if (required) {
		element.classList.add("required");
		labelElement.classList.add("required-label");
	}

	return { element, label: labelElement };
};

/**
 * Creates a select element with options
 */
export const createSelectWithOptions = (
	options: { value: string | number; text: string }[],
	placeholder = "",
	required = false
) => {
	const element = document.createElement("select");
	element.classList.add("createSelectWithOptions");

	const labelElement = document.createElement("label");
	labelElement.textContent = placeholder;
	labelElement.classList.add("select-label");

	if (required) {
		element.classList.add("required");
		labelElement.classList.add("required-label");
	}

	options.forEach((option) => {
		const optionElement = document.createElement("option");
		optionElement.value = String(option.value);
		optionElement.text = option.text;
		element.appendChild(optionElement);
	});

	return { element, label: labelElement };
};

/**
 * Applies styles to a container element
 */
export const applyStylesToContainer = (
	container: HTMLElement,
	component: { element: HTMLElement; label: HTMLElement }
) => {
	container.classList.add("input-container", "applyStylesToContainer");
	container.appendChild(component.label);
	container.appendChild(component.element);
};

/**
 * Gets the value of an element
 */
export const getElementValue = (component: {
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}) => {
	return component.element.value;
};

/**
 * Validates form inputs
 */
export const validateForm = (container: HTMLElement) => {
	const requiredInputs = container.querySelectorAll(".required");
	let isValid = true;

	requiredInputs.forEach((input: any) => {
		if (!input.value) {
			isValid = false;
		}
	});

	return isValid;
};
