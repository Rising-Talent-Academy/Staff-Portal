import React, { useState } from "react"
import { supabase } from "../lib/supabase"

interface ResetPasswordScreenProps {
    logoUrl?: string
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
    onDone?: () => void
}

export function ResetPasswordScreen({
    logoUrl = "",
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
    onDone,
}: ResetPasswordScreenProps) {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [updated, setUpdated] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 6) {
            setError("Password must be at least 6 characters.")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        if (!supabase) {
            setError("Unable to connect to authentication service.")
            return
        }

        setSubmitting(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            })

            if (updateError) {
                setError(updateError.message || "Could not update password.")
                return
            }

            setUpdated(true)
        } catch {
            setError("Could not update password. Please try again.")
        } finally {
            setSubmitting(false)
        }
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
                        Set New Password
                    </h1>
                    <p
                        style={{
                            margin: "6px 0 0",
                            fontSize: "14px",
                            color: greyColor,
                        }}
                    >
                        Choose a new password for your Staff Portal account.
                    </p>
                </div>

                {updated ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: 500,
                                color: blackColor,
                                lineHeight: 1.5,
                            }}
                        >
                            Your password has been updated.
                        </p>
                        <button
                            type="button"
                            onClick={() => onDone?.()}
                            style={{
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
                                cursor: "pointer",
                            }}
                        >
                            Continue to Sign In
                        </button>
                    </div>
                ) : (
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
                                htmlFor="new-password"
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
                                New Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
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

                        <div>
                            <label
                                htmlFor="confirm-password"
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
                                Confirm Password
                            </label>
                            <input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Re-enter new password"
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
                            {submitting ? "Saving..." : "Save New Password"}
                        </button>
                    </form>
                )}
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
        </div>
    )
}
