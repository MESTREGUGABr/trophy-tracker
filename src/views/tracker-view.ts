import { ItemView, WorkspaceLeaf, TFile, Notice, setIcon } from "obsidian";
import { VIEW_TYPE_TRACKER } from "../constants";
import { GameEntry, GameStatus, Trophy } from "../types";
import { GameService } from "../services/game-service";
import { GameTableRenderer } from "../ui/game-table";
import { TrophyTableRenderer } from "../ui/trophy-table";
import { AddGameModal } from "../modals/add-game-modal";
import { AddTrophyModal } from "../modals/add-trophy-modal";
import { EditTrophyModal } from "../modals/edit-trophy-modal";
import { ImportModal } from "../modals/import-modal";
import { PsnImportModal } from "../modals/psn-import-modal";
import type AchievementTrackerPlugin from "../main";

export class TrackerView extends ItemView {
	private plugin: AchievementTrackerPlugin;
	private gameService: GameService;
	private games: GameEntry[] = [];
	private expandedGame: TFile | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: AchievementTrackerPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.gameService = new GameService(plugin.app, plugin.settings);
	}

	getViewType(): string {
		return VIEW_TYPE_TRACKER;
	}

	getDisplayText(): string {
		return "Achievement Tracker";
	}

	getIcon(): string {
		return "trophy";
	}

	async onOpen(): Promise<void> {
		await this.refresh();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	async refresh(): Promise<void> {
		this.gameService = new GameService(this.plugin.app, this.plugin.settings);
		this.games = await this.gameService.getAllGames();
		this.render();
	}

	private render(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("at-container");

		// Toolbar
		const toolbar = container.createDiv({ cls: "at-toolbar" });

		const addGameBtn = toolbar.createEl("button", {
			text: "Add Game",
			cls: "at-btn at-btn-primary",
		});
		setIcon(addGameBtn, "plus");
		addGameBtn.prepend(addGameBtn.querySelector(".svg-icon")!);
		addGameBtn.addEventListener("click", () => this.openAddGameModal());

		const importBtn = toolbar.createEl("button", {
			text: "Import",
			cls: "at-btn",
		});
		setIcon(importBtn, "download");
		importBtn.prepend(importBtn.querySelector(".svg-icon")!);
		importBtn.addEventListener("click", () => this.openImportModal());

		if (this.plugin.settings.psnNpssoToken) {
			const psnBtn = toolbar.createEl("button", {
				text: "PSN Import",
				cls: "at-btn",
			});
			setIcon(psnBtn, "gamepad-2");
			psnBtn.prepend(psnBtn.querySelector(".svg-icon")!);
			psnBtn.addEventListener("click", () => this.openPsnImportModal());
		}

		// Content area
		const content = container.createDiv({ cls: "at-content" });

		if (this.expandedGame) {
			const game = this.games.find(
				(g) => g.file.path === this.expandedGame!.path
			);
			if (game) {
				new TrophyTableRenderer(content, game, {
					onToggle: (name) => this.handleToggleTrophy(game.file, name),
					onEdit: (trophy) => this.openEditTrophyModal(game.file, trophy),
					onDelete: (name) => this.handleDeleteTrophy(game.file, name),
					onAdd: () => this.openAddTrophyModal(game.file),
					onBack: () => {
						this.expandedGame = null;
						this.render();
					},
				}).render();
				return;
			}
			// Game no longer exists, fall back to list
			this.expandedGame = null;
		}

		new GameTableRenderer(content, this.games, {
			onExpand: (file) => {
				this.expandedGame = file;
				this.render();
			},
			onDelete: (file) => this.handleDeleteGame(file),
			onStatusChange: (file, status) =>
				this.handleStatusChange(file, status),
		}).render();
	}

	private openAddGameModal(): void {
		new AddGameModal(this.app, this.plugin.settings, async (data) => {
			await this.gameService.createGame(data);
			await this.refresh();
		}).open();
	}

	private openImportModal(): void {
		new ImportModal(this.app, this.plugin.settings, async (data) => {
			await this.gameService.createGame(data);
			await this.refresh();
		}).open();
	}

	private openPsnImportModal(): void {
		new PsnImportModal(this.app, this.plugin.settings, async (data) => {
			await this.gameService.createGame(data);
			await this.refresh();
		}).open();
	}

	private openAddTrophyModal(file: TFile): void {
		new AddTrophyModal(this.app, async (trophy) => {
			await this.gameService.addTrophy(file, trophy);
			await this.refresh();
		}).open();
	}

	private openEditTrophyModal(file: TFile, trophy: Trophy): void {
		new EditTrophyModal(this.app, trophy, async (updated) => {
			await this.gameService.updateTrophy(file, trophy.name, updated);
			await this.refresh();
		}).open();
	}

	private async handleToggleTrophy(
		file: TFile,
		trophyName: string
	): Promise<void> {
		await this.gameService.toggleTrophy(file, trophyName);
		await this.refresh();
	}

	private async handleDeleteTrophy(
		file: TFile,
		trophyName: string
	): Promise<void> {
		await this.gameService.removeTrophy(file, trophyName);
		await this.refresh();
	}

	private async handleDeleteGame(file: TFile): Promise<void> {
		const confirmed = confirm(
			`Delete "${file.basename}" and all its trophy data?`
		);
		if (!confirmed) return;
		await this.gameService.deleteGame(file);
		if (this.expandedGame?.path === file.path) {
			this.expandedGame = null;
		}
		await this.refresh();
	}

	private async handleStatusChange(
		file: TFile,
		status: GameStatus
	): Promise<void> {
		await this.gameService.updateGameStatus(file, status);
		await this.refresh();
	}
}
