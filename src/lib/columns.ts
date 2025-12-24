import { ColumnId } from "./types";

export interface Column {
  id: ColumnId;
  title: string;
  color: string;
}

export const columns: Column[] = [
  { id: "todo-graphics", title: "TO DO (Graphics)", color: "hsl(var(--muted))" },
  { id: "wip-graphics", title: "WIP (Graphics)", color: "hsl(var(--primary))" },
  { id: "qc-graphics", title: "QC (Graphics)", color: "hsl(var(--secondary))" },
  { id: "revision-graphics", title: "REVISION (Graphics)", color: "hsl(var(--accent))" },
  { id: "done-graphics", title: "DONE (Graphics)", color: "hsl(var(--success))" },
  { id: "todo-motion", title: "TO DO (Motion)", color: "hsl(var(--muted))" },
  { id: "wip-motion", title: "WIP (Motion)", color: "hsl(var(--primary))" },
  { id: "qc-motion", title: "QC (Motion)", color: "hsl(var(--secondary))" },
  { id: "revision-motion", title: "REVISION (Motion)", color: "hsl(var(--accent))" },
  { id: "final", title: "FINAL", color: "hsl(var(--success))" },
];
