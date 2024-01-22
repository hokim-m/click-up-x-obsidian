const CLICK_UP_CLIENT = "";
const CLICK_UP_CODE = ""; //retreiving from browser auth0
const CLICK_UP_SECRET =
	"";
const TOKEN =
	"";

const PROXY_HOST = "http://localhost:3000/proxy";

const fetcher = (url: string, options: any = {}) => {
	const token = localStorage.getItem("token");
	options.headers = { Authorization: token };
	return fetch(`${PROXY_HOST}${url}`, options);
};

export const getToken = async () => {
	const query = new URLSearchParams({
		client_id: CLICK_UP_CLIENT,
		client_secret: CLICK_UP_SECRET,
		code: CLICK_UP_CODE,
	}).toString();

	const resp = await fetcher(`/api/v2/oauth/token?${query}`, {
		method: "POST",
	});

	const data = await resp.json();
	console.log(data);

	return TOKEN;
};

export const getAuthorizedUser = async () => {
	const resp = await fetcher(`/api/v2/user`);
	const data = await resp.json();
	return data.user;
};
export const getTeams = async () => {
	const resp = await fetcher(`/api/v2/team`);
	const data = await resp.json();
	console.log(data);

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
