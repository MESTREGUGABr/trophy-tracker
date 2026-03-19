import { App, Modal, Notice } from "obsidian";
import {
	AchievementTrackerSettings,
	GameFrontmatter,
	PsnGameSummary,
} from "../types";
import { PsnService } from "../services/psn-service";

export class PsnImportModal extends Modal {
	private psnService: PsnService;
	private games: PsnGameSummary[] = [];
	private selectedIds: Set<string> = new Set();
	private isImporting = false;
	private contentArea: HTMLElement | null = null;

	constructor(
		app: App,
		private settings: AchievementTrackerSettings,
		private onImport: (data: GameFrontmatter) => Promise<void>
	) {
		super(app);
		this.psnService = new PsnService();
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.addClass("at-psn-modal");
		contentEl.createEl("h2", { text: "Import from PlayStation Network" });
		this.contentArea = contentEl.createDiv({ cls: "at-psn-content" });
		await this.loadGames();
	}

	private async loadGames(): Promise<void> {
		this.renderLoading();
		try {
			this.games = await this.psnService.fetchUserGames(
				this.settings.psnNpssoToken
			);
			this.renderGameList();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Failed to load games from PSN.";
			this.renderError(message);
		}
	}

	private renderLoading(): void {
		if (!this.contentArea) return;
		this.contentArea.empty();
		const loading = this.contentArea.createDiv({ cls: "at-psn-loading" });
		loading.createEl("p", { text: "Loading your PSN library..." });
	}

	private renderError(message: string): void {
		if (!this.contentArea) return;
		this.contentArea.empty();
		const error = this.contentArea.createDiv({ cls: "at-psn-error" });
		error.createEl("p", { text: message });
		const retryBtn = error.createEl("button", {
			text: "Retry",
			cls: "at-btn",
		});
		retryBtn.addEventListener("click", () => {
			void this.loadGames();
		});
	}

	private renderGameList(): void {
		if (!this.contentArea) return;
		this.contentArea.empty();

		// Summary + select all
		const summary = this.contentArea.createDiv({ cls: "at-psn-summary" });
		summary.createEl("span", {
			text: `Found ${this.games.length} games on your PSN profile`,
		});

		const selectAllBtn = summary.createEl("button", {
			text: "Select all",
			cls: "at-btn",
		});
		selectAllBtn.addEventListener("click", () => {
			if (this.selectedIds.size === this.games.length) {
				this.selectedIds.clear();
				selectAllBtn.textContent = "Select all";
			} else {
				for (const g of this.games) {
					this.selectedIds.add(g.npCommunicationId);
				}
				selectAllBtn.textContent = "Deselect all";
			}
			this.updateCheckboxes();
			this.updateImportButton();
		});

		// Game list
		const listContainer = this.contentArea.createDiv({
			cls: "at-psn-game-list",
		});
		for (const game of this.games) {
			this.renderGameRow(listContainer, game);
		}

		// Import bar
		const importBar = this.contentArea.createDiv({
			cls: "at-psn-import-bar",
		});
		this.importProgressEl = importBar.createEl("span", {
			cls: "at-psn-import-progress",
		});
		this.importBtn = importBar.createEl("button", {
			text: "Import selected (0)",
			cls: "at-btn at-btn-primary",
		});
		this.importBtn.disabled = true;
		this.importBtn.addEventListener("click", () => {
			void this.importSelected();
		});
	}

	private importBtn: HTMLButtonElement | null = null;
	private importProgressEl: HTMLElement | null = null;

