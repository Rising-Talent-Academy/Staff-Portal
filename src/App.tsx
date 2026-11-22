import React, { useState } from "react"
import { SplashScreen } from "./components/SplashScreen"
import { LoginScreen } from "./components/LoginScreen"
import {
    DashboardScreen,
    StaffProfile,
} from "./components/DashboardScreen"

type Screen = "splash" | "login" | "dashboard"

const STAFF_DIRECTORY: Record<string, StaffProfile> = {
    "RTA-001": {
        rtaId: "RTA-001",
        name: "Founder",
        role: "Founder",
        permissionGroup: "leadership",
    },
    "RTA-002": {
        rtaId: "RTA-002",
        name: "Antony Dyson",
        role: "Head of Journalism",
        permissionGroup: "leadership",
    },
    "RTA-003": {
        rtaId: "RTA-003",
        name: "Editorial Writer",
        role: "Journalist",
        permissionGroup: "journalist",
    },
    "RTA-004": {
        rtaId: "RTA-004",
        name: "Social Creator",
        role: "Content Creator",
        permissionGroup: "creator",
    },
    "RTA-005": {
        rtaId: "RTA-005",
        name: "Media Contributor",
        role: "Journalist & Content Creator",
        permissionGroup: "both",
    },
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("splash")
    const [currentUser, setCurrentUser] = useState<StaffProfile | null>(null)

    const logoUrl = `${import.meta.env.BASE_URL}rta-logo`

    const handleSignedIn = (rawId: string) => {
        const normalized = rawId.trim().toUpperCase()
        const matched = STAFF_DIRECTORY[normalized] || {
            rtaId: normalized,
            name: "Team Member",
            role: "Journalist & Content Creator",
            permissionGroup: "both",
        }
        setCurrentUser(matched)
        setScreen("dashboard")
    }

    if (screen === "splash") {
        return (
            <SplashScreen
                logoUrl={logoUrl}
                subtitle="Staff Portal"
                duration={2.6}
                onComplete={() => setScreen("login")}
            />
        )
    }

    if (screen === "dashboard" && currentUser) {
        return (
            <DashboardScreen
                logoUrl={logoUrl}
                user={currentUser}
                onSignOut={() => {
                    setCurrentUser(null)
                    setScreen("login")
                }}
            />
        )
    }

    return <LoginScreen logoUrl={logoUrl} onSignedIn={handleSignedIn} />
}
