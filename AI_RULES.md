# AI Rules and Technical Guidelines for OneFlow

This document outlines the core technical stack and mandatory library usage rules for the AI editor (Dyad) when modifying or extending the OneFlow application.

## 🏗 Core Tech Stack Summary

1.  **Framework:** React 18 with TypeScript.
2.  **Build Tool:** Vite.
3.  **Styling:** Tailwind CSS, utilizing the custom HSL-based design system and the `glass` / `glass-dark` utility classes for the glass morphism aesthetic.
4.  **UI Components:** shadcn/ui (built on Radix UI primitives).
5.  **Routing:** React Router v6 (`react-router-dom`).
6.  **Data Persistence:** Local storage managed via utility functions in `src/lib/storage.ts`.
7.  **Drag & Drop:** `@dnd-kit` for Kanban board functionality.
8.  **Notifications:** Sonner for all toast notifications.
9.  **Icons:** Lucide React.
10. **Date Handling:** `date-fns`.

## 🎯 Library Usage Rules

To maintain consistency and leverage existing infrastructure, adhere to the following library mandates:

| Functionality | Mandatory Library/Location | Notes |
| :--- | :--- | :--- |
| **UI Components** | `src/components/ui/` (shadcn/ui) | Use pre-built shadcn components. If customization is needed, wrap the component in a new file in `src/components/`. |
| **Styling** | Tailwind CSS | Use Tailwind classes exclusively. Ensure responsive design is always considered. |
| **Data Storage** | `src/lib/storage.ts` | All CRUD operations for `Project` and `Task` data must use the functions defined here (e.g., `getProjects`, `updateProject`). |
| **Routing** | `react-router-dom` | Use `useNavigate`, `useParams`, `Routes`, and `Route`. |
| **Drag & Drop** | `@dnd-kit` | Use `@dnd-kit/core` for context and `@dnd-kit/sortable` for list items (tasks). |
| **Notifications** | `sonner` | Use `import { toast } from "sonner"` for all user feedback notifications. |
| **Icons** | `lucide-react` | Use icons from this package. |
| **Forms & Validation** | `react-hook-form` & `zod` | Use these for complex form handling and schema validation (as per `package.json`). |
| **Theming** | Existing implementation | Theme switching is handled by `src/components/ThemeToggle.tsx`. Do not introduce new theme management logic. |