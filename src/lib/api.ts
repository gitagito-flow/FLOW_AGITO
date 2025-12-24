import { supabase } from './supabase';
import { Project, Task, Comment, Concern, ActivityLogEntry, TaskType, ColumnId } from './types';

// ============================================================================
// AUTH API
// ============================================================================

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    initials: string | null;
    role: string;
    avatarUrl?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSupabaseUser = (user: any): AuthUser => ({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    initials: user.user_metadata?.initials || null,
    role: user.user_metadata?.role || 'member',
    avatarUrl: user.user_metadata?.avatar_url || null,
});

export const authApi = {
    register: async (data: { email: string; password: string; name: string }) => {
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: { data: { name: data.name, role: 'member' } }
        });
        if (error) throw error;
        return { user: mapSupabaseUser(authData.user), token: authData.session?.access_token };
    },
    login: async (data: { email: string; password: string }) => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });
        if (error) throw error;
        return { user: mapSupabaseUser(authData.user), token: authData.session?.access_token };
    },
    me: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('Not authenticated');
        return mapSupabaseUser(user);
    },
    logout: async () => { await supabase.auth.signOut(); },
};

// ============================================================================
// PROJECT & TASK API
// ============================================================================

export const projectApi = {
    getAll: async (): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*, tasks(*), project_teams(team_id, role)')
            .order('event_start_date', { ascending: false });
        if (error) throw error;
        return data.map(p => ({
            ...p,
            graphicTeams: p.project_teams?.filter((t: any) => t.role === 'graphic').map((t: any) => t.team_id) || [],
            motionTeams: p.project_teams?.filter((t: any) => t.role === 'motion').map((t: any) => t.team_id) || [],
            musicTeams: p.project_teams?.filter((t: any) => t.role === 'music').map((t: any) => t.team_id) || [],
            tasks: p.tasks || [],
            comments: [], concerns: []
        }));
    },
    getById: async (id: string): Promise<Project> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*, tasks(*), concerns(*), comments(*), project_teams(team_id, role)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return {
            ...data,
            graphicTeams: data.project_teams?.filter((t: any) => t.role === 'graphic').map((t: any) => t.team_id) || [],
            motionTeams: data.project_teams?.filter((t: any) => t.role === 'motion').map((t: any) => t.team_id) || [],
            musicTeams: data.project_teams?.filter((t: any) => t.role === 'music').map((t: any) => t.team_id) || [],
        };
    },
    create: async (p: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('projects').insert({
            creator_id: user?.id,
            title: p.title,
            type: p.type,
            event_team_name: p.eventTeamName,
            brief: p.brief,
            event_start_date: p.eventStartDate,
            event_end_date: p.eventEndDate,
            background_url: p.backgroundUrl,
            asset_links: p.assetLinks || {}
        }).select().single();
        if (error) throw error;
        return data;
    },
    update: async (id: string, p: any) => {
        const { error } = await supabase.from('projects').update({
            title: p.title,
            type: p.type,
            event_team_name: p.eventTeamName,
            brief: p.brief,
            event_start_date: p.eventStartDate,
            event_end_date: p.eventEndDate,
            background_url: p.backgroundUrl,
            asset_links: p.assetLinks || {}
        }).eq('id', id);
        if (error) throw error;
    },
    delete: async (id: string) => { await supabase.from('projects').delete().eq('id', id); }
};

export const taskApi = {
    create: async (t: any) => {
        const { data, error } = await supabase.from('tasks').insert({
            project_id: t.project_id,
            title: t.title,
            description: t.description,
            type: t.type,
            points: t.points,
            column_id: t.columnId,
            deadline: t.deadline || null,
            image_url: t.imageUrl,
            graphic_link: t.graphicLink,
            animation_link: t.animationLink,
            music_link: t.musicLink
        }).select().single();
        if (error) throw error;
        return data;
    },
    update: async (id: string, t: any) => {
        const { error } = await supabase.from('tasks').update({
            title: t.title,
            description: t.description,
            type: t.type,
            points: t.points,
            column_id: t.columnId,
            deadline: t.deadline || null,
            image_url: t.imageUrl,
            graphic_link: t.graphicLink,
            animation_link: t.animationLink,
            music_link: t.musicLink
        }).eq('id', id);
        if (error) throw error;
    },
    move: async (id: string, columnId: string) => {
        const { error } = await supabase.from('tasks').update({ column_id: columnId }).eq('id', id);
        if (error) throw error;
    },
    delete: async (id: string) => { await supabase.from('tasks').delete().eq('id', id); }
};

export const activityApi = {
    log: async (log: any) => {
        const { error } = await supabase.from('activity_logs').insert({
            user_id: log.memberId,
            project_id: log.projectId,
            task_id: log.taskId,
            task_column_id: log.taskColumnId,
            check_in_time: log.checkInTime,
            check_in_date: log.checkInDateOnly
        });
        if (error) throw error;
    }
};