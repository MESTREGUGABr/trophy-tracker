import { App, Modal, Setting } from "obsidian";
import { AchievementTrackerSettings, GameFrontmatter, GameStatus } from "../types";

export class AddGameModal extends Modal {
	private gameName = "";
	private platform: string;
	private status: GameStatus = "backlog";

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
		contentEl.createEl("h2", { text: "Add New Game" });

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

		new Setting(contentEl).setName("Status").addDropdown((dropdown) =>
			dropdown
				.addOptions({
					backlog: "Backlog",
					"in-progress": "In Progress",
					completed: "Completed",
				})
				.setValue(this.status)
				.onChange((value) => {
					this.status = value as GameStatus;
				})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Add Game")
				.setCta()
				.onClick(() => {
					if (!this.gameName.trim()) {
						return;
					}
					this.onSubmit({
						game: this.gameName.trim(),
						platform: this.platform,
						status: this.status,
						trophies: [],
					});
					this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
