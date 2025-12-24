import { supabase } from './supabase';
import { Project } from './types';

// Auth User Type Mapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSupabaseUser = (user: any): AuthUser => ({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    initials: user.user_metadata?.initials || null,
    role: user.user_metadata?.role || 'member',
    avatarUrl: user.user_metadata?.avatar_url || null,
});

// Auth User Interface
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    initials: string | null;
    role: string;
    avatarUrl?: string | null;
}

// Auth Response Interface
export interface AuthResponse {
    user: AuthUser;
    token: string;
}

export class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
    // Register new user
    register: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    name: data.name,
                    role: 'member'
                }
            }
        });

        if (error) throw new ApiError(error.status || 500, error.message);
        if (!authData.user) throw new ApiError(500, 'Registration failed');

        return {
            user: mapSupabaseUser(authData.user),
            token: authData.session?.access_token || '',
        };
    },

    // Login user
    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) throw new ApiError(error.status || 401, error.message);
        if (!authData.user) throw new ApiError(500, 'Login failed');

        return {
            user: mapSupabaseUser(authData.user),
            token: authData.session?.access_token || '',
        };
    },

    // Get current user
    me: async (): Promise<AuthUser> => {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) throw new ApiError(401, 'Not authenticated');

        return mapSupabaseUser(user);
    },

    // Update user profile
    updateProfile: async (data: { name?: string; avatarUrl?: string }): Promise<AuthUser> => {
        const { data: userData, error } = await supabase.auth.updateUser({
            data: {
                ...data.name && { name: data.name },
                ...data.avatarUrl && { avatar_url: data.avatarUrl }
            }
        });

        if (error) throw new ApiError(error.status || 500, error.message);
        if (!userData.user) throw new ApiError(500, 'Update failed');

        return mapSupabaseUser(userData.user);
    },

    // Logout
    logout: async (): Promise<void> => {
        await supabase.auth.signOut();
    },
};

// ============================================================================
// PROJECT API
// ============================================================================

// Helper to map DB Project to Frontend Project type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDbProjectToProject = (dbProject: any): Project => {
    // Map teams from relation structure if available, otherwise empty
    // Note: Supabase query structure might differ from Drizzle's relations
    // We expect join tables or specific view structures here. 
    // apt: We will adjust query to match expected format or map accordingly.

    // For now assuming we fetch teams in a way we can map
    const graphicTeams = dbProject.project_teams
        ?.filter((t: any) => t.role === 'graphic')
        .map((t: any) => t.team_id) || [];
    const motionTeams = dbProject.project_teams
        ?.filter((t: any) => t.role === 'motion')
        .map((t: any) => t.team_id) || [];
    const musicTeams = dbProject.project_teams
        ?.filter((t: any) => t.role === 'music')
        .map((t: any) => t.team_id) || [];

    return {
        id: dbProject.id,
        title: dbProject.title,
        type: dbProject.type,
        status: dbProject.status,
        eventTeamName: dbProject.event_team_name,
        brief: dbProject.brief,
        eventStartDate: dbProject.event_start_date,
        eventEndDate: dbProject.event_end_date,
        backgroundUrl: dbProject.background_url,
        createdAt: dbProject.created_at,
        updatedAt: dbProject.updated_at,

        // Asset links
        deckLink: dbProject.asset_links?.deckLink || '',
        graphicAssetsLink: dbProject.asset_links?.graphicAssetsLink || '',
        threeDAssetsLink: dbProject.asset_links?.threeDAssetsLink || '',
        videoAssetsLink: dbProject.asset_links?.videoAssetsLink || '',
        finalAnimationLink: dbProject.asset_links?.finalAnimationLink || '',
        decorLink: dbProject.asset_links?.decorLink || '',

        // Teams
        graphicTeams,
        motionTeams,
        musicTeams,

        // Relations
        tasks: dbProject.tasks || [],
        comments: dbProject.comments || [],
        concerns: dbProject.concerns || [],
    };
};

