export type Status = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  status: Status;
  createdAt: number;
}

export interface StatusColumn {
  id: Status;
  title: string;
  icon: string;
}

export interface BoardState {
  tasks: Task[];
  nextTaskNumber: number;
}
