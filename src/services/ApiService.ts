import { Notice, requestUrl } from "obsidian";
import { TAllLists, TCreateTask, TMember } from "../interfaces/api.types";

export class ApiService {
	private static instance: ApiService;

	private constructor() {}

	public static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}

	private async fetcher(url: string, options: RequestInit = {}) {
		console.log({ url: `https://api.clickup.com/api/v2/${url}` });
		const token = localStorage.getItem("click_up_token") as string;
		const request = requestUrl({
			contentType: "application/json",
			url: `https://api.clickup.com/api/v2/${url}`,
			headers: {
				Authorization: token,
				"Grant Type": "Authorization Code",
			},
			method: options.method,
			body: options.body as string,
			throw: true,
		});
		return request;
	}

	public async getToken(code: string): Promise<string | undefined> {
		if (!code) return "MISSING_CODE";
		console.log({ code });
		const CLICK_UP_CLIENT = process.env.CLICK_UP_CLIENT ?? "";
		const CLICK_UP_SECRET = process.env.CLICK_UP_SECRET ?? "";
		const query = new URLSearchParams({
			client_id: CLICK_UP_CLIENT,
			client_secret: CLICK_UP_SECRET,
			code: code,
		}).toString();

		try {
			const resp = await this.fetcher(`oauth/token?${query}`, {
				method: "POST",
			});

			let responseBody: any = null;

			try {
				responseBody = await resp.json;
			} catch (jsonErr) {
				console.error("Failed to parse JSON response", jsonErr);
			}

			const data = responseBody as {
				access_token: string;
				type: string;
			};

			localStorage.setItem("click_up_token", data.access_token);
			return data.access_token;
		} catch (error: any) {
			console.error("Error during getToken()", error);
			return undefined;
		}
	}

	public async getAuthorizedUser() {
		const resp = await this.fetcher(`user`);
		const data = await resp.json;
		return data.user;
	}

	public async getTeams() {
		const resp = await this.fetcher(`team`);
		const data = await resp.json;
		return data.teams;
	}

	public async getSpaces(team_id: string) {
		const response = await this.fetcher(`team/${team_id}/space`);
		const data = await response.json;
		return data.spaces;
	}

	public async getFolders(space_id: string) {
		const response = await this.fetcher(`space/${space_id}/folder`);
		const data = await response.json;
		return data.folders;
	}

	public async getList(folder_id: string) {
		const response = await this.fetcher(`folder/${folder_id}/list`);
		const data = await response.json;
		return data.lists;
	}

	public async getFolderlessList(space_id: string) {
		const response = await this.fetcher(`space/${space_id}/list`);
		const data = await response.json;
		return data.lists;
	}

	public async getTasks(list_id: string) {
		const response = await this.fetcher(`list/${list_id}/task`);
		const data = await response.json;
		return data.tasks;
	}

	public async getClickupLists(folderId: string): Promise<TAllLists[]> {
		const response = await this.fetcher(`folder/${folderId}/list`);
		const data = await response.json;
		return data.lists;
	}

	public async getWorkspaceUser(teamId: string, userId: string) {
		const response = await this.fetcher(`team/${teamId}/user/${userId}`);
		const data = await response.json;
		return data;
	}

	public async getAllFolders(space_id: string) {
		const response = await this.fetcher(`space/${space_id}/folder`);
		const data = await response.json;
		return data.folders;
	}

	public async getListMembers(list_id: string): Promise<TMember[]> {
		const response = await this.fetcher(`list/${list_id}/member`);
		const data = await response.json;
		return data.members;
	}

	public async createTask({
		listId,
		data,
	}: {
		listId: string;
		data: TCreateTask;
	}) {
		const response = await this.fetcher(`list/${listId}/task`, {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const responseData = await response.json;
		return responseData;
	}

	public async showError(
		e: Error
	): Promise<{ isAuth: boolean; message: string }> {
		console.log(e);
		if (e.message.includes("Oauth token not found")) {
			new Notice(
				"Error related to authorization, please re-login",
				10000
			);
			console.log("Error related to authorization, please re-login");
			return { isAuth: false, message: "no auth" };
		} else {
			new Notice(`Error: ${e.message}`, 5000);
			return { isAuth: true, message: e.message };
		}
	}
}
