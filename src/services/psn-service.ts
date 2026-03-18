import { requestUrl, RequestUrlResponse } from "obsidian";
import type {
	GameFrontmatter,
	GameStatus,
	PsnGameSummary,
	Trophy,
	TrophyType,
} from "../types";

const AUTH_BASE_URL = "https://ca.account.sony.com/api/authz/v3/oauth";
const TROPHY_BASE_URL = "https://m.np.playstation.com/api/trophy";

export class PsnService {
	private accessToken: string | null = null;
	private authExpiresAt = 0;

	async authenticate(npssoToken: string): Promise<void> {
		console.log("[AT] authenticate called");
		if (this.accessToken && Date.now() < this.authExpiresAt) return;

		// Step 1: Exchange NPSSO for access code
		// Sony's authorize endpoint returns a 302 redirect to a non-HTTP URL:
		//   com.scee.psxandroid.scecompcall://redirect?code=v3.xxxxx
		// requestUrl will try to follow that redirect and fail.
		// We catch the error and extract the code from it.
		const params = new URLSearchParams({
			access_type: "offline",
			client_id: "09515159-7237-4370-9b40-3806e67c0891",
			redirect_uri: "com.scee.psxandroid.scecompcall://redirect",
			response_type: "code",
			scope: "psn:mobile.v2.core psn:clientapp",
		});

		const authorizeUrl = `${AUTH_BASE_URL}/authorize?${params}`;
		let code: string | null = null;

		console.log("[AT] About to call requestUrl with:", authorizeUrl.substring(0, 80) + "...");
		try {
			const resp = await requestUrl({
				url: authorizeUrl,
				headers: {
					Cookie: `npsso=${npssoToken}`,
				},
				throw: false,
			});

			// Debug: log the full response to understand what we get back
			console.log("[AT] Auth response status:", resp.status);
			console.log("[AT] Auth response headers:", JSON.stringify(resp.headers));
			console.log("[AT] Auth response url:", (resp as any).url);

			// Check for Location header (302 redirect)
			for (const [key, value] of Object.entries(resp.headers || {})) {
				if (key.toLowerCase() === "location" && typeof value === "string" && value.includes("code=")) {
					const match = value.match(/code=([^&]+)/);
					if (match) code = match[1];
				}
			}

			// Check response URL
			if (!code) {
				const respUrl = (resp as any).url || "";
				if (respUrl.includes("code=")) {
					const match = respUrl.match(/code=([^&]+)/);
					if (match) code = match[1];
				}
			}

			// Check response body for code
			if (!code && resp.text) {
				const match = resp.text.match(/code=([^&\s"'<>]+)/);
				if (match) code = match[1];
			}
		} catch (e: any) {
			// Debug: log the full error object
			console.log("[AT] Auth error type:", typeof e);
			console.log("[AT] Auth error message:", e?.message);
			console.log("[AT] Auth error url:", e?.url);
			console.log("[AT] Auth error keys:", e ? Object.keys(e) : "null");
			try {
				console.log("[AT] Auth error JSON:", JSON.stringify(e, null, 2));
			} catch {
				console.log("[AT] Auth error toString:", String(e));
			}

			// requestUrl throws when following redirect to non-HTTP URL
			// Try to extract code from error properties
			const sources = [
				e?.url,
				e?.message,
				e?.headers?.location,
				e?.headers?.Location,
			];
			for (const src of sources) {
				if (typeof src === "string" && src.includes("code=")) {
					const match = src.match(/code=([^&\s"'}\]]+)/);
					if (match) {
						code = match[1];
						break;
					}
				}
			}

			// Last resort: stringify everything
			if (!code) {
				try {
					const fullStr = JSON.stringify(e);
					const match = fullStr.match(/code=([^&\s"'}\]]+)/);
					if (match) code = match[1];
				} catch {
					// ignore
				}
			}
		}

		if (!code) {
			throw new Error(
				"Failed to retrieve PSN access code. Is your NPSSO token valid?\n" +
					"Get a new one at https://ca.account.sony.com/api/v1/ssocookie"
			);
		}

		// Step 2: Exchange access code for auth tokens
		const tokenResp = await requestUrl({
			url: `${AUTH_BASE_URL}/token`,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization:
					"Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=",
			},
			body: new URLSearchParams({
				code,
				redirect_uri: "com.scee.psxandroid.scecompcall://redirect",
				grant_type: "authorization_code",
				token_format: "jwt",
			}).toString(),
		});

		const tokenData = tokenResp.json;
		if (!tokenData.access_token) {
			throw new Error(
				"Failed to obtain PSN access token. " +
					(tokenData.error_description ||
						tokenData.error ||
						"Unknown error")
			);
		}

		this.accessToken = tokenData.access_token;
		this.authExpiresAt =
			Date.now() + ((tokenData.expires_in || 3600) - 60) * 1000;
	}

	async testConnection(npssoToken: string): Promise<boolean> {
		console.log("[AT] testConnection called, token length:", npssoToken?.length);
		this.accessToken = null;
		this.authExpiresAt = 0;
		await this.authenticate(npssoToken);
		return true;
	}

	private async apiCall<T>(url: string): Promise<T> {
		const response = await requestUrl({
			url,
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				"Content-Type": "application/json",
			},
		});
		return response.json as T;
	}

	async fetchUserGames(npssoToken: string): Promise<PsnGameSummary[]> {
		await this.authenticate(npssoToken);

		const allGames: PsnGameSummary[] = [];
		let offset = 0;
		const limit = 800;

		while (true) {
			const params = new URLSearchParams({
				limit: String(limit),
				offset: String(offset),
			});
			const url = `${TROPHY_BASE_URL}/v1/users/me/trophyTitles?${params}`;
			const response = await this.apiCall<{
				trophyTitles: any[];
				totalItemCount: number;
				nextOffset?: number;
			}>(url);

			for (const title of response.trophyTitles) {
				allGames.push({
					npCommunicationId: title.npCommunicationId,
					npServiceName: title.npServiceName,
					trophyTitleName: title.trophyTitleName,
					trophyTitlePlatform: title.trophyTitlePlatform,
					trophyTitleIconUrl: title.trophyTitleIconUrl,
					progress: title.progress,
					definedTrophies: title.definedTrophies,
					earnedTrophies: title.earnedTrophies,
				});
			}

			if (
				!response.nextOffset ||
				response.trophyTitles.length < limit
			) {
				break;
			}
			offset = response.nextOffset;
		}

		return allGames.sort((a, b) =>
			a.trophyTitleName.localeCompare(b.trophyTitleName)
		);
	}

	async fetchGameTrophies(
		npssoToken: string,
		game: PsnGameSummary
	): Promise<GameFrontmatter> {
		await this.authenticate(npssoToken);

		const serviceParam =
			game.npServiceName === "trophy"
				? "?npServiceName=trophy"
				: "";

		const definitionsUrl = `${TROPHY_BASE_URL}/v1/npCommunicationIds/${game.npCommunicationId}/trophyGroups/all/trophies${serviceParam}`;
		const earnedUrl = `${TROPHY_BASE_URL}/v1/users/me/npCommunicationIds/${game.npCommunicationId}/trophyGroups/all/trophies${serviceParam}`;

		const [definitionsResp, earnedResp] = await Promise.all([
			this.apiCall<{ trophies: any[] }>(definitionsUrl),
			this.apiCall<{ trophies: any[] }>(earnedUrl),
		]);

		const earnedMap = new Map<
			number,
			{ earned: boolean; earnedDateTime?: string | null }
		>();
		for (const t of earnedResp.trophies) {
			earnedMap.set(t.trophyId, {
				earned: !!t.earned,
				earnedDateTime: t.earnedDateTime || null,
			});
		}

		const trophies: Trophy[] = definitionsResp.trophies.map(
			(def: any) => {
				const earned = earnedMap.get(def.trophyId);
				const isEarned = earned?.earned ?? false;
				let completedDate: string | null = null;

				if (isEarned && earned?.earnedDateTime) {
					completedDate = earned.earnedDateTime.split("T")[0];
				}

				return {
					name: def.trophyName ?? `Trophy #${def.trophyId}`,
					type: (def.trophyType as TrophyType) || "bronze",
					completed: isEarned,
					completedDate,
				};
			}
		);

		return {
			game: game.trophyTitleName,
			platform: this.mapPlatform(game.trophyTitlePlatform),
			status: this.determineStatus(game.progress),
			trophies,
		};
	}

	private mapPlatform(platform: string): string {
		if (platform.includes("PSVITA") || platform.includes("PS Vita")) {
			return "PS Vita";
		}
		if (platform.includes("PS5")) return "PS5";
		if (platform.includes("PS4")) return "PS4";
		if (platform.includes("PS3")) return "PS3";
		return platform;
	}

	private determineStatus(progress: number): GameStatus {
		if (progress >= 100) return "completed";
		if (progress > 0) return "in-progress";
		return "backlog";
	}
}