export const projectApi = {
    getAll: async (params?: { status?: string, month?: number, year?: number }): Promise<Project[]> => {
        let query = supabase
            .from('projects')
            .select(`
                *,
                project_teams (
                    team_id,
                    role
                ),
                tasks (*)
            `)
            .order('event_start_date', { ascending: false });

        if (params?.status) {
            query = query.eq('status', params.status);
        }

        // Month/Year filtering on client side or via range queries, 
        // Supabase doesn't have direct month/year extract in simple API filters easily without RPC.
        // We will fetch and filter in memory for now to match behavior, or use date ranges if strict.

        const { data, error } = await query;
        if (error) throw new ApiError(500, error.message);

        let projects = data.map(mapDbProjectToProject);

        if (params?.month !== undefined && params?.year !== undefined) {
            projects = projects.filter((p) => {
                const start = new Date(p.eventStartDate);
                const end = new Date(p.eventEndDate);
                return (
                    (start.getMonth() === params.month && start.getFullYear() === params.year) ||
                    (end.getMonth() === params.month && end.getFullYear() === params.year)
                );
            });
        }

        return projects;
    },

    getById: async (id: string): Promise<Project> => {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_teams (
                    team_id,
                    role
                ),
                tasks (*),
                comments (*),
                concerns (*)
            `)
            .eq('id', id)
            .single();

        if (error) throw new ApiError(error.code === 'PGRST116' ? 404 : 500, error.message);

        return mapDbProjectToProject(data);
    },

    create: async (projectData: any): Promise<Project> => {
        // Prepare payload, converting camelCase to snake_case for DB
        const payload = {
            title: projectData.title,
            type: projectData.type,
            event_team_name: projectData.eventTeamName,
            brief: projectData.brief,
            event_start_date: projectData.eventStartDate,
            event_end_date: projectData.eventEndDate,
            background_url: projectData.backgroundUrl,
            asset_links: {
                deckLink: projectData.deckLink,
                graphicAssetsLink: projectData.graphicAssetsLink,
                threeDAssetsLink: projectData.threeDAssetsLink,
                videoAssetsLink: projectData.videoAssetsLink,
                finalAnimationLink: projectData.finalAnimationLink,
                decorLink: projectData.decorLink,
            }
        };

        const { data: project, error } = await supabase
            .from('projects')
            .insert(payload)
            .select()
            .single();

        if (error) throw new ApiError(500, error.message);

        // Insert Teams
        const teamInserts: any[] = [];
        if (projectData.graphicTeams?.length) {
            projectData.graphicTeams.forEach((teamId: string) =>
                teamInserts.push({ project_id: project.id, team_id: teamId, role: 'graphic' })
            );
        }
        if (projectData.motionTeams?.length) {
            projectData.motionTeams.forEach((teamId: string) =>
                teamInserts.push({ project_id: project.id, team_id: teamId, role: 'motion' })
            );
        }
        if (projectData.musicTeams?.length) {
            projectData.musicTeams.forEach((teamId: string) =>
                teamInserts.push({ project_id: project.id, team_id: teamId, role: 'music' })
            );
        }

        if (teamInserts.length > 0) {
            const { error: teamError } = await supabase
                .from('project_teams')
                .insert(teamInserts);

            if (teamError) console.error('Error adding teams:', teamError);
        }

        // Return full project
        return projectApi.getById(project.id);
    },

    update: async (id: string, projectData: any): Promise<Project> => {
        const payload: any = {};
        if (projectData.title) payload.title = projectData.title;
        if (projectData.type) payload.type = projectData.type;
        if (projectData.eventTeamName) payload.event_team_name = projectData.eventTeamName;
        if (projectData.brief) payload.brief = projectData.brief;
        if (projectData.eventStartDate) payload.event_start_date = projectData.eventStartDate;
        if (projectData.eventEndDate) payload.event_end_date = projectData.eventEndDate;
        if (projectData.backgroundUrl) payload.background_url = projectData.backgroundUrl;

        const assetKeys = ['deckLink', 'graphicAssetsLink', 'threeDAssetsLink', 'videoAssetsLink', 'finalAnimationLink', 'decorLink'];
        const hasAssetUpdates = assetKeys.some(k => k in projectData);

        if (hasAssetUpdates) {
            // We need to fetch existing assets to merge if we want partial updates, but for now assuming full overwrite of links if provided
            // Or better yet, we just structure it as a JSONB update.
            payload.asset_links = {
                deckLink: projectData.deckLink,
                graphicAssetsLink: projectData.graphicAssetsLink,
                threeDAssetsLink: projectData.threeDAssetsLink,
                videoAssetsLink: projectData.videoAssetsLink,
                finalAnimationLink: projectData.finalAnimationLink,
                decorLink: projectData.decorLink,
            };
        }

        const { error } = await supabase
            .from('projects')
            .update(payload)
            .eq('id', id);

        if (error) throw new ApiError(500, error.message);

        // Update Teams if provided
        if (projectData.graphicTeams || projectData.motionTeams || projectData.musicTeams) {
            // Delete existing
            await supabase.from('project_teams').delete().eq('project_id', id);

            // Re-insert
            const teamInserts: any[] = [];
            if (projectData.graphicTeams?.length) {
                projectData.graphicTeams.forEach((teamId: string) =>
                    teamInserts.push({ project_id: id, team_id: teamId, role: 'graphic' })
                );
            }
            if (projectData.motionTeams?.length) {
                projectData.motionTeams.forEach((teamId: string) =>
                    teamInserts.push({ project_id: id, team_id: teamId, role: 'motion' })
                );
            }
            if (projectData.musicTeams?.length) {
                projectData.musicTeams.forEach((teamId: string) =>
                    teamInserts.push({ project_id: id, team_id: teamId, role: 'music' })
                );
            }

            if (teamInserts.length > 0) {
                await supabase.from('project_teams').insert(teamInserts);
            }
        }

        return projectApi.getById(id);
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw new ApiError(500, error.message);
    },

    archive: async (id: string): Promise<Project> => {
        const { error } = await supabase.from('projects').update({ status: 'archived' }).eq('id', id);
        if (error) throw new ApiError(500, error.message);
        return projectApi.getById(id);
    }
};

// ============================================================================
// HELPERS (Legacy Support)
// ============================================================================
export const getStoredUser = () => {
    // We now rely on Supabase session, but for compatibility we can check local storage logic via Supabase
    // Ideally we remove this but strict refactor might break other components.
    // For now returning null to force components to use AuthContext or await authApi.me()
    return null;
};
export const getAuthToken = () => {
    // Managed by Supabase
    return null;
};
export const setAuthToken = () => { };
export const setStoredUser = () => { };
export const clearAuthToken = () => { };

