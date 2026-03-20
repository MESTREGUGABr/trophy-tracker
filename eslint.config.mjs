import obsidianPlugin from "eslint-plugin-obsidianmd";
import { DEFAULT_ACRONYMS } from "eslint-plugin-obsidianmd/dist/lib/rules/ui/acronyms.js";
import tseslint from "typescript-eslint";

const psnAcronyms = [...DEFAULT_ACRONYMS, "PSN", "NPSSO"];

export default tseslint.config(
	...obsidianPlugin.configs.recommended,
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"obsidianmd/ui/sentence-case": [
				"error",
				{
					enforceCamelCaseLower: true,
					acronyms: psnAcronyms,
				},
			],
		},
	},
);
