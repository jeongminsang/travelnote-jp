import { createClient } from "@supabase/supabase-js";

export interface KeepAliveProject {
    name: string;
    url: string;
    serviceRoleKey: string;
}

export async function pingSupabase(project: KeepAliveProject) {
    try {
        const supabase = createClient(project.url, project.serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Simple query to keep the DB active
        // This assumes a 'keep-alive' table exists
        const { data, error } = await supabase
            .from("schedules")
            .select("id")
            .limit(1);

        if (error) {
            console.error(`[Keep-Alive] Ping failed for ${project.name}:`, error.message);
            return { success: false, name: project.name, error: error.message };
        }

        console.log(`[Keep-Alive] Ping successful for ${project.name}`);
        return { success: true, name: project.name };
    } catch (error: any) {
        console.error(`[Keep-Alive] Unexpected error for ${project.name}:`, error.message);
        return { success: false, name: project.name, error: error.message };
    }
}
