# OneFlow - Project Management System

A beautiful, modern project management application with drag-and-drop task boards, team collaboration features, and real-time time tracking.

## ✨ Features

### Project Management
- **Create & Edit Projects**: Full CRUD operations with rich metadata
- **Project Types**: Support for both "Project" and "Pitching" workflows
- **Team Assignment**: Multi-select graphic, motion, and music teams
- **Custom Backgrounds**: Upload project-specific background images
- **Progress Tracking**: Real-time completion percentage and task statistics

### Task Board
- **Kanban-Style Workflow**: 10 customizable columns for complete project lifecycle
  - Graphics: TO DO → WIP → QC → REVISION → DONE
  - Motion: TO DO → WIP → QC → REVISION
  - Final delivery stage
- **Drag & Drop**: Smooth task movement between columns
- **Task Types with Point System**:
  - CLIP: 10 points
  - PRESENTATION: 10 points
  - BUMPER: 2 points
  - BACKGROUND: 1 point
  - MINOR ITEM: 0.3 points

### Time Tracking
- **Per-Member Timers**: Individual start/stop timers for each assigned team member
- **Persistent Tracking**: Timer state maintained across page refreshes
- **Duration Accumulation**: Continuous time tracking with pause/resume capability
- **Visual Indicators**: Real-time timer display on task cards

### Collaboration
- **Comments System**: Rich commenting with text and image attachments
- **Zoomable Images**: Full-screen image viewer with zoom, rotate, and pan controls
- **Team Members**: Pre-configured teams with automatic initial generation
- **Task Assignment**: Multi-member assignments across graphic, motion, and music teams

### Analytics & Reporting
- **Performance Dashboard**: Member leaderboard with points and time tracking
- **Project Statistics**: Overall progress, completion rates, and team metrics
- **Individual Stats**: Per-member task completion, points earned, and time spent

### UI/UX
- **Glass Morphism Design**: Modern frosted glass aesthetic with liquid animations
- **Dark/Light Mode**: Seamless theme switching with system preference support
- **Liquid Background**: Animated fluid blob effects
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smooth Animations**: Fade, scale, and slide transitions throughout

## 🏗 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui
- **Drag & Drop**: @dnd-kit
- **State Management**: React hooks with localStorage persistence
- **Routing**: React Router v6
- **Theme**: next-themes for dark mode
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Notifications**: Sonner toasts

## 🎨 Design System

### Colors (HSL-based)
- **Primary**: Dynamic gradient base color
- **Secondary**: Complementary accent color
- **Success**: Task completion indicators
- **Glass Effects**: Translucent frosted containers
- **Semantic Tokens**: Full theme system in `index.css` and `tailwind.config.ts`

### Components
- Custom glass morphism variants
- Gradient buttons and text
- Liquid background animations
- Smooth hover and transition effects

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd oneflow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── BoardColumn.tsx     # Kanban column component
│   ├── TaskCard.tsx        # Individual task cards
│   ├── CreateProjectDialog.tsx
│   ├── CreateTaskDialog.tsx
│   ├── EditProjectDialog.tsx
│   ├── TaskDetailDialog.tsx
│   ├── PerformanceAnalytics.tsx
│   ├── ProjectInfoDialog.tsx
│   ├── ImageViewer.tsx     # Zoomable image viewer
│   ├── EmptyState.tsx      # Empty state placeholder
│   ├── LiquidBackground.tsx
│   └── ThemeToggle.tsx
├── pages/
│   ├── Dashboard.tsx       # Main project listing
│   ├── ProjectView.tsx     # Kanban board view
│   └── NotFound.tsx        # 404 page
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   ├── storage.ts         # localStorage utilities
│   ├── teams.ts           # Team database
│   ├── columns.ts         # Board column definitions
│   ├── taskPoints.ts      # Point system logic
│   └── utils.ts           # Helper functions
└── index.css              # Global styles & design tokens
```

## 👥 Team Database

### Graphic Teams
- TEAM GESTY (5 members)
- TEAM WISNU (4 members)
- TEAM REYZA (5 members)
- TEAM FREDI (3 members)
- TEAM BERRY (4 members)

### Motion Teams
- TEAM IMAM (3 members)
- TEAM REY (3 members)
- TEAM AGITO (3 members)
- TEAM ADRI (3 members)
- TEAM CHIKO (4 members)

### Music Team
- EZZA RUSH (5 members)

## 🔧 Key Features Implementation

### Timer System
Timers persist across page refreshes using localStorage. Each task duration is tracked per member with start/stop functionality.

### Drag & Drop
Powered by @dnd-kit with smooth animations and collision detection. Tasks can be moved between any column stages.

### Point System
Automatic point calculation based on task type. Points are distributed among assigned members and tracked in performance analytics.

### Image Management
- Upload images for projects and tasks
- Zoomable viewer with controls
- Comment attachments with previews
- Base64 encoding for localStorage

## 📱 Responsive Design

- **Desktop**: Full 3-column project grid
- **Tablet**: 2-column responsive layout
- **Mobile**: Single column stack with optimized touch interactions

## 🎯 Future Enhancements

- Backend integration (Supabase/Firebase)
- Real-time collaboration
- File attachments beyond images
- Export reports (PDF/CSV)
- Calendar view for deadlines
- Push notifications
- Email notifications
- Advanced filtering and sorting

## 📄 License

This project is dibuat oleh agito

## 🙏 Acknowledgments

- shadcn/ui for the component library
- Tailwind CSS for the styling system
- @dnd-kit for drag and drop
- Lucide React for icons

---

Built with ❤️ sebagai tanda terimakasi kepada MAXIMUM
