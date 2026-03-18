import { setIcon } from "obsidian";
import { GameEntry, Trophy } from "../types";
import { TROPHY_COLORS, TROPHY_ICONS, TROPHY_TYPE_ORDER } from "../constants";

export interface TrophyTableCallbacks {
	onToggle: (trophyName: string) => void;
	onEdit: (trophy: Trophy) => void;
	onDelete: (trophyName: string) => void;
	onAdd: () => void;
	onBack: () => void;
}

export class TrophyTableRenderer {
	constructor(
		private container: HTMLElement,
		private game: GameEntry,
		private callbacks: TrophyTableCallbacks
	) {}

	render(): void {
		this.container.empty();

		// Header with back button and game info
		const header = this.container.createDiv({ cls: "at-trophy-header" });

		const backBtn = header.createEl("button", {
			cls: "at-icon-btn at-back-btn",
			attr: { "aria-label": "Back to game list" },
		});
		setIcon(backBtn, "arrow-left");
		backBtn.addEventListener("click", () => this.callbacks.onBack());

		header.createEl("h3", { text: this.game.frontmatter.game });

		const stats = header.createDiv({ cls: "at-trophy-stats" });
		stats.createEl("span", {
			text: `${this.game.completedTrophies}/${this.game.totalTrophies} trophies · ${this.game.completionPercent}%`,
		});

		// Add trophy button
		const toolbar = this.container.createDiv({ cls: "at-trophy-toolbar" });
		const addBtn = toolbar.createEl("button", {
			text: "Add Trophy",
			cls: "at-btn at-btn-primary",
		});
		setIcon(addBtn, "plus");
		addBtn.prepend(addBtn.querySelector(".svg-icon")!);
		addBtn.addEventListener("click", () => this.callbacks.onAdd());

		// Trophy table
		const trophies = this.sortTrophies(this.game.frontmatter.trophies);

		if (trophies.length === 0) {
			this.container.createDiv({ cls: "at-empty-state" }).createEl("p", {
				text: "No trophies yet. Add or import trophies to start tracking!",
			});
			return;
		}

		const table = this.container.createEl("table", { cls: "at-trophy-table" });
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		["", "Type", "Trophy", "Date", ""].forEach((text) =>
			headerRow.createEl("th", { text })
		);

		const tbody = table.createEl("tbody");
		for (const trophy of trophies) {
			this.renderTrophyRow(tbody, trophy);
		}
	}

	private sortTrophies(trophies: Trophy[]): Trophy[] {
		return [...trophies].sort((a, b) => {
			const typeOrder =
				(TROPHY_TYPE_ORDER[a.type] ?? 99) -
				(TROPHY_TYPE_ORDER[b.type] ?? 99);
			if (typeOrder !== 0) return typeOrder;
			// Within same type, incomplete first
			if (a.completed !== b.completed) return a.completed ? 1 : -1;
			return a.name.localeCompare(b.name);
		});
	}

	private renderTrophyRow(tbody: HTMLElement, trophy: Trophy): void {
		const row = tbody.createEl("tr", {
			cls: `at-trophy-row ${trophy.completed ? "at-trophy-row--completed" : ""}`,
		});

		// Checkbox
		const checkCell = row.createEl("td", { cls: "at-trophy-check" });
		const checkbox = checkCell.createEl("input", { type: "checkbox" });
		checkbox.checked = trophy.completed;
		checkbox.addEventListener("change", () =>
			this.callbacks.onToggle(trophy.name)
		);

		// Type icon
		const typeCell = row.createEl("td", { cls: "at-trophy-type" });
		const iconSpan = typeCell.createEl("span", {
			cls: `at-trophy-icon at-trophy-icon-${trophy.type}`,
		});
		const iconName = TROPHY_ICONS[trophy.type] || "circle";
		setIcon(iconSpan, iconName);
		iconSpan.style.color = TROPHY_COLORS[trophy.type] || "#888";
		typeCell.createEl("span", {
			text: trophy.type,
			cls: "at-trophy-type-label",
		});

		// Name
		row.createEl("td", { text: trophy.name, cls: "at-trophy-name" });

		// Date
		row.createEl("td", {
			text: trophy.completedDate || "—",
			cls: "at-trophy-date",
		});

		// Actions
		const actionsCell = row.createEl("td", { cls: "at-actions" });

		const editBtn = actionsCell.createEl("button", {
			cls: "at-icon-btn",
			attr: { "aria-label": "Edit trophy" },
		});
		setIcon(editBtn, "pencil");
		editBtn.addEventListener("click", () => this.callbacks.onEdit(trophy));

		const deleteBtn = actionsCell.createEl("button", {
			cls: "at-icon-btn at-delete-btn",
			attr: { "aria-label": "Delete trophy" },
		});
		setIcon(deleteBtn, "trash-2");
		deleteBtn.addEventListener("click", () =>
			this.callbacks.onDelete(trophy.name)
		);
	}
}
