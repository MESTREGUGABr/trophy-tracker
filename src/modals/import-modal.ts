import { App, Modal, Setting, Notice } from "obsidian";
import {
	AchievementTrackerSettings,
	GameFrontmatter,
	Trophy,
	TrophyType,
} from "../types";

const VALID_TYPES: TrophyType[] = ["bronze", "silver", "gold", "platinum"];

export class ImportModal extends Modal {
	private gameName = "";
	private platform: string;
	private rawText = "";
	private parsedTrophies: Trophy[] = [];
	private previewEl: HTMLElement | null = null;

	constructor(
		app: App,
		private settings: AchievementTrackerSettings,
		private onSubmit: (data: GameFrontmatter) => void
	) {
		super(app);
		this.platform = settings.defaultPlatform;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("at-import-modal");
		contentEl.createEl("h2", { text: "Import Trophies" });

		new Setting(contentEl).setName("Game name").addText((text) =>
			text.setPlaceholder("e.g. God of War Ragnarök").onChange((value) => {
				this.gameName = value;
			})
		);

		new Setting(contentEl).setName("Platform").addDropdown((dropdown) =>
			dropdown
				.addOptions({
					PS5: "PS5",
					PS4: "PS4",
					PS3: "PS3",
					"PS Vita": "PS Vita",
				})
				.setValue(this.platform)
				.onChange((value) => {
					this.platform = value;
				})
		);

		const formatInfo = contentEl.createDiv({ cls: "at-import-info" });
		formatInfo.createEl("p", {
			text: "Paste trophies, one per line. Supported formats:",
		});
		const list = formatInfo.createEl("ul");
		list.createEl("li", { text: "Trophy Name, type" });
		list.createEl("li", { text: "Trophy Name\\ttype (tab-separated)" });
		list.createEl("li", { text: "Trophy Name (type auto-detected as bronze)" });
		formatInfo.createEl("p", {
			text: "Types: bronze, silver, gold, platinum",
			cls: "at-import-hint",
		});

		const textareaContainer = contentEl.createDiv({
			cls: "at-import-textarea-container",
		});
		const textarea = textareaContainer.createEl("textarea", {
			cls: "at-import-textarea",
			attr: {
				rows: "10",
				placeholder:
					"The Promise, gold\nBear Witness\tsilver\nPlatinum Trophy, platinum\nSome Easy Trophy",
			},
		});
		textarea.addEventListener("input", () => {
			this.rawText = textarea.value;
		});

		const buttonRow = contentEl.createDiv({ cls: "at-import-buttons" });

		const parseBtn = buttonRow.createEl("button", {
			text: "Parse & Preview",
			cls: "at-btn",
		});
		parseBtn.addEventListener("click", () => {
			this.parsedTrophies = this.parseTrophyText(this.rawText);
			this.renderPreview();
		});

		const importBtn = buttonRow.createEl("button", {
			text: "Import",
			cls: "at-btn at-btn-primary",
		});
		importBtn.addEventListener("click", () => {
			if (!this.gameName.trim()) {
				new Notice("Please enter a game name.");
				return;
			}
			if (this.parsedTrophies.length === 0) {
				this.parsedTrophies = this.parseTrophyText(this.rawText);
			}
			if (this.parsedTrophies.length === 0) {
				new Notice("No trophies to import. Check your input format.");
				return;
			}
			this.onSubmit({
				game: this.gameName.trim(),
				platform: this.platform,
				status: "backlog",
				trophies: this.parsedTrophies,
			});
			new Notice(
				`Imported ${this.parsedTrophies.length} trophies for "${this.gameName.trim()}".`
			);
			this.close();
		});

		this.previewEl = contentEl.createDiv({ cls: "at-import-preview" });
	}

	private parseTrophyText(text: string): Trophy[] {
		const lines = text
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		const trophies: Trophy[] = [];

		for (const line of lines) {
			let name: string;
			let type: TrophyType = "bronze";

			// Try tab-separated first
			if (line.includes("\t")) {
				const parts = line.split("\t");
				name = parts[0].trim();
				const typePart = parts[1]?.trim().toLowerCase();
				if (typePart && VALID_TYPES.includes(typePart as TrophyType)) {
					type = typePart as TrophyType;
				}
			}
			// Try comma-separated
			else if (line.includes(",")) {
				const lastComma = line.lastIndexOf(",");
				const possibleType = line
					.substring(lastComma + 1)
					.trim()
					.toLowerCase();
				if (VALID_TYPES.includes(possibleType as TrophyType)) {
					name = line.substring(0, lastComma).trim();
					type = possibleType as TrophyType;
				} else {
					name = line;
				}
			}
			// Plain text — auto-detect platinum
			else {
				name = line;
				if (line.toLowerCase().includes("platinum")) {
					type = "platinum";
				}
			}

			if (name) {
				trophies.push({
					name,
					type,
					completed: false,
					completedDate: null,
				});
			}
		}

		return trophies;
	}

	private renderPreview(): void {
		if (!this.previewEl) return;
		this.previewEl.empty();

		if (this.parsedTrophies.length === 0) {
			this.previewEl.createEl("p", {
				text: "No trophies parsed. Check your input.",
				cls: "at-import-warning",
			});
			return;
		}

		this.previewEl.createEl("p", {
			text: `Parsed ${this.parsedTrophies.length} trophies:`,
		});

		const table = this.previewEl.createEl("table", {
			cls: "at-trophy-table at-import-preview-table",
		});
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		["Name", "Type"].forEach((h) => headerRow.createEl("th", { text: h }));

		const tbody = table.createEl("tbody");
		for (const t of this.parsedTrophies) {
			const row = tbody.createEl("tr");
			row.createEl("td", { text: t.name });
			row.createEl("td", { text: t.type });
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
