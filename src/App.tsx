import React, { useEffect, useState } from "react"
import { SplashScreen } from "./components/SplashScreen"
import { LoginScreen } from "./components/LoginScreen"
import { ResetPasswordScreen } from "./components/ResetPasswordScreen"
import {
    DashboardScreen,
    StaffProfile as DashboardStaffProfile,
} from "./components/DashboardScreen"
import {
    supabase,
    fetchStaffProfile,
    type StaffProfile as SupabaseStaffProfile,
} from "./lib/supabase"

type Screen = "splash" | "login" | "reset-password" | "dashboard"

function mapToDashboardUser(
    profile: SupabaseStaffProfile
): DashboardStaffProfile {
    return {
        rtaId: profile.rta_id,
        name: profile.full_name,
        role: profile.role,
        permissionGroup: profile.permission_group,
    }
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("splash")
    const [currentUser, setCurrentUser] =
        useState<DashboardStaffProfile | null>(null)

    const logoUrl = `${import.meta.env.BASE_URL}rta-logo`

    useEffect(() => {
        let active = true

        if (!supabase) return

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event) => {
                if (active && event === "PASSWORD_RECOVERY") {
                    setScreen("reset-password")
                }
            }
        )

        async function restoreSession() {
            try {
                if (!supabase) return
                const { data } = await supabase.auth.getSession()
                if (active && data.session?.user) {
                    const profile = await fetchStaffProfile(data.session.user.id)
                    if (active) {
                        setCurrentUser(mapToDashboardUser(profile))
                        setScreen((prev) =>
                            prev === "reset-password" ? "reset-password" : "dashboard"
                        )
                    }
                }
            } catch {
                // Stay on normal flow if there is no active session
            }
        }

        restoreSession()

        return () => {
            active = false
            authListener.subscription.unsubscribe()
        }
    }, [])

    const handleSignedIn = (profile: SupabaseStaffProfile) => {
        setCurrentUser(mapToDashboardUser(profile))
        setScreen("dashboard")
    }

    const handleSignOut = async () => {
        await supabase?.auth.signOut()
        setCurrentUser(null)
        setScreen("login")
    }

    if (screen === "reset-password") {
        return (
            <ResetPasswordScreen
                logoUrl={logoUrl}
                onDone={() => setScreen("login")}
            />
        )
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

    return <LoginScreen logoUrl={logoUrl} onSignedIn={handleSignedIn} />
}
