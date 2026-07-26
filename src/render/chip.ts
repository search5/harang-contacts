import { Contact } from "../types";
import { openContactCard } from "./card";

export function createContactChip(contact: Contact | undefined, rawName: string): HTMLElement {
	const chip = createSpan({ cls: "harang-contact-chip" });
	if (!contact) chip.addClass("harang-contact-chip-unresolved");
	chip.setAttribute("tabindex", "0");
	chip.setAttribute("role", "button");

	chip.createSpan({ cls: "harang-contact-chip-name", text: contact?.fullName ?? rawName });
	if (contact?.email) {
		chip.createSpan({ cls: "harang-contact-chip-email", text: contact.email });
	}

	const open = (evt: Event) => {
		evt.preventDefault();
		evt.stopPropagation();
		openContactCard(contact, rawName, chip);
	};
	chip.addEventListener("click", open);
	chip.addEventListener("keydown", (evt: KeyboardEvent) => {
		if (evt.key === "Enter" || evt.key === " ") open(evt);
	});

	return chip;
}
