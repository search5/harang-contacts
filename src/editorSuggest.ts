import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import { Contact } from "./types";
import { ContactStore } from "./carddav/store";
import { formatContactRef } from "./render/contactRef";

const TRIGGER = "@contact[";
const MAX_SUGGESTIONS = 10;

export class ContactEditorSuggest extends EditorSuggest<Contact> {
	constructor(app: App, private store: ContactStore) {
		super(app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		const triggerIndex = line.lastIndexOf(TRIGGER);
		if (triggerIndex === -1) return null;

		const afterTrigger = line.slice(triggerIndex + TRIGGER.length);
		if (afterTrigger.includes("]")) return null;

		const queryStart: EditorPosition = { line: cursor.line, ch: triggerIndex + TRIGGER.length };
		return {
			start: queryStart,
			end: cursor,
			query: afterTrigger,
		};
	}

	getSuggestions(context: EditorSuggestContext): Contact[] {
		void this.store.refreshIfStale();
		const isInitialList = context.query.trim().length === 0;
		return this.store.search(context.query, isInitialList ? MAX_SUGGESTIONS : undefined);
	}

	renderSuggestion(contact: Contact, el: HTMLElement): void {
		el.addClass("harang-contacts-suggestion");
		el.createDiv({ cls: "harang-contacts-suggestion-name", text: contact.fullName });

		const isAmbiguousName = this.store.getAll().filter((c) => c.fullName === contact.fullName).length > 1;
		const hints: string[] = [];
		if (contact.email) hints.push(contact.email);
		if (isAmbiguousName) {
			if (contact.org) hints.push(contact.org);
			hints.push(contact.profileName);
		}
		if (hints.length > 0) {
			el.createDiv({ cls: "harang-contacts-suggestion-email", text: hints.join(" · ") });
		}
	}

	selectSuggestion(contact: Contact, _evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;
		const { editor, start, end } = this.context;
		const ref = formatContactRef(contact);
		editor.replaceRange(ref, start, end);

		// Obsidian's editor may auto-close the `[` from the trigger with a `]`
		// right after the original `end` position. Skip over it instead of
		// inserting a second one when it's already there.
		const afterRef: EditorPosition = { line: start.line, ch: start.ch + ref.length };
		const nextChar = editor.getRange(afterRef, { line: afterRef.line, ch: afterRef.ch + 1 });
		if (nextChar !== "]") {
			editor.replaceRange("]", afterRef, afterRef);
		}
		editor.setCursor({ line: afterRef.line, ch: afterRef.ch + 1 });
	}
}
