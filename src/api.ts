import { TAllLists, TCreateTask, TMember } from "src/interfaces/api.types";
import { Notice, requestUrl } from "obsidian";

const fetcher = (url: string, options: RequestInit = {}) => {
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
};

export const getToken = async (code: string) => {
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
		const resp = await fetcher(`oauth/token?${query}`, {
			method: "POST",
		});

		let responseBody: any = null;

		try {
			// Try parsing the response
			responseBody = await resp.json;
		} catch (jsonErr) {
			console.error("Failed to parse JSON response", jsonErr);
		}

		// Log both success and error scenarios
		// console.log("Response log:", {
		// 	response: resp.json
		// });

		// if (!resp.ok) {
		// 	throw new Error(`Request failed with status ${resp.status}`);
		// }

		// Extract and use token
		const data = responseBody as {
			access_token: string;
			type: string;
		};

		localStorage.setItem("click_up_token", data.access_token);
		return data.access_token;
	} catch (error: any) {
		console.error("Error during getToken()", error);
	}
};

export const getAuthorizedUser = async () => {
	const resp = await fetcher(`user`);
	const data = await resp.json;
	return data.user;
};
export const getTeams = async () => {
	const resp = await fetcher(`team`);
	const data = await resp.json;

	return data.teams;
};

export const getSpaces = async (team_id: string) => {
	const response = await fetcher(`team/${team_id}/space`);
	const data = await response.json;
	return data.spaces;
};

export const getFolders = async (space_id: string) => {
	const response = await fetcher(`space/${space_id}/folder`);
	const data = await response.json;
	return data.folders;
};

export const getList = async (folder_id: string) => {
	const response = await fetcher(`folder/${folder_id}/list`);
	const data = await response.json;
	return data.lists;
};

export const getFolderlessList = async (space_id: string) => {
	const response = await fetcher(`space/${space_id}/list`);
	const data = await response.json;
	return data.lists;
};

export const getTasks = async (list_id: string) => {
	const response = await fetcher(`list/${list_id}/task`);
	const data = await response.json;
	return data.tasks;
};

export const getClickupLists = async (
	folderId: string
): Promise<TAllLists[]> => {
	const response = await fetcher(`folder/${folderId}/list`);
	const data = await response.json;
	return data.lists;
};

export const getWorkspaceUser = async (teamId: string, userId: string) => {
	const response = await fetcher(`team/${teamId}/user/${userId}`);
	const data = await response.json;
	return data;
};

export const getAllFolders = async (space_id: string) => {
	const response = await fetcher(`space/${space_id}/folder`);
	const data = await response.json;
	return data.folders;
};

export const getListMembers = async (list_id: string): Promise<TMember[]> => {
	const response = await fetcher(`list/${list_id}/member`);
	const data = await response.json;
	return data.members;
};

export const createTask = async ({
	listId,
	data,
}: {
	listId: string;
	data: TCreateTask;
}) => {
	const response = await fetcher(`list/${listId}/task`, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	});
	const responseData = await response.json;
	return responseData;
};
interface ErrorResponse {
	isAuth: boolean;
	message: string;
}
export const showError = async (e: Error): Promise<ErrorResponse> => {
	console.log(e);
	if (e.message.includes("Oauth token not found")) {
		new Notice("Error related to authorization,please re-login", 10000);
		console.log("Error related to authorization,please re-login");
		return { isAuth: false, message: "no auth" };
	} else {
		new Notice(`Error:${e.message}`, 5000);
		return { isAuth: true, message: e.message };
	}
};
