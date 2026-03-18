import { App, Modal, Setting } from "obsidian";
import { Trophy, TrophyType } from "../types";

export class AddTrophyModal extends Modal {
	private trophyName = "";
	private trophyType: TrophyType = "bronze";

	constructor(
		app: App,
		private onSubmit: (trophy: Trophy) => void
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Add Trophy" });

		new Setting(contentEl).setName("Trophy name").addText((text) =>
			text.setPlaceholder("e.g. The Promise").onChange((value) => {
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

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Add Trophy")
				.setCta()
				.onClick(() => {
					if (!this.trophyName.trim()) return;
					this.onSubmit({
						name: this.trophyName.trim(),
						type: this.trophyType,
						completed: false,
						completedDate: null,
					});
					this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
