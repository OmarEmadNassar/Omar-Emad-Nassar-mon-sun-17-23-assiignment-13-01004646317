import type { BoardState, Task } from "./types";

const STORAGE_KEY = "kanban-board-state-v1";

function defaultState(): BoardState {
  const now = Date.now();
  const tasks: Task[] = [
    {
      id: crypto.randomUUID(),
      taskNumber: 1,
      title: "Welcome to your Kanban board",
      description: "Click the pencil icon to edit any task, or use the + button to add a new one.",
      priority: "medium",
      dueDate: null,
      status: "done",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      taskNumber: 2,
      title: "Try adding a task",
      description: "Use the + button in the top right corner.",
      priority: "medium",
      dueDate: null,
      status: "todo",
      createdAt: now,
    },
  ];

  return { tasks, nextTaskNumber: 3 };
}

export class BoardStorage {
  load(): BoardState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = defaultState();
      this.save(initial);
      return initial;
    }
    try {
      const parsed = JSON.parse(raw) as BoardState;
      if (!parsed.tasks || typeof parsed.nextTaskNumber !== "number") {
        throw new Error("Invalid shape");
      }
      return parsed;
    } catch {
      const fallback = defaultState();
      this.save(fallback);
      return fallback;
    }
  }

  save(state: BoardState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
