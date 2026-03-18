import { App, Modal, Setting } from "obsidian";
import { Trophy, TrophyType } from "../types";

export class EditTrophyModal extends Modal {
	private trophyName: string;
	private trophyType: TrophyType;
	private completed: boolean;
	private completedDate: string | null;

	constructor(
		app: App,
		private original: Trophy,
		private onSubmit: (updated: Trophy) => void
	) {
		super(app);
		this.trophyName = original.name;
		this.trophyType = original.type;
		this.completed = original.completed;
		this.completedDate = original.completedDate;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Edit Trophy" });

		new Setting(contentEl).setName("Trophy name").addText((text) =>
			text.setValue(this.trophyName).onChange((value) => {
				this.trophyName = value;
			})
		);

		new Setting(contentEl).setName("Type").addDropdown((dropdown) =>
			dropdown
				.addOptions({
					bronze: "Bronze",
					silver: "Silver",
					gold: "Gold",
					platinum: "Platinum",
				})
				.setValue(this.trophyType)
				.onChange((value) => {
					this.trophyType = value as TrophyType;
				})
		);

		new Setting(contentEl).setName("Completed").addToggle((toggle) =>
			toggle.setValue(this.completed).onChange((value) => {
				this.completed = value;
				if (value && !this.completedDate) {
					this.completedDate = new Date().toISOString().split("T")[0];
				} else if (!value) {
					this.completedDate = null;
				}
			})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					if (!this.trophyName.trim()) return;
					this.onSubmit({
						name: this.trophyName.trim(),
						type: this.trophyType,
						completed: this.completed,
						completedDate: this.completedDate,
					});
					this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
