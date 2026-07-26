import { Contact } from "../types";
import { t } from "../i18n";

let activeCard: HTMLElement | null = null;
let outsideClickHandler: ((evt: MouseEvent) => void) | null = null;

export function closeContactCard(): void {
	if (activeCard) {
		activeCard.remove();
		activeCard = null;
	}
	if (outsideClickHandler) {
		document.removeEventListener("mousedown", outsideClickHandler, true);
		outsideClickHandler = null;
	}
}

function addField(container: HTMLElement, label: string, value: string): void {
	const row = container.createDiv({ cls: "harang-contact-card-row" });
	row.createSpan({ cls: "harang-contact-card-label", text: label });
	row.createSpan({ cls: "harang-contact-card-value", text: value });
}

function positionCard(card: HTMLElement, anchor: HTMLElement): void {
	const rect = anchor.getBoundingClientRect();
	const width = 280;
	const left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
	const openUpward = rect.bottom + 8 > window.innerHeight * 0.75;
	card.setCssStyles(
		openUpward
			? { position: "fixed", left, bottom: `${window.innerHeight - rect.top + 4}px` }
			: { position: "fixed", left, top: `${rect.bottom + 4}px` }
	);
}

export function openContactCard(contact: Contact | undefined, rawName: string, anchor: HTMLElement): void {
	closeContactCard();

	const card = createDiv({ cls: "harang-contact-card" });

	if (!contact) {
		card.createDiv({ cls: "harang-contact-card-title", text: rawName });
		card.createDiv({ cls: "harang-contact-card-missing", text: t("cardMissingContact") });
	} else {
		card.createDiv({ cls: "harang-contact-card-title", text: contact.fullName });
		const fields = card.createDiv({ cls: "harang-contact-card-fields" });
		if (contact.email) addField(fields, t("cardFieldEmail"), contact.email);
		if (contact.phone) addField(fields, t("cardFieldPhone"), contact.phone);
		if (contact.org) addField(fields, t("cardFieldOrg"), contact.org);
		card.createDiv({ cls: "harang-contact-card-source", text: contact.profileName });
	}

	document.body.appendChild(card);
	positionCard(card, anchor);
	activeCard = card;

	outsideClickHandler = (evt: MouseEvent) => {
		const target = evt.target as Node;
		if (card.contains(target) || anchor.contains(target)) return;
		closeContactCard();
	};
	window.setTimeout(() => {
		if (outsideClickHandler) document.addEventListener("mousedown", outsideClickHandler, true);
	}, 0);
}
