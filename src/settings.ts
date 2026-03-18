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

		containerEl.createEl("h2", { text: "Achievement Tracker Settings" });

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
		containerEl.createEl("h2", { text: "PlayStation Network" });

		const instructions = containerEl.createDiv({ cls: "at-psn-instructions" });
		instructions.createEl("p", { text: "To import trophies from PSN, you need an NPSSO token:" });
		const ol = instructions.createEl("ol");
		ol.createEl("li", { text: "Sign in at store.playstation.com" });
		ol.createEl("li").innerHTML =
			'Visit <code>https://ca.account.sony.com/api/v1/ssocookie</code>';
		ol.createEl("li", { text: 'Copy the "npsso" value from the JSON response' });
		ol.createEl("li", { text: "Paste it in the field below" });

		new Setting(containerEl)
			.setName("NPSSO Token")
			.setDesc("Your PlayStation Network authentication token.")
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
				btn.setButtonText("Test Connection").onClick(async () => {
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
					} catch (e: any) {
						new Notice(
							`PSN connection failed: ${e?.message || "Unknown error"}`
						);
					} finally {
						btn.setButtonText("Test Connection");
						btn.setDisabled(false);
					}
				})
			);
	}
}
