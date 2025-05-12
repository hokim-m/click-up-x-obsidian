import { TCreateTask } from "../interfaces/api.types";
import { ApiService } from "./ApiService";
import { Notice } from "obsidian";

export class TaskService {
	private static instance: TaskService;
	private apiService: ApiService;

	private constructor() {
		this.apiService = ApiService.getInstance();
	}

	public static getInstance(): TaskService {
		if (!TaskService.instance) {
			TaskService.instance = new TaskService();
		}
		return TaskService.instance;
	}

	/**
	 * Creates a new task in the specified list
	 */
	public async createTask(listId: string, taskData: TCreateTask) {
		try {
			const task = await this.apiService.createTask({
				data: taskData,
				listId: listId,
			});

			if (task.err) {
				console.log(task);
				throw new Error(task.err);
			}

			new Notice("Created new task!", 3000);
			return task;
		} catch (err: any) {
			const errorResponse = await this.apiService.showError(err);
			return { error: errorResponse, success: false };
		}
	}

	/**
	 * Creates a task from the selected text in the editor
	 */
	public async createTaskFromSelection(selection: string, listId: string) {
		const requestData: TCreateTask = {
			name: selection,
			description: "",
			assignees: [],
			priority: 3,
		};

		try {
			const task = await this.apiService.createTask({
				data: requestData,
				listId,
			});

			if (task.err) {
				throw new Error(task.err);
			}

			// new Notice("Created new task!", 3000);
			return task;
		} catch (err: any) {
			const errorResponse = await this.apiService.showError(err);
			return { error: errorResponse, success: false };
		}
	}

	/**
	 * Gets tasks from a list
	 */
	public async getTasks(listId: string) {
		try {
			return await this.apiService.getTasks(listId);
		} catch (err: any) {
			const errorResponse = await this.apiService.showError(err);
			return { error: errorResponse, success: false };
		}
	}

	/**
	 * Format task data for table display
	 */
	public formatTasksForTable(tasks: any[]) {
		return tasks.map((task: any, index: number) => {
			return {
				order: index + 1,
				name: task.name,
				status: task.status.status,
				date_created: new Date(
					Number(task.date_created)
				).toLocaleString("en-US"),
				creator: task.creator.username,
				assignees: task.assignees.map((u: any) => u.username),
				priority: task?.priority?.priority ?? "Low",
			};
		});
	}
}
