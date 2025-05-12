export interface ClickUpPluginSettings {
	user: any;
	teams: any[];
	token: string;
	teamId: string;
}

export const DEFAULT_SETTINGS: Partial<ClickUpPluginSettings> = {
	user: null,
	teamId: "",
	teams: [],
	token: "",
};
