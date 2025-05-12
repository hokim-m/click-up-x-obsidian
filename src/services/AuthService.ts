import { ApiService } from "./ApiService";
import { ISpace, IList } from "../interfaces/api.types";

export class AuthService {
	private static instance: AuthService;
	private apiService: ApiService;

	private constructor() {
		this.apiService = ApiService.getInstance();
	}

	public static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	/**
	 * Authenticates with ClickUp using the provided code
	 */
	public async authenticate(code: string): Promise<string | undefined> {
		return await this.apiService.getToken(code);
	}

	/**
	 * Gets the authenticated user
	 */
	public async getAuthenticatedUser() {
		return await this.apiService.getAuthorizedUser();
	}

	/**
	 * Fetches teams for the authenticated user
	 */
	public async getTeams() {
		return await this.apiService.getTeams();
	}

	/**
	 * Checks if user is authenticated
	 */
	public isAuthenticated(): boolean {
		return Boolean(localStorage.getItem("click_up_token"));
	}

	/**
	 * Logs the user out
	 */
	public logout(): void {
		localStorage.removeItem("lists");
		localStorage.removeItem("selectedList");
		localStorage.removeItem("click_up_token");
		localStorage.removeItem("selectedSpace");
	}

	/**
	 * Loads all spaces for all teams
	 */
	public async loadAllSpaces(teams: any[]): Promise<ISpace[]> {
		const spaces: ISpace[] = [];

		for (const team of teams) {
			const teamSpaces = await this.apiService.getSpaces(team.id);
			teamSpaces.forEach((sp: any) =>
				spaces.push({ name: sp.name, id: sp.id })
			);
		}

		return spaces;
	}

	/**
	 * Loads all lists for all spaces in all teams
	 */
	public async loadAllLists(teams: any[]): Promise<IList[]> {
		const lists: IList[] = [];

		for (const team of teams) {
			const spaces = await this.apiService.getSpaces(team.id);

			for (const space of spaces) {
				const folders = await this.apiService.getAllFolders(space.id);

				for (const folder of folders || []) {
					const folderLists =
						(await this.apiService.getList(folder.id)) || [];
					folderLists.forEach((list: any) =>
						lists.push({ name: list.name, id: list.id })
					);
				}

				const folderlessLists =
					(await this.apiService.getFolderlessList(space.id)) || [];
				folderlessLists.forEach((list: any) =>
					lists.push({ name: list.name, id: list.id })
				);
			}
		}

		return lists;
	}

	/**
	 * Stores lists in local storage
	 */
	public async configureListsLocally(teams: any[]): Promise<void> {
		const lists: IList[] = await this.loadAllLists(teams);
		localStorage.setItem("lists", JSON.stringify(lists));
	}
}
