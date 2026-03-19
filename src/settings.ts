import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type AchievementTrackerPlugin from "./main";
import { PsnService } from "./services/psn-service";

export class AchievementTrackerSettingTab extends PluginSettingTab {
	plugin: AchievementTrackerPlugin;

	constructor(app: App, plugin: AchievementTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("General")
			.setHeading();

		new Setting(containerEl)
			.setName("Games folder")
			.setDesc(
				"Folder where game notes are stored. Will be created if it doesn't exist."
			)
			.addText((text) =>
				text
					.setPlaceholder("Games")
					.setValue(this.plugin.settings.gamesFolder)
					.onChange(async (value) => {
						this.plugin.settings.gamesFolder = value || "Games";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default platform")
			.setDesc("Default platform when adding a new game.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						PS5: "PS5",
						PS4: "PS4",
						PS3: "PS3",
						"PS Vita": "PS Vita",
					})
					.setValue(this.plugin.settings.defaultPlatform)
					.onChange(async (value) => {
						this.plugin.settings.defaultPlatform = value;
						await this.plugin.saveSettings();
					})
			);

		// PSN Section
		new Setting(containerEl)
			.setName("PSN")
			.setHeading();

		const instructions = containerEl.createDiv({ cls: "at-psn-instructions" });
		instructions.createEl("p", { text: "To import trophies from PSN, you need an NPSSO token:" });
		const ol = instructions.createEl("ol");
		ol.createEl("li", { text: "Sign in at store.playstation.com" });
		const step2 = ol.createEl("li");
		step2.appendText("Visit ");
		step2.createEl("code", { text: "https://ca.account.sony.com/api/v1/ssocookie" });
		ol.createEl("li", { text: 'Copy the "npsso" value from the JSON response' });
		ol.createEl("li", { text: "Paste it in the field below" });

		new Setting(containerEl)
			.setName("NPSSO token")
			.setDesc("Your PSN authentication token.")
			.addText((text) =>
				text
					.setPlaceholder("Paste your NPSSO token here")
					.setValue(this.plugin.settings.psnNpssoToken)
					.onChange(async (value) => {
						this.plugin.settings.psnNpssoToken = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Test connection")
			.setDesc("Verify that your NPSSO token is valid.")
			.addButton((btn) =>
				btn.setButtonText("Test connection").onClick(async () => {
					const token = this.plugin.settings.psnNpssoToken;
					if (!token) {
						new Notice("Please enter an NPSSO token first.");
						return;
					}
					btn.setButtonText("Testing...");
					btn.setDisabled(true);
					try {
						const psnService = new PsnService();
						await psnService.testConnection(token);
						new Notice("PSN connection successful!");
					} catch (e: unknown) {
						const message = e instanceof Error ? e.message : "Unknown error";
						new Notice(
							`PSN connection failed: ${message}`
						);
					} finally {
						btn.setButtonText("Test connection");
						btn.setDisabled(false);
					}
				})
			);
	}
}
