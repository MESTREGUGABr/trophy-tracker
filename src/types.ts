import { TFile } from "obsidian";

export type TrophyType = "bronze" | "silver" | "gold" | "platinum";
export type GameStatus = "backlog" | "in-progress" | "completed";

export interface Trophy {
	name: string;
	type: TrophyType;
	completed: boolean;
	completedDate: string | null;
}

export interface GameFrontmatter {
	game: string;
	platform: string;
	status: GameStatus;
	trophies: Trophy[];
}

export interface GameEntry {
	file: TFile;
	frontmatter: GameFrontmatter;
	totalTrophies: number;
	completedTrophies: number;
	completionPercent: number;
}

export interface AchievementTrackerSettings {
	gamesFolder: string;
	defaultPlatform: string;
	psnNpssoToken: string;
}

export const DEFAULT_SETTINGS: AchievementTrackerSettings = {
	gamesFolder: "Games",
	defaultPlatform: "PS5",
	psnNpssoToken: "",
};

export interface PsnGameSummary {
	npCommunicationId: string;
	npServiceName: "trophy" | "trophy2";
	trophyTitleName: string;
	trophyTitlePlatform: string;
	trophyTitleIconUrl: string;
	progress: number;
	definedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
	earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
}
