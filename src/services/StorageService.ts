import { IList, ISpace } from "../interfaces/api.types";

export class StorageService {
	private static instance: StorageService;

	private constructor() {}

	public static getInstance(): StorageService {
		if (!StorageService.instance) {
			StorageService.instance = new StorageService();
		}
		return StorageService.instance;
	}

	// Token related methods
	public getToken(): string | null {
		return localStorage.getItem("click_up_token");
	}

	public setToken(token: string): void {
		localStorage.setItem("click_up_token", token);
	}

	public removeToken(): void {
		localStorage.removeItem("click_up_token");
	}

	// Code related methods
	public setCode(code: string): void {
		localStorage.setItem("CLICK_UP_CODE", code);
	}

	public getCode(): string | null {
		return localStorage.getItem("CLICK_UP_CODE");
	}

	// List related methods
	public setLists(lists: IList[]): void {
		localStorage.setItem("lists", JSON.stringify(lists));
	}

	public getLists(): IList[] {
		const lists = localStorage.getItem("lists");
		return lists ? JSON.parse(lists) : [];
	}

	public setSelectedList(list: { name: string; id: string }): void {
		localStorage.setItem("selectedList", JSON.stringify(list));
	}

	public getSelectedList(): { name: string; id: string } | null {
		const selectedList = localStorage.getItem("selectedList");
		return selectedList ? JSON.parse(selectedList) : null;
	}

	// Space related methods
	public setSelectedSpace(space: { name: string; id: string }): void {
		localStorage.setItem("selectedSpace", JSON.stringify(space));
	}

	public getSelectedSpace(): { name: string; id: string } | null {
		const selectedSpace = localStorage.getItem("selectedSpace");
		return selectedSpace ? JSON.parse(selectedSpace) : null;
	}

	// Clear all data
	public clearAllData(): void {
		localStorage.removeItem("lists");
		localStorage.removeItem("selectedList");
		localStorage.removeItem("click_up_token");
		localStorage.removeItem("selectedSpace");
		localStorage.removeItem("CLICK_UP_CODE");
	}
}
