import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from "obsidian";
import { CardDavProfile, Contact } from "./types";
import { ContactStore } from "./carddav/store";

const TRIGGER = "{{hrcard:";
const MAX_SUGGESTIONS = 10;

type HrcardSuggestion = { stage: "profile"; name: string } | { stage: "contact"; contact: Contact };

/**
 * Types "{{hrcard:" and walks profile name -> contact name, one
 * colon-separated segment at a time - there's no separate free-text
 * trigger. Each selection appends to the same reference and re-triggers
 * the next stage, finally inserting
 * `{{hrcard:<profileName>:<uid>}}`.
 */
export class HrcardEditorSuggest extends EditorSuggest<HrcardSuggestion> {
	constructor(app: App, private profiles: () => CardDavProfile[], private store: ContactStore) {
		super(app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		const triggerIndex = line.lastIndexOf(TRIGGER);
		if (triggerIndex === -1) return null;

		const query = line.slice(triggerIndex + TRIGGER.length);
		// A "}" here means the cursor has moved past an already-closed
		// reference earlier on the line - don't reopen it.
		if (query.includes("}")) return null;

		return {
			start: { line: cursor.line, ch: triggerIndex },
			end: cursor,
			query,
		};
	}

	getSuggestions(context: EditorSuggestContext): HrcardSuggestion[] {
		const segments = context.query.split(":");

		if (segments.length === 1) {
			return this.matchingProfiles(segments[0]);
		}

		if (segments.length === 2) {
			void this.store.refreshIfStale();
			const profileName = segments[0];
			const query = segments[1];
			const isInitialList = query.trim().length === 0;
			return this.store
				.search(query, isInitialList ? MAX_SUGGESTIONS : undefined, profileName)
				.map((contact) => ({ stage: "contact" as const, contact }));
		}

		return [];
	}

	private matchingProfiles(query: string): HrcardSuggestion[] {
		const q = query.trim().toLowerCase();
		return this.profiles()
			.map((p) => p.name)
			.filter((name) => name.toLowerCase().includes(q))
			.slice(0, MAX_SUGGESTIONS)
			.map((name) => ({ stage: "profile" as const, name }));
	}

	renderSuggestion(suggestion: HrcardSuggestion, el: HTMLElement): void {
		if (suggestion.stage === "profile") {
			el.addClass("harang-contacts-suggestion");
			el.setText(suggestion.name);
			return;
		}

		const { contact } = suggestion;
		el.addClass("harang-contacts-suggestion");
		el.createDiv({ cls: "harang-contacts-suggestion-name", text: contact.fullName });

		const hints: string[] = [];
		if (contact.email) hints.push(contact.email);
		if (contact.org) hints.push(contact.org);
		if (hints.length > 0) {
			el.createDiv({ cls: "harang-contacts-suggestion-email", text: hints.join(" · ") });
		}
	}

	selectSuggestion(suggestion: HrcardSuggestion, _evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;
		const { editor, start, end, query } = this.context;
		const segments = query.split(":");

		let text: string;
		let closesReference = false;
		if (suggestion.stage === "profile") {
			text = `${TRIGGER}${suggestion.name}:`;
		} else {
			text = `${TRIGGER}${segments[0]}:${suggestion.contact.uid}}}`;
			closesReference = true;
		}

		editor.replaceRange(text, start, end);
		const afterText = { line: start.line, ch: start.ch + text.length };

		if (closesReference) {
			// Obsidian's editor likely auto-closed the "{{" from the trigger
			// with a "}}" right after the original `end` position. Our own
			// text already closes the reference, so consume up to two stray
			// "}" left behind instead of leaving them in the note.
			for (let i = 0; i < 2; i++) {
				const nextChar = editor.getRange(afterText, { line: afterText.line, ch: afterText.ch + 1 });
				if (nextChar !== "}") break;
				editor.replaceRange("", afterText, { line: afterText.line, ch: afterText.ch + 1 });
			}
		}

		editor.setCursor(afterText);
	}
}
