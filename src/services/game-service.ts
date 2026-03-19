import { App, TFile } from "obsidian";
import { AchievementTrackerSettings, GameEntry, GameFrontmatter, GameStatus, Trophy } from "../types";
import {
	readGameFrontmatter,
	updateGameFrontmatter,
	buildGameNoteContent,
} from "./frontmatter-parser";

interface FrontmatterData {
	trophies: { name: string; type: string; completed: boolean; completedDate: string | null }[];
	status: string;
}

export class GameService {
	constructor(
		private app: App,
		private settings: AchievementTrackerSettings
	) {}

	async getAllGames(): Promise<GameEntry[]> {
		const folder = this.settings.gamesFolder;
		const files = this.app.vault.getMarkdownFiles().filter((f) =>
			f.path.startsWith(folder + "/")
		);

		const entries: GameEntry[] = [];
		for (const file of files) {
			const fm = await readGameFrontmatter(this.app, file);
			if (!fm) continue;

			const total = fm.trophies.length;
			const completed = fm.trophies.filter((t) => t.completed).length;

			entries.push({
				file,
				frontmatter: fm,
				totalTrophies: total,
				completedTrophies: completed,
				completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
			});
		}

		return entries.sort((a, b) => a.frontmatter.game.localeCompare(b.frontmatter.game));
	}

	async createGame(data: GameFrontmatter): Promise<TFile> {
		const folder = this.settings.gamesFolder;
		const folderExists = this.app.vault.getAbstractFileByPath(folder);
		if (!folderExists) {
			await this.app.vault.createFolder(folder);
		}

		const safeName = data.game.replace(/[\\/:*?"<>|]/g, "-");
		const path = `${folder}/${safeName}.md`;
		const content = buildGameNoteContent(data);
		return await this.app.vault.create(path, content);
	}

	async deleteGame(file: TFile): Promise<void> {
		await this.app.fileManager.trashFile(file);
	}

	async toggleTrophy(file: TFile, trophyName: string): Promise<void> {
		await updateGameFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.trophies)) return;
			const trophy = data.trophies.find(
				(t) => t.name === trophyName
			);
			if (!trophy) return;

			trophy.completed = !trophy.completed;
			trophy.completedDate = trophy.completed
				? new Date().toISOString().split("T")[0]
				: null;

			const allCompleted = data.trophies.every((t) => t.completed);
			if (allCompleted && data.trophies.length > 0) {
				data.status = "completed";
			} else if (data.status === "completed") {
				data.status = "in-progress";
			}
		});
	}

	async addTrophy(file: TFile, trophy: Trophy): Promise<void> {
		await updateGameFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.trophies)) {
				data.trophies = [];
			}
			data.trophies.push({
				name: trophy.name,
				type: trophy.type,
				completed: trophy.completed,
				completedDate: trophy.completedDate,
			});
		});
	}

	async removeTrophy(file: TFile, trophyName: string): Promise<void> {
		await updateGameFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.trophies)) return;
			data.trophies = data.trophies.filter(
				(t) => t.name !== trophyName
			);
		});
	}

	async updateTrophy(
		file: TFile,
		oldName: string,
		updated: Trophy
	): Promise<void> {
		await updateGameFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.trophies)) return;
			const idx = data.trophies.findIndex(
				(t) => t.name === oldName
			);
			if (idx === -1) return;
			data.trophies[idx] = {
				name: updated.name,
				type: updated.type,
				completed: updated.completed,
				completedDate: updated.completedDate,
			};
		});
	}

	async updateGameStatus(file: TFile, status: GameStatus): Promise<void> {
		await updateGameFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			data.status = status;
		});
	}
}
