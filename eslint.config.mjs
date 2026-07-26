import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
	},
	{
		ignores: ["main.js", "esbuild.config.mjs", "version-bump.mjs", "eslint.config.mjs", "node_modules/**", "docs/**"],
	},
	{
		// settingsTab.ts intentionally supports both the legacy imperative
		// display() API (Obsidian < 1.13.0) and the declarative
		// getSettingDefinitions() API (Obsidian >= 1.13.0) side by side, per
		// the pattern documented directly on SettingTab.display() in
		// obsidian.d.ts. That means it references 1.13.0+-only members
		// (update(), etc.) that are only ever reached when a >=1.13.0 host
		// actually calls them, and it must keep the deprecated display()/
		// setWarning() overloads as the only viable API for hosts below
		// 1.13.0. Both rules are static and can't see that version gating,
		// so they're disabled for this one file rather than every call site.
		files: ["src/settingsTab.ts"],
		rules: {
			"@typescript-eslint/no-deprecated": "off",
			"obsidianmd/no-unsupported-api": "off",
		},
	}
);
