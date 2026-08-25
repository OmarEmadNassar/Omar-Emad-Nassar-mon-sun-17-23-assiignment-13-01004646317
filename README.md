# Kanban Task Manager

A Kanban-style task manager built with **TypeScript** (strict mode) and Vite. Data persists in `localStorage` — no backend required.

## Features
- Full CRUD on tasks (create, edit, delete) with title, description, priority and due date
- Three fixed columns: To Do, In Progress, Completed
- Status buttons (Start / Complete / To Do) plus drag-and-drop between columns
- State saved to `localStorage` automatically
- Strict TypeScript throughout (`strict: true` in `tsconfig.json`) — no `.js` source files

## Project structure
```
src/
  types.ts     # Task / Column / BoardState interfaces
  storage.ts   # localStorage load/save layer
  app.ts       # KanbanApp class: rendering + CRUD + drag-and-drop
  main.ts      # entry point
  style.css    # styling
index.html
```

## Run it

```bash
npm install
npm run dev       # start dev server
npm run build      # type-check (tsc) + production build to dist/
npm run preview    # preview the production build
```
