import { createClient } from "@supabase/supabase-js"

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

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchStaffProfile(userId: string): Promise<StaffProfile> {
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

export async function signInStaff(email: string, password: string): Promise<StaffProfile> {
    const cleanEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
    })

    if (error || !data.user) {
        throw new Error(error?.message || "Invalid email or password.")
    }

    return await fetchStaffProfile(data.user.id)
}
