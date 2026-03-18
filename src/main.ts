import { Notice, Plugin, TFile } from "obsidian";
import { AchievementTrackerSettings, DEFAULT_SETTINGS } from "./types";
import { AchievementTrackerSettingTab } from "./settings";
import { TrackerView } from "./views/tracker-view";
import { ImportModal } from "./modals/import-modal";
import { PsnImportModal } from "./modals/psn-import-modal";
import { GameService } from "./services/game-service";
import { VIEW_TYPE_TRACKER } from "./constants";

export default class AchievementTrackerPlugin extends Plugin {
	settings: AchievementTrackerSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_TRACKER,
			(leaf) => new TrackerView(leaf, this)
		);

		this.addRibbonIcon("trophy", "Open Achievement Tracker", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-achievement-tracker",
			name: "Open Achievement Tracker",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "import-trophies",
			name: "Import trophies from text",
			callback: () => {
				const service = new GameService(this.app, this.settings);
				new ImportModal(this.app, this.settings, async (data) => {
					await service.createGame(data);
					this.refreshTrackerView();
				}).open();
			},
		});

		this.addCommand({
			id: "import-from-psn",
			name: "Import trophies from PlayStation Network",
			callback: () => {
				if (!this.settings.psnNpssoToken) {
					new Notice(
						"Please set your PSN NPSSO token in the Achievement Tracker settings first."
					);
					return;
				}
				const service = new GameService(this.app, this.settings);
				new PsnImportModal(
					this.app,
					this.settings,
					async (data) => {
						await service.createGame(data);
						this.refreshTrackerView();
					}
				).open();
			},
		});

		this.addSettingTab(new AchievementTrackerSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (
					file instanceof TFile &&
					file.path.startsWith(this.settings.gamesFolder + "/")
				) {
					this.refreshTrackerView();
				}
			})
		);
	}

	onunload(): void {
		// View is automatically deregistered by Obsidian
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_TRACKER)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_TRACKER,
					active: true,
				});
				leaf = rightLeaf;
			}
		}
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	refreshTrackerView(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TRACKER);
		for (const leaf of leaves) {
			const view = leaf.view as TrackerView;
			if (view && typeof view.refresh === "function") {
				view.refresh();
			}
		}
	}
}
