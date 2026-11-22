import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type PermissionGroup = "journalist" | "creator" | "both" | "leadership"

export interface StaffProfile {
    id: string
    email: string | null
    full_name: string
    rta_id: string
    role: string
    permission_group: PermissionGroup
    created_at?: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : null

export async function fetchStaffProfile(userId: string): Promise<StaffProfile> {
    if (!supabase) {
        throw new Error("Supabase is not configured yet.")
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, rta_id, role, permission_group, created_at")
        .eq("id", userId)
        .single()

    if (error) {
        throw new Error(error.message || "Could not load staff profile.")
    }

    return data as StaffProfile
}
