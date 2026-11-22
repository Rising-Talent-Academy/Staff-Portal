import React, { useEffect, useState } from "react"
import { SplashScreen } from "./components/SplashScreen"
import { LoginScreen } from "./components/LoginScreen"
import {
    DashboardScreen,
    StaffProfile as DashboardStaffProfile,
} from "./components/DashboardScreen"
import {
    supabase,
    fetchStaffProfile,
    type StaffProfile as SupabaseStaffProfile,
} from "./lib/supabase"

type Screen = "splash" | "login" | "dashboard"

function mapToDashboardUser(profile: SupabaseStaffProfile): DashboardStaffProfile {
    return {
        rtaId: profile.rta_id,
        name: profile.full_name,
        role: profile.role,
        permissionGroup: profile.permission_group,
    }
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("splash")
    const [currentUser, setCurrentUser] = useState<DashboardStaffProfile | null>(null)
    const [sessionChecked, setSessionChecked] = useState(false)

    const logoUrl = `${import.meta.env.BASE_URL}rta-logo`

    useEffect(() => {
        let active = true

        async function restoreSession() {
            try {
                const { data } = await supabase.auth.getSession()
                if (active && data.session?.user) {
                    const profile = await fetchStaffProfile(data.session.user.id)
                    if (active) {
                        setCurrentUser(mapToDashboardUser(profile))
                        setScreen("dashboard")
                    }
                }
            } catch {
                // If no active session or profile lookup fails, stay on normal flow
            } finally {
                if (active) setSessionChecked(true)
            }
        }

        restoreSession()

        return () => {
            active = false
        }
    }, [])

    const handleSignedIn = (profile: SupabaseStaffProfile) => {
        setCurrentUser(mapToDashboardUser(profile))
        setScreen("dashboard")
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setCurrentUser(null)
        setScreen("login")
    }

    if (screen === "splash") {
        return (
            <SplashScreen
                logoUrl={logoUrl}
                subtitle="Staff Portal"
                duration={2.6}
                onComplete={() => {
                    if (currentUser) {
                        setScreen("dashboard")
                    } else {
                        setScreen("login")
                    }
                }}
            />
        )
    }

    if (screen === "dashboard" && currentUser) {
        return (
            <DashboardScreen
                logoUrl={logoUrl}
                user={currentUser}
                onSignOut={handleSignOut}
            />
        )
    }

    return (
        <LoginScreen
            logoUrl={logoUrl}
            onSignedIn={handleSignedIn}
        />
    )
}
