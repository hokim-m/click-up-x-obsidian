export function applyStylesToContainer(
	container: HTMLDivElement,
	child: {
		element: HTMLSelectElement | HTMLInputElement;
		textContent: string;
	},
) {
	container.style.display = "flex";
	container.style.justifyContent = "space-between";
	container.style.alignItems = "center";
	container.style.height = "30px";
	container.style.width = "500px";

	const textContent = document.createElement("span");
	textContent.textContent = child.textContent;

	container.appendChild(textContent);
	container.appendChild(child.element);
}

export function createSelectWithOptions(
	options: { value: string; text: string }[],
	textContent: string,
	largeSelect: boolean = false,
) {
	const select = document.createElement("select");
	select.required = true;

	select.style.width = largeSelect ? "300px" : "200px";
	// select.style.padding = "8px";
	select.style.marginBottom = "10px";
	select.style.border = "1px solid #ccc";
	select.style.borderRadius = "5px";

	options.forEach((optionData, index) => {
		const option = document.createElement("option");
		option.value = optionData.value;
		option.text = optionData.text;

		if (index === 0) {
			option.disabled = true;
			option.selected = true;
		}
		select.appendChild(option);
	});

	return { element: select, textContent };
}

export function createInputWithPlaceholder(
	placeholderText: string,
	textContent: string,
	largeInput: boolean = false,
	inputType: "input" | "textarea" = "input",
) {
	const input = document.createElement(inputType);
	input.required = true;

	input.style.width = largeInput ? "300px" : "200px";
	input.style.padding = "8px";
	input.style.marginBottom = "10px";
	input.style.border = "1px solid #ccc";
	input.style.borderRadius = "5px";

	input.placeholder = placeholderText;

	return { element: input, textContent };
}

export function getElementValue(element: {
	element: HTMLInputElement | HTMLSelectElement;
	textContent: string;
}) {
	return element.element.value;
}

export function validateForm(container: HTMLDivElement): boolean {
	const requiredFields = container.querySelectorAll("[required]");

	for (const field of requiredFields) {
		if (
			!(field instanceof HTMLInputElement) &&
			!(field instanceof HTMLSelectElement)
		) {
			continue;
		}

		if (!field.value.trim()) {
			return false;
		}
	}

	return true;
}