	private renderGameRow(container: HTMLElement, game: PsnGameSummary): void {
		const row = container.createDiv({ cls: "at-psn-game-row" });
		row.dataset.id = game.npCommunicationId;

		const checkbox = row.createEl("input", {
			type: "checkbox",
			cls: "at-psn-checkbox",
		});
		checkbox.checked = this.selectedIds.has(game.npCommunicationId);

		const info = row.createDiv({ cls: "at-psn-game-info" });
		info.createDiv({
			text: game.trophyTitleName,
			cls: "at-psn-game-title",
		});

		const meta = info.createDiv({ cls: "at-psn-game-meta" });
		meta.createEl("span", {
			text: this.formatPlatform(game.trophyTitlePlatform),
		});

		const totalTrophies =
			game.definedTrophies.bronze +
			game.definedTrophies.silver +
			game.definedTrophies.gold +
			game.definedTrophies.platinum;
		const earnedTrophies =
			game.earnedTrophies.bronze +
			game.earnedTrophies.silver +
			game.earnedTrophies.gold +
			game.earnedTrophies.platinum;

		meta.createEl("span", {
			text: `${earnedTrophies}/${totalTrophies} trophies`,
		});
		meta.createEl("span", { text: `${game.progress}%` });

		// Progress bar
		const progressBar = row.createDiv({ cls: "at-progress-bar at-psn-progress" });
		const fill = progressBar.createDiv({ cls: "at-progress-fill" });
		fill.style.width = `${game.progress}%`;
		if (game.progress >= 100) {
			fill.addClass("at-progress-complete");
		}

		// Toggle selection on row click
		const toggleSelection = () => {
			if (this.selectedIds.has(game.npCommunicationId)) {
				this.selectedIds.delete(game.npCommunicationId);
			} else {
				this.selectedIds.add(game.npCommunicationId);
			}
			checkbox.checked = this.selectedIds.has(game.npCommunicationId);
			row.toggleClass(
				"at-psn-game-row--selected",
				checkbox.checked
			);
			this.updateImportButton();
		};

		row.addEventListener("click", (e) => {
			if (e.target === checkbox) return;
			toggleSelection();
		});
		checkbox.addEventListener("change", () => {
			if (checkbox.checked) {
				this.selectedIds.add(game.npCommunicationId);
			} else {
				this.selectedIds.delete(game.npCommunicationId);
			}
			row.toggleClass(
				"at-psn-game-row--selected",
				checkbox.checked
			);
			this.updateImportButton();
		});
	}

	private updateCheckboxes(): void {
		if (!this.contentArea) return;
		const rows =
			this.contentArea.querySelectorAll<HTMLElement>(".at-psn-game-row");
		rows.forEach((row) => {
			const id = row.dataset.id;
			const cb = row.querySelector<HTMLInputElement>("input[type=checkbox]");
			if (cb && id) {
				cb.checked = this.selectedIds.has(id);
				row.toggleClass(
					"at-psn-game-row--selected",
					cb.checked
				);
			}
		});
	}

	private updateImportButton(): void {
		if (this.importBtn) {
			const count = this.selectedIds.size;
			this.importBtn.textContent = `Import selected (${count})`;
			this.importBtn.disabled = count === 0 || this.isImporting;
		}
	}

	private async importSelected(): Promise<void> {
		if (this.isImporting || this.selectedIds.size === 0) return;
		this.isImporting = true;
		this.updateImportButton();

		const selectedGames = this.games.filter((g) =>
			this.selectedIds.has(g.npCommunicationId)
		);
		const total = selectedGames.length;
		let imported = 0;
		let skipped = 0;

		for (let i = 0; i < selectedGames.length; i++) {
			const game = selectedGames[i];
			if (this.importProgressEl) {
				this.importProgressEl.textContent = `Importing ${i + 1} of ${total}...`;
			}

			try {
				// Check for duplicate
				const safeName = game.trophyTitleName.replace(
					/[\\/:*?"<>|]/g,
					"-"
				);
				const path = `${this.settings.gamesFolder}/${safeName}.md`;
				const existing =
					this.app.vault.getAbstractFileByPath(path);
				if (existing) {
					skipped++;
					continue;
				}

				const data = await this.psnService.fetchGameTrophies(
					this.settings.psnNpssoToken,
					game
				);
				await this.onImport(data);
				imported++;

				// Small delay to avoid rate limiting
				if (i < selectedGames.length - 1) {
					await this.delay(300);
				}
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Unknown error";
				new Notice(
					`Failed to import "${game.trophyTitleName}": ${message}`
				);
			}
		}

		let message = `Imported ${imported} game${imported !== 1 ? "s" : ""}`;
		if (skipped > 0) {
			message += ` (${skipped} skipped — already exist)`;
		}
		new Notice(message);

		this.isImporting = false;
		this.close();
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private formatPlatform(platform: string): string {
		return platform.replace("PSVITA", "PS Vita");
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
