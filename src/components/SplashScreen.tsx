import React, { useEffect, useState } from "react"

interface SplashScreenProps {
    logoUrl?: string
    subtitle?: string
    duration?: number
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
    onComplete: () => void
}

export function SplashScreen({
    logoUrl = "",
    subtitle = "Staff Portal",
    duration = 2.6,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
    onComplete,
}: SplashScreenProps) {
    const [cycle, setCycle] = useState(0)
    const [exiting, setExiting] = useState(false)

    useEffect(() => {
        setExiting(false)
        const fadeTimer = setTimeout(() => {
            setExiting(true)
        }, duration * 1000)

        const doneTimer = setTimeout(() => {
            onComplete()
        }, (duration + 0.45) * 1000)

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(doneTimer)
        }
    }, [duration, cycle, onComplete])

    return (
        <div
            key={cycle}
            onClick={() => {
                setExiting(true)
                setTimeout(onComplete, 200)
            }}
            style={{
                width: "100%",
                minHeight: "100dvh",
                boxSizing: "border-box",
                backgroundColor: "#FFFFFF",
                color: blackColor,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 24px",
                position: "relative",
                overflow: "hidden",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                userSelect: "none",
                cursor: "pointer",
                opacity: exiting ? 0 : 1,
                transform: exiting ? "scale(1.02)" : "scale(1)",
                transition: "opacity 0.45s ease, transform 0.45s ease",
            }}
        >
            <style>{`
                @keyframes rtaLightGlow {
                    0% { opacity: 0; transform: scale(0.75); }
                    55% { opacity: 0.14; transform: scale(1.06); }
                    100% { opacity: 0.09; transform: scale(1); }
                }
                @keyframes rtaLightLogo {
                    0% { opacity: 0; transform: translateY(20px) scale(0.92); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes rtaLightBar {
                    0% { opacity: 0; transform: scaleX(0); }
                    100% { opacity: 1; transform: scaleX(1); }
                }
                @keyframes rtaLightSub {
                    0% { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div
                style={{
                    position: "absolute",
                    width: "clamp(240px, 72vw, 420px)",
                    height: "clamp(240px, 72vw, 420px)",
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, ${redColor} 0%, ${blueColor} 65%, transparent 100%)`,
                    filter: "blur(72px)",
                    pointerEvents: "none",
                    animation:
                        "rtaLightGlow 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    maxWidth: "420px",
                }}
            >
                {logoUrl && (
                    <div
                        style={{
                            animation:
                                "rtaLightLogo 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        }}
                    >
                        <img
                            src={logoUrl}
                            alt="Rising Talent Academy Logo"
                            style={{
                                width: "clamp(136px, 40vw, 196px)",
                                height: "auto",
                                maxHeight: "136px",
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    </div>
                )}

                <div
                    style={{
                        width: "96px",
                        height: "3px",
                        margin: "18px 0",
                        borderRadius: "999px",
                        background: `linear-gradient(90deg, ${redColor}, ${blueColor})`,
                        animation:
                            "rtaLightBar 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
                    }}
                />

                <p
                    style={{
                        margin: 0,
                        fontSize: "clamp(13px, 3.6vw, 16px)",
                        fontWeight: 600,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: greyColor,
                        animation:
                            "rtaLightSub 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
                    }}
                >
                    {subtitle}
                </p>
            </div>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    setCycle((c) => c + 1)
                }}
                style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    zIndex: 3,
                    padding: "7px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(0, 2, 1, 0.14)",
                    backgroundColor: "rgba(0, 2, 1, 0.04)",
                    color: greyColor,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                }}
            >
                Replay
            </button>
        </div>
    )
}
