import React, { useState } from "react"
import {
    supabase,
    fetchStaffProfile,
    type StaffProfile,
} from "../lib/supabase"

interface LoginScreenProps {
    logoUrl?: string
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
    onBackToSplash?: () => void
    onSignedIn?: (profile: StaffProfile) => void
}

export function LoginScreen({
    logoUrl = "",
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
    onSignedIn,
}: LoginScreenProps) {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [recoveryEmail, setRecoveryEmail] = useState("")
    const [recoverySent, setRecoverySent] = useState(false)

    const resolveEmail = async (rawInput: string): Promise<string> => {
        const trimmed = rawInput.trim()
        if (trimmed.includes("@")) {
            return trimmed.toLowerCase()
        }

        const { data, error: lookupError } = await supabase
            .from("profiles")
            .select("email")
            .ilike("rta_id", trimmed)
            .maybeSingle()

        if (lookupError || !data?.email) {
            throw new Error(
                "Could not find an account for that RTA ID. Try signing in with your email."
            )
        }

        return data.email.trim().toLowerCase()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier.trim() || !password.trim()) {
            setError("Please enter both your RTA ID (or email) and password.")
            return
        }

        setSubmitting(true)
        setError("")

        try {
            const email = await resolveEmail(identifier)
            const { data, error: authError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

            if (authError || !data.user) {
                setError(authError?.message || "Invalid login credentials.")
                return
            }

            const profile = await fetchStaffProfile(data.user.id)
            onSignedIn?.(profile)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to sign in."
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!recoveryEmail.trim()) return

        await supabase.auth.resetPasswordForEmail(
            recoveryEmail.trim().toLowerCase()
        )
        setRecoverySent(true)
    }

    return (
        <div
            style={{
                minHeight: "100dvh",
                backgroundColor: "#FFFFFF",
                color: blackColor,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "28px 22px 24px",
                boxSizing: "border-box",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    maxWidth: "420px",
                    width: "100%",
                    margin: "0 auto",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <div style={{ marginBottom: "28px" }}>
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Rising Talent Academy"
                            style={{
                                height: "42px",
                                width: "auto",
                                objectFit: "contain",
                                marginBottom: "18px",
                                display: "block",
                            }}
                        />
                    )}
                    <div
                        style={{
                            width: "56px",
                            height: "3px",
                            borderRadius: "999px",
                            background: `linear-gradient(90deg, ${redColor}, ${blueColor})`,
                            marginBottom: "14px",
                        }}
                    />
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "24px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            color: blackColor,
                        }}
                    >
                        Staff Portal Sign In
                    </h1>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <div>
                        <label
                            htmlFor="rta-id"
                            style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: greyColor,
                                marginBottom: "6px",
                            }}
                        >
                            RTA ID or Email
                        </label>
                        <input
                            id="rta-id"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="e.g. A.Dyson8 or name@email.com"
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "13px 14px",
                                fontSize: "15px",
                                borderRadius: "10px",
                                border: "1px solid rgba(0, 2, 1, 0.16)",
                                color: blackColor,
                                backgroundColor: "#FFFFFF",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="rta-password"
                            style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: greyColor,
                                marginBottom: "6px",
                            }}
                        >
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                id="rta-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "13px 68px 13px 14px",
                                    fontSize: "15px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(0, 2, 1, 0.16)",
                                    color: blackColor,
                                    backgroundColor: "#FFFFFF",
                                    outline: "none",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    border: "none",
                                    background: "transparent",
                                    color: blueColor,
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "4px 6px",
                                }}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 500,
                                color: redColor,
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            marginTop: "4px",
                            width: "100%",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: blackColor,
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.7 : 1,
                        }}
                    >
                        {submitting ? "Signing In..." : "Continue to Portal"}
                    </button>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            marginTop: "2px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setRecoverySent(false)
                                setSheetOpen(true)
                            }}
                            style={{
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                fontSize: "13px",
                                fontWeight: 500,
                                color: greyColor,
                                textDecoration: "underline",
                                cursor: "pointer",
                            }}
                        >
                            Forgot RTA ID or password?
                        </button>
                    </div>
                </form>
            </div>

            <footer
                style={{
                    maxWidth: "420px",
                    width: "100%",
                    margin: "24px auto 0",
                    textAlign: "center",
                    fontSize: "12px",
                    color: greyColor,
                }}
            >
                risingtalentacademy.co.uk
            </footer>

            {sheetOpen && (
                <div
                    onClick={() => setSheetOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 2, 1, 0.45)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        zIndex: 20,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "460px",
                            backgroundColor: "#FFFFFF",
                            borderTopLeftRadius: "18px",
                            borderTopRightRadius: "18px",
                            padding: "24px 22px 28px",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "12px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    color: blackColor,
                                }}
                            >
                                Account Recovery
                            </h2>
                            <button
                                type="button"
                                onClick={() => setSheetOpen(false)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: greyColor,
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        </div>

                        {recoverySent ? (
                            <p
                                style={{
                                    margin: "8px 0 0",
                                    fontSize: "14px",
                                    color: blackColor,
                                    lineHeight: 1.5,
                                }}
                            >
                                If{" "}
                                <strong>{recoveryEmail}</strong> is
                                registered with Rising Talent Academy, recovery
                                details have been queued.
                            </p>
                        ) : (
                            <form
                                onSubmit={handleRecoverySubmit}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        color: greyColor,
                                        lineHeight: 1.45,
                                    }}
                                >
                                    Enter your team email to look up your RTA ID
                                    or reset your password.
                                </p>
                                <input
                                    type="email"
                                    required
                                    value={recoveryEmail}
                                    onChange={(e) =>
                                        setRecoveryEmail(e.target.value)
                                    }
                                    placeholder="name@risingtalentacademy.co.uk"
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "12px 14px",
                                        fontSize: "14px",
                                        borderRadius: "10px",
                                        border: "1px solid rgba(0, 2, 1, 0.16)",
                                        color: blackColor,
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        width: "100%",
                                        padding: "13px 16px",
                                        borderRadius: "10px",
                                        border: "none",
                                        backgroundColor: blueColor,
                                        color: "#FFFFFF",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        cursor: "pointer",
                                    }}
                                >
                                    Send Recovery Request
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
