import type { BoardState, Priority, Status, StatusColumn, Task } from "./types";
import { BoardStorage } from "./storage";

const COLUMNS: StatusColumn[] = [
  { id: "todo", title: "To Do", icon: "clipboard" },
  { id: "in-progress", title: "In Progress", icon: "spinner" },
  { id: "done", title: "Completed", icon: "check" },
];

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH", 
};

const ICONS: Record<string, string> = {
  clipboard:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  spinner:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" stroke-dasharray="24 12"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 12 9 17 20 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><polygon points="6 3 20 12 6 21"/></svg>',
  undo: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
};

function icon(name: string): string {
  return ICONS[name] ?? "";
}

export class KanbanApp {
  private state: BoardState;
  private storage = new BoardStorage();
  private root: HTMLElement;
  private editingTaskId: string | "new" | null = null;
  private draggedTaskId: string | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.state = this.storage.load();
    this.render();
  }

  private persist(): void {
    this.storage.save(this.state);
  }

  private tasksForStatus(status: Status): Task[] {
    return this.state.tasks
      .filter((t) => t.status === status)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  private createTask(input: { title: string; description: string; priority: Priority; dueDate: string | null; status: Status }): void {
    const task: Task = {
      id: crypto.randomUUID(),
      taskNumber: this.state.nextTaskNumber,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      dueDate: input.dueDate,
      status: input.status,
      createdAt: Date.now(),
    };
    this.state.tasks.push(task);
    this.state.nextTaskNumber += 1;
    this.persist();
    this.render();
  }

  private updateTask(id: string, input: { title: string; description: string; priority: Priority; dueDate: string | null }): void {
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.title = input.title.trim();
    task.description = input.description.trim();
    task.priority = input.priority;
    task.dueDate = input.dueDate;
    this.persist();
    this.render();
  }

  private deleteTask(id: string): void {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    this.persist();
    this.render();
  }

  private setStatus(id: string, status: Status): void {
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.status = status;
    this.persist();
    this.render();
  }

  private render(): void {
    this.root.innerHTML = "";
    this.root.appendChild(this.buildHeader());

    const board = document.createElement("div");
    board.className = "board";
    COLUMNS.forEach((column) => board.appendChild(this.buildColumn(column)));
    this.root.appendChild(board);

    this.root.appendChild(this.buildFooter());

    if (this.editingTaskId !== null) {
      this.root.appendChild(this.buildModal());
    }
  }

  private buildHeader(): HTMLElement {
    const header = document.createElement("header");
    header.className = "app-header";

    const brand = document.createElement("div");
    brand.className = "brand";
    const logo = document.createElement("span");
    logo.className = "brand-logo";
    logo.innerHTML = icon("clipboard");
    const name = document.createElement("span");
    name.className = "brand-name";
    name.textContent = "Kanban";
    brand.appendChild(logo);
    brand.appendChild(name);

    const addBtn = document.createElement("button");
    addBtn.className = "add-btn";
    addBtn.innerHTML = icon("plus");
    addBtn.setAttribute("aria-label", "Add task");
    addBtn.addEventListener("click", () => {
      this.editingTaskId = "new";
      this.render();
    });

    header.appendChild(brand);
    header.appendChild(addBtn);
    return header;
  }

  private buildFooter(): HTMLElement {
    const footer = document.createElement("footer");
    footer.className = "app-footer";
    footer.innerHTML = `Made with <span class="heart">&#10084;</span> by Omar NaSsar`;
    return footer;
  }

  private buildColumn(column: StatusColumn): HTMLElement {
    const tasks = this.tasksForStatus(column.id);

    const el = document.createElement("section");
    el.className = "column";
    el.dataset.status = column.id;

    const header = document.createElement("div");
    header.className = "column-header";

    const iconBadge = document.createElement("span");
    iconBadge.className = `column-icon icon-${column.id}`;
    iconBadge.innerHTML = icon(column.icon);

    const titleWrap = document.createElement("div");
    const titleEl = document.createElement("h2");
    titleEl.textContent = column.title;
    const countEl = document.createElement("span");
    countEl.className = "column-count-label";
    countEl.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(countEl);

    header.appendChild(iconBadge);
    header.appendChild(titleWrap);
    el.appendChild(header);

    const list = document.createElement("div");
    list.className = "task-list";

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      list.classList.add("drag-over");
    });
    list.addEventListener("dragleave", () => list.classList.remove("drag-over"));
    list.addEventListener("drop", (e) => {
      e.preventDefault();
      list.classList.remove("drag-over");
      if (this.draggedTaskId) {
        this.setStatus(this.draggedTaskId, column.id);
        this.draggedTaskId = null;
      }
    });

    if (tasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 7h5l2-2h4l2 2h5v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
        </svg>
        <p class="empty-title">No tasks yet</p>
        <p class="empty-hint">Click + to add one</p>
      `;
      list.appendChild(empty);
    } else {
      tasks.forEach((task) => list.appendChild(this.buildCard(task)));
    }

    el.appendChild(list);
    return el;
  }

  private buildCard(task: Task): HTMLElement {
    const card = document.createElement("article");
    card.className = "task-card";
    card.draggable = true;

    card.addEventListener("dragstart", () => {
      this.draggedTaskId = task.id;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));

    const top = document.createElement("div");
    top.className = "card-top";

    const idBadge = document.createElement("span");
    idBadge.className = `card-id status-dot-${task.status}`;
    idBadge.textContent = `#${String(task.taskNumber).padStart(3, "0")}`;

    const cardActions = document.createElement("div");
    cardActions.className = "card-icon-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.innerHTML = icon("edit");
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => {
      this.editingTaskId = task.id;
      this.render();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn danger";
    deleteBtn.innerHTML = icon("trash");
    deleteBtn.title = "Delete";
        deleteBtn.addEventListener("click", () => {
      Swal.fire({
        title: "Delete this task?",
        text: "This can't be returned.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
      }).then((result) => {
        if (result.isConfirmed) {
          this.deleteTask(task.id);
        }
      });
    });

    cardActions.appendChild(editBtn);
    cardActions.appendChild(deleteBtn);
    top.appendChild(idBadge);
    top.appendChild(cardActions);

    const titleEl = document.createElement("h3");
    titleEl.className = task.status === "done" ? "card-title done" : "card-title";
    titleEl.textContent = task.title;

    const descEl = document.createElement("p");
    descEl.className = "card-desc";
    descEl.textContent = task.description;

    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `badge priority-${task.priority}`;
    priorityBadge.innerHTML = `<span class="badge-dot"></span>${PRIORITY_LABEL[task.priority]}`;
    badgeRow.appendChild(priorityBadge);

    if (task.status === "done") {
      const doneBadge = document.createElement("span");
      doneBadge.className = "badge badge-done";
      doneBadge.innerHTML = `${icon("check")} DONE`;
      badgeRow.appendChild(doneBadge);
    }

    const metaRow = document.createElement("div");
    metaRow.className = "meta-row";

    if (task.dueDate) {
      const dueEl = document.createElement("span");
      dueEl.className = "meta-item";
      dueEl.innerHTML = `${icon("calendar")} ${formatDueDate(task.dueDate)}`;
      metaRow.appendChild(dueEl);
    }

    const timeEl = document.createElement("span");
    timeEl.className = "meta-item";
    timeEl.innerHTML = `${icon("clock")} ${formatRelativeTime(task.createdAt)}`;
    metaRow.appendChild(timeEl);

    const actionsRow = document.createElement("div");
    actionsRow.className = "card-action-row";
    this.buildStatusActions(task).forEach((btn) => actionsRow.appendChild(btn));

    card.appendChild(top);
    card.appendChild(titleEl);
    if (task.description) card.appendChild(descEl);
    card.appendChild(badgeRow);
    card.appendChild(metaRow);
    card.appendChild(actionsRow);

    return card;
  }

  private buildStatusActions(task: Task): HTMLElement[] {
    const makeBtn = (label: string, iconName: string, variant: string, target: Status): HTMLElement => {
      const btn = document.createElement("button");
      btn.className = `status-btn ${variant}`;
      btn.innerHTML = `${icon(iconName)} ${label}`;
      btn.addEventListener("click", () => this.setStatus(task.id, target));
      return btn;
    };

    if (task.status === "todo") {
      return [makeBtn("Start", "play", "start", "in-progress"), makeBtn("Complete", "check", "complete", "done")];
    }
    if (task.status === "in-progress") {
      return [makeBtn("To Do", "undo", "todo", "todo"), makeBtn("Complete", "check", "complete", "done")];
    }
    return [makeBtn("To Do", "undo", "todo", "todo"), makeBtn("Start", "play", "start", "in-progress")];
  }

  private buildModal(): HTMLElement {
    const isNew = this.editingTaskId === "new";
    const existing = isNew ? null : this.state.tasks.find((t) => t.id === this.editingTaskId) ?? null;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.editingTaskId = null;
        this.render();
      }
    });

    const modal = document.createElement("div");
    modal.className = "modal";

    const headerRow = document.createElement("div");
    headerRow.className = "modal-header";
    const heading = document.createElement("h2");
    heading.textContent = isNew ? "New Task" : "Edit Task";
    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
      this.editingTaskId = null;
      this.render();
    });
    headerRow.appendChild(heading);
    headerRow.appendChild(closeBtn);

    const form = document.createElement("form");

    const titleLabel = document.createElement("label");
    titleLabel.className = "field-label";
    titleLabel.innerHTML = `Task Title <span class="required">*</span>`;
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.required = true;
    titleInput.value = existing?.title ?? "";
    titleInput.className = "text-input";
    titleInput.maxLength = 120;

    const row = document.createElement("div");
    row.className = "field-row";

    const priorityLabel = document.createElement("label");
    priorityLabel.className = "field-label";
    priorityLabel.textContent = "Priority";
    const prioritySelect = document.createElement("select");
    prioritySelect.className = "text-input";
    (["low", "medium", "high"] as Priority[]).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      if ((existing?.priority ?? "medium") === p) opt.selected = true;
      prioritySelect.appendChild(opt);
    });
    const priorityField = document.createElement("div");
    priorityField.className = "field";
    priorityField.appendChild(priorityLabel);
    priorityField.appendChild(prioritySelect);

    const dueLabel = document.createElement("label");
    dueLabel.className = "field-label";
    dueLabel.textContent = "Due Date";
    const dueInput = document.createElement("input");
    dueInput.type = "date";
    dueInput.className = "text-input";
    dueInput.min = todayISO();
    dueInput.value = existing?.dueDate ?? "";
    const dueField = document.createElement("div");
    dueField.className = "field";
    dueField.appendChild(dueLabel);
    dueField.appendChild(dueInput);

    row.appendChild(priorityField);
    row.appendChild(dueField);

    const descLabel = document.createElement("label");
    descLabel.className = "field-label";
    descLabel.textContent = "Description";
    const descInput = document.createElement("textarea");
    descInput.className = "text-input";
    descInput.maxLength = 500;
    descInput.value = existing?.description ?? "";
    const charCount = document.createElement("div");
    charCount.className = "char-count";
    const updateCount = () => (charCount.textContent = `${descInput.value.length}/500`);
    updateCount();
    descInput.addEventListener("input", updateCount);

    const dateError = document.createElement("p");
    dateError.className = "field-error";
    dateError.style.display = "none";
    dateError.textContent = "Due date can't be in the past.";

    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      this.editingTaskId = null;
      this.render();
    });
    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "btn btn-save";
    saveBtn.innerHTML = isNew ? `${icon("plus")} Add Task` : `${icon("edit")} Save Changes`;
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!titleInput.value.trim()) return;

    const dueDate = dueInput.value || null;
    if (dueDate && dueDate < todayISO()) {
      dateError.style.display = "block";
      return;
    }
    dateError.style.display = "none";

    const priority = prioritySelect.value as Priority;
        this.editingTaskId = null;
        
    if (isNew) {
      this.createTask({ title: titleInput.value, description: descInput.value, priority, dueDate, status: "todo" });
    } else if (existing) {
      this.updateTask(existing.id, { title: titleInput.value, description: descInput.value, priority, dueDate });
    }
    });

    form.appendChild(titleLabel);
    form.appendChild(titleInput);
    form.appendChild(row);
    form.appendChild(dateError);
    form.appendChild(descLabel);
    form.appendChild(descInput);
    form.appendChild(charCount);
    form.appendChild(actions);

    modal.appendChild(headerRow);
    modal.appendChild(form);
    overlay.appendChild(modal);
    return overlay;
  }
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
