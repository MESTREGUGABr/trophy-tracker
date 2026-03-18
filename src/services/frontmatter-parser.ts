import { App, TFile, parseYaml, stringifyYaml } from "obsidian";
import { GameFrontmatter, Trophy } from "../types";

export async function readGameFrontmatter(
	app: App,
	file: TFile
): Promise<GameFrontmatter | null> {
	const content = await app.vault.read(file);
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	try {
		const data = parseYaml(match[1]);
		if (!data || !data.game || !Array.isArray(data.trophies)) return null;

		return {
			game: data.game,
			platform: data.platform || "PS5",
			status: data.status || "backlog",
			trophies: (data.trophies as any[]).map(
				(t): Trophy => ({
					name: t.name || "",
					type: t.type || "bronze",
					completed: !!t.completed,
					completedDate: t.completedDate || null,
				})
			),
		};
	} catch {
		return null;
	}
}

export async function updateGameFrontmatter(
	app: App,
	file: TFile,
	mutator: (fm: Record<string, any>) => void
): Promise<void> {
	await app.fileManager.processFrontMatter(file, mutator);
}

export function buildGameNoteContent(data: GameFrontmatter): string {
	const yaml = stringifyYaml({
		game: data.game,
		platform: data.platform,
		status: data.status,
		trophies: data.trophies.map((t) => ({
			name: t.name,
			type: t.type,
			completed: t.completed,
			completedDate: t.completedDate,
		})),
	});
	return `---\n${yaml}---\n\n## Notes\n`;
}
