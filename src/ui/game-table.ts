import { setIcon } from "obsidian";
import { GameEntry, GameStatus } from "../types";
import { TFile } from "obsidian";

export interface GameTableCallbacks {
	onExpand: (file: TFile) => void;
	onDelete: (file: TFile) => void;
	onStatusChange: (file: TFile, status: GameStatus) => void;
}

export class GameTableRenderer {
	constructor(
		private container: HTMLElement,
		private games: GameEntry[],
		private callbacks: GameTableCallbacks
	) {}

	render(): void {
		this.container.empty();

		if (this.games.length === 0) {
			const empty = this.container.createDiv({ cls: "at-empty-state" });
			empty.createEl("p", {
				text: "No games tracked yet. Add a game to get started!",
			});
			return;
		}

		const table = this.container.createEl("table", { cls: "at-game-table" });

		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		["Game", "Platform", "Progress", "Trophies", "Status", ""].forEach(
			(text) => headerRow.createEl("th", { text })
		);

		const tbody = table.createEl("tbody");
		for (const game of this.games) {
			this.renderGameRow(tbody, game);
		}
	}

	private renderGameRow(tbody: HTMLElement, game: GameEntry): void {
		const row = tbody.createEl("tr", { cls: "at-game-row" });

		// Game name (clickable)
		const nameCell = row.createEl("td", { cls: "at-game-name" });
		const nameLink = nameCell.createEl("a", {
			text: game.frontmatter.game,
			cls: "at-game-link",
		});
		nameLink.addEventListener("click", (e) => {
			e.preventDefault();
			this.callbacks.onExpand(game.file);
		});

		// Platform
		row.createEl("td", { text: game.frontmatter.platform, cls: "at-platform" });

		// Progress bar
		const progressCell = row.createEl("td", { cls: "at-progress-cell" });
		const progressBar = progressCell.createDiv({ cls: "at-progress-bar" });
		const fill = progressBar.createDiv({ cls: "at-progress-fill" });
		fill.style.width = `${game.completionPercent}%`;
		if (game.completionPercent === 100) {
			fill.addClass("at-progress-complete");
		}
		progressCell.createEl("span", {
			text: `${game.completionPercent}%`,
			cls: "at-progress-text",
		});

		// Trophy count
		row.createEl("td", {
			text: `${game.completedTrophies}/${game.totalTrophies}`,
			cls: "at-trophy-count",
		});

		// Status dropdown
		const statusCell = row.createEl("td");
		const select = statusCell.createEl("select", { cls: "at-status-select" });
		const statuses: { value: GameStatus; label: string }[] = [
			{ value: "backlog", label: "Backlog" },
			{ value: "in-progress", label: "In progress" },
			{ value: "completed", label: "Completed" },
		];
		for (const s of statuses) {
			const option = select.createEl("option", { text: s.label, value: s.value });
			if (s.value === game.frontmatter.status) {
				option.selected = true;
			}
		}
		select.addEventListener("change", () => {
			this.callbacks.onStatusChange(
				game.file,
				select.value as GameStatus
			);
		});

		// Delete button
		const actionsCell = row.createEl("td", { cls: "at-actions" });
		const deleteBtn = actionsCell.createEl("button", {
			cls: "at-icon-btn at-delete-btn",
			attr: { "aria-label": "Delete game" },
		});
		setIcon(deleteBtn, "trash-2");
		deleteBtn.addEventListener("click", () => {
			this.callbacks.onDelete(game.file);
		});
	}
}
