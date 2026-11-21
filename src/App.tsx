import React, { useState } from "react"
import { SplashScreen } from "./components/SplashScreen"
import { LoginScreen } from "./components/LoginScreen"

type Screen = "splash" | "login"

export default function App() {
    const [screen, setScreen] = useState<Screen>("splash")
    const [signedInUser, setSignedInUser] = useState<string | null>(null)

    const logoUrl = encodeURI(
        `${import.meta.env.BASE_URL}Rising Talent Academy Logo .jpg-Photoroom.png`
    )

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

    return (
        <LoginScreen
            logoUrl={logoUrl}
            onBackToSplash={() => setScreen("splash")}
            onSignedIn={(rtaId) => setSignedInUser(rtaId)}
        />
    )
}
