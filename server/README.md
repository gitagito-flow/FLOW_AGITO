# OneFlow Backend Server

Express.js + DrizzleORM + Supabase backend for OneFlow project management.

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. Install dependencies: `npm install`
3. Push database schema: `npm run db:push`
4. Start development server: `npm run dev`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects/:id/tasks` | Create task |
| PATCH | `/api/projects/:id/tasks/:taskId/move` | Move task |
| POST | `/api/upload/*` | Upload files |
