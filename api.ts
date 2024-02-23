import { TAllLists, TCreateTask, TMember } from "api.types";

const fetcher = (url: string, options: RequestInit = {}) => {
	const PROXY_HOST = process.env.PROXY_HOST;
	const token = localStorage.getItem("token") as any;
	options.headers = {
		...options.headers,
		Authorization: token,
	};
	return fetch(`${PROXY_HOST}${url}`, options);
};

export const getToken = async (code: string) => {
	if (!code) return "MISSING_CODE"
	const CLICK_UP_CLIENT = process.env.CLICK_UP_CLIENT ?? "";
	const CLICK_UP_SECRET = process.env.CLICK_UP_SECRET ?? "";
	const query = new URLSearchParams({
		client_id: CLICK_UP_CLIENT,
		client_secret: CLICK_UP_SECRET,
		code: code,
	}).toString();

	try {
		const resp = await fetcher(`/api/v2/oauth/token?${query}`, {
			method: "POST",
		});
		const data = (await resp.json()) as {
			access_token: string;
			type: string;
		};
		localStorage.setItem("token", data.access_token);
		return data.access_token;
	} catch (error: any) {
		console.error("Error during getToken()", error);
	}
};

export const getAuthorizedUser = async () => {
	const resp = await fetcher(`/api/v2/user`);
	const data = await resp.json();
	return data.user;
};
export const getTeams = async () => {
	const resp = await fetcher(`/api/v2/team`);
	const data = await resp.json();

	return data.teams;
};

export const getSpaces = async (team_id: string) => {
	const response = await fetcher(`/api/v2/team/${team_id}/space`);
	const data = await response.json();
	return data.spaces;
};

export const getFolders = async (space_id: string) => {
	const response = await fetcher(`/api/v2/team/space/${space_id}/folder`);
	const data = await response.json();
	return data.folders;
};

export const getList = async (folder_id: string) => {
	const response = await fetcher(`/api/v2/team/${folder_id}/space`);
	const data = await response.json();
	return data.lists;
};

export const getFolderlessList = async (space_id: string) => {
	const response = await fetcher(`/api/v2/space/${space_id}/list`);
	const data = await response.json();
	return data.lists;
};

export const getTasks = async (list_id: string) => {
	const response = await fetcher(`/api/v2/list/${list_id}/task`);
	const data = await response.json();
	return data.tasks;
};

export const getClickupLists = async (
	folderId: string
): Promise<TAllLists[]> => {
	const response = await fetcher(`/api/v2/folder/${folderId}/list`);
	const data = await response.json();
	return data.lists;
};

export const getWorkspaceUser = async (teamId: string, userId: string) => {
	const response = await fetcher(`/api/v2/team/${teamId}/user/${userId}`);
	const data = await response.json();
	return data;
};

export const getAllFolders = async (space_id: string) => {
	const response = await fetcher(`/api/v2/space/${space_id}/folder`);
	const data = await response.json();
	return data.folders;
};

export const getListMembers = async (list_id: string): Promise<TMember[]> => {
	const response = await fetcher(`/api/v2/list/${list_id}/member`);
	const data = await response.json();
	return data.members;
};

export const createTask = async ({
	listId,
	data,
}: {
	listId: string;
	data: TCreateTask;
}) => {
	const response = await fetcher(`/api/v2/list/${listId}/task`, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	});

	const responseData = await response.json();
	return responseData;
};
