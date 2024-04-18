export type TCreateTask = {
	name: string;
	description: string;
	assignees: number[];
	tags?: string[];
	status?: string;
	priority: number;
	due_date?: number;
	due_date_time?: boolean;
	time_estimate?: number;
	start_date?: number;
	start_date_time?: boolean;
	notify_all?: boolean;
	parent?: any;
	links_to?: any;
	custom_fields?: TCustomfield[];
};

type TCustomfield = {
	id: string;
	value: number | string;
};

export type TAllLists = {
	id: string;
	name: string;
	orderindex: number;
	status: any;
	priority: any;
	assignee: any;
	task_count: number;
	due_date: any;
	start_date: any;
	folder: TListFolder;
	space: TListSpace;
	archived: boolean;
	override_statuses: boolean;
	permission_level: string;
};

type TListFolder = {
	id: string;
	name: string;
	hidden: boolean;
	access: boolean;
};

type TListSpace = {
	id: string;
	name: string;
	access: boolean;
};

export type TMember = {
	id: number;
	username: string;
	email: string;
	color: string;
	initials: string;
	profilePicture: any;
	profileInfo: TMemberProfileInfo;
	value: string | number;
	text: string;
};

type TMemberProfileInfo = {
	display_profile: any;
	verified_ambassador: any;
	verified_consultant: any;
	top_tier_user: any;
	viewed_verified_ambassador: any;
	viewed_verified_consultant: any;
	viewed_top_tier_user: any;
};
export interface ISpace {
	name: string;
	id: string;
}
export interface IList {
	name: string;
	id: string;
}
