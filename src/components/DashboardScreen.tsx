import React, { useEffect, useState } from "react"

export type PermissionGroup =
    | "journalist"
    | "creator"
    | "both"
    | "leadership"

export interface StaffProfile {
    rtaId: string
    name: string
    role: string
    permissionGroup: PermissionGroup
}

type ActionCategory = "core" | "journalist" | "creator" | "leadership"

interface ActionItem {
    id: string
    title: string
    subtitle: string
    category: ActionCategory
    accent: "red" | "blue" | "black"
    status: string
    details: string
}

interface ActionSection {
    category: ActionCategory
    label: string
    items: ActionItem[]
}

interface DashboardScreenProps {
    logoUrl?: string
    user: StaffProfile
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
    onSignOut: () => void
}

const ALL_ACTIONS: ActionItem[] = [
    // General (Visible to Everyone)
    {
        id: "briefings",
        title: "Team Briefings",
        subtitle: "Notices & weekly priorities",
        category: "core",
        accent: "red",
        status: "Pinned Update",
        details:
            "Read leadership announcements, weekly campaign priorities, and internal operational updates.",
    },
    {
        id: "brand-kit",
        title: "Brand & Media Kit",
        subtitle: "Logos, colours & style rules",
        category: "core",
        accent: "blue",
        status: "Current",
        details:
            "Download official Rising Talent Academy logos, hex codes, social templates, and editorial style guidelines.",
    },
    {
        id: "directory",
        title: "Team Directory",
        subtitle: "Staff, roles & contacts",
        category: "core",
        accent: "black",
        status: "Active Roster",
        details:
            "View active Rising Talent Academy team members, department heads, and internal contact handles.",
    },
    {
        id: "profile-docs",
        title: "My Profile & Docs",
        subtitle: "RTA ID, agreements & policies",
        category: "core",
        accent: "blue",
        status: "Verified",
        details:
            "Review your assigned RTA ID details, signed volunteer agreements, and core compliance policies.",
    },

    // Journalism
    {
        id: "pitch-queue",
        title: "Pitch & Article Queue",
        subtitle: "Story ideas & assignments",
        category: "journalist",
        accent: "red",
        status: "Open",
        details:
            "Submit new article pitches, claim assigned motorsport features, and track editorial status.",
    },
    {
        id: "submit-copy",
        title: "Submit Copy",
        subtitle: "Upload drafts for review",
        category: "journalist",
        accent: "blue",
        status: "Editorial Desk",
        details:
            "Submit completed articles and race reports for Head of Journalism review before website publication.",
    },
    {
        id: "press-notes",
        title: "Press & Fact-Check",
        subtitle: "Driver stats & series notes",
        category: "journalist",
        accent: "black",
        status: "Reference",
        details:
            "Access verified driver profiles, championship standings, and official press reference notes.",
    },

    // Content Creation
    {
        id: "content-calendar",
        title: "Content Calendar",
        subtitle: "Reels, TikTok & Shorts slots",
        category: "creator",
        accent: "red",
        status: "Scheduled",
        details:
            "Check upcoming posting dates, campaign deadlines, and assigned short-form video slots.",
    },
    {
        id: "upload-assets",
        title: "Upload & Assets",
        subtitle: "Clips, graphics & finished edits",
        category: "creator",
        accent: "blue",
        status: "Dropzone Ready",
        details:
            "Upload raw video clips, custom graphics, and finished edits for approval and social scheduling.",
    },
    {
        id: "social-hooks",
        title: "Social Trends & Hooks",
        subtitle: "Captions, audio & templates",
        category: "creator",
        accent: "black",
        status: "Updated",
        details:
            "Browse approved audio trends, caption structures, and branded social overlay packs.",
    },

    // Leadership & Admin
    {
        id: "approvals",
        title: "Editorial & Content Approvals",
        subtitle: "Review & sign off submissions",
        category: "leadership",
        accent: "red",
        status: "Admin",
        details:
            "Review pending articles and social media edits, leave editorial feedback, and approve items for release.",
    },
    {
        id: "id-manager",
        title: "RTA ID & Role Manager",
        subtitle: "Issue IDs & access levels",
        category: "leadership",
        accent: "blue",
        status: "Admin",
        details:
            "Create new RTA IDs, assign Journalist, Content Creator, Both, or Leadership access, and manage active status.",
    },
    {
        id: "hr-legal",
        title: "HR & Legal Vault",
        subtitle: "Agreements, onboarding & logs",
        category: "leadership",
        accent: "black",
        status: "Restricted",
        details:
            "Manage volunteer contracts, onboarding records, media release forms, and internal HR documentation.",
    },
    {
        id: "tech-systems",
        title: "Tech & Systems Control",
        subtitle: "Website, domains & access",
        category: "leadership",
        accent: "red",
        status: "Restricted",
        details:
            "Oversee risingtalentacademy.co.uk infrastructure, shared social credentials, and Staff Portal configuration.",
    },
]

const GROUP_LABELS: Record<PermissionGroup, string> = {
    journalist: "Journalist Access",
    creator: "Content Creator Access",
    both: "Journalist & Creator Access",
    leadership: "Leadership & Admin Access",
}

const SECTION_CONFIG: { category: ActionCategory; label: string }[] = [
    { category: "core", label: "General" },
    { category: "journalist", label: "Journalism" },
    { category: "creator", label: "Content Creation" },
    { category: "leadership", label: "Leadership & Admin" },
]

function isCategoryAllowed(
    category: ActionCategory,
    group: PermissionGroup
): boolean {
    if (category === "core") return true
    if (group === "leadership") return true
    if (group === "both") {
        return category === "journalist" || category === "creator"
    }
    return category === group
}

function getGroupedSections(group: PermissionGroup): ActionSection[] {
    return SECTION_CONFIG.filter((section) =>
        isCategoryAllowed(section.category, group)
    ).map((section) => ({
        category: section.category,
        label: section.label,
        items: ALL_ACTIONS.filter(
            (action) => action.category === section.category
        ),
    }))
}

export function DashboardScreen({
    logoUrl = "",
    user,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
    onSignOut,
}: DashboardScreenProps) {
    const [selectedAction, setSelectedAction] = useState<ActionItem | null>(
        null
    )
    const [activeCardId, setActiveCardId] = useState<string | null>(null)
    const [bannerDismissed, setBannerDismissed] = useState(false)
    const [installSheetOpen, setInstallSheetOpen] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [platformHint, setPlatformHint] = useState<
        "ios" | "android" | "other"
    >("other")

    useEffect(() => {
        const standalone =
            window.matchMedia?.("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean })
                .standalone === true
        setIsStandalone(Boolean(standalone))

        const ua = window.navigator.userAgent.toLowerCase()
        if (/iphone|ipad|ipod/.test(ua)) {
            setPlatformHint("ios")
        } else if (/android/.test(ua)) {
            setPlatformHint("android")
        }
    }, [])

    const sections = getGroupedSections(user.permissionGroup)

    const getAccentColor = (accent: ActionItem["accent"]) => {
        if (accent === "red") return redColor
        if (accent === "blue") return blueColor
        return blackColor
    }

    const shortInstallTip =
        platformHint === "ios"
            ? "iPhone (Safari): Tap Share → Add to Home Screen."
            : platformHint === "android"
              ? "Android (Chrome): Tap ⋮ → Add to Home screen."
              : "Pin to your iPhone or Android Home Screen for instant app access."

    return (
        <div
            style={{
                minHeight: "100dvh",
                backgroundColor: "#F7F8FA",
                color: blackColor,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "16px 20px 26px",
                boxSizing: "border-box",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <div
                style={{
                    maxWidth: "460px",
                    width: "100%",
                    margin: "0 auto",
                }}
            >
                {/* Top Web App Install Banner */}
                {!isStandalone && !bannerDismissed && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            padding: "11px 13px",
                            marginBottom: "14px",
                            borderRadius: "12px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0, 2, 1, 0.1)",
                            boxShadow: "0 4px 14px rgba(0, 2, 1, 0.04)",
                        }}
                    >
                        <div
                            style={{
                                width: "3px",
                                alignSelf: "stretch",
                                borderRadius: "999px",
                                background: `linear-gradient(180deg, ${redColor}, ${blueColor})`,
                                flexShrink: 0,
                            }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    letterSpacing: "0.02em",
                                    color: blackColor,
                                    marginBottom: "2px",
                                }}
                            >
                                Get the Home Screen App
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: greyColor,
                                    lineHeight: 1.35,
                                }}
                            >
                                {shortInstallTip}
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexShrink: 0,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setInstallSheetOpen(true)}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: blueColor,
                                    color: "#FFFFFF",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.03em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                }}
                            >
                                Steps
                            </button>
                            <button
                                type="button"
                                aria-label="Dismiss install banner"
                                onClick={() => setBannerDismissed(true)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: greyColor,
                                    fontSize: "17px",
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    padding: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 0 14px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt="Rising Talent Academy"
                                style={{
                                    height: "34px",
                                    width: "auto",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                        )}
                        <div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: blackColor,
                                }}
                            >
                                Staff Portal
                            </div>
                            <div
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: greyColor,
                                }}
                            >
                                Operations Hub
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onSignOut}
                        style={{
                            padding: "8px 13px",
                            borderRadius: "9px",
                            border: "1px solid rgba(0, 2, 1, 0.14)",
                            backgroundColor: "#FFFFFF",
                            color: blackColor,
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0, 2, 1, 0.04)",
                        }}
                    >
                        Sign Out
                    </button>
                </header>

                {/* Executive Paddock Identity Card */}
                <section
                    style={{
                        borderRadius: "18px",
                        backgroundColor: blackColor,
                        color: "#FFFFFF",
                        overflow: "hidden",
                        marginBottom: "24px",
                        boxShadow: "0 12px 28px rgba(0, 2, 1, 0.14)",
                    }}
                >
                    <div
                        style={{
                            height: "4px",
                            width: "100%",
                            background: `linear-gradient(90deg, ${redColor} 0%, ${redColor} 45%, ${blueColor} 100%)`,
                        }}
                    />

                    <div style={{ padding: "18px 20px 20px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "10px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: "rgba(255, 255, 255, 0.58)",
                                }}
                            >
                                Active Credential
                            </span>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#FFFFFF",
                                }}
                            >
                                <span
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "999px",
                                        backgroundColor: redColor,
                                    }}
                                />
                                Live
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "baseline",
                                gap: "8px",
                                marginBottom: "14px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    color: "#FFFFFF",
                                }}
                            >
                                {user.name}
                            </span>
                            <span
                                style={{
                                    color: "rgba(255, 255, 255, 0.35)",
                                    fontSize: "15px",
                                    fontWeight: 400,
                                }}
                            >
                                |
                            </span>
                            <span
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#7EB2FF",
                                }}
                            >
                                {user.role}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "7px",
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.14)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#FFFFFF",
                                }}
                            >
                                {user.rtaId}
                            </span>

                            <span
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "7px",
                                    backgroundColor:
                                        user.permissionGroup === "leadership"
                                            ? "rgba(250, 52, 37, 0.2)"
                                            : "rgba(3, 78, 175, 0.32)",
                                    border:
                                        user.permissionGroup === "leadership"
                                            ? "1px solid rgba(250, 52, 37, 0.45)"
                                            : "1px solid rgba(126, 178, 255, 0.35)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    color:
                                        user.permissionGroup === "leadership"
                                            ? "#FF7A70"
                                            : "#A7C9FF",
                                }}
                            >
                                {GROUP_LABELS[user.permissionGroup]}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Grouped Action Sections */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                    }}
                >
                    {sections.map((section) => {
                        const isLeadershipSection =
                            section.category === "leadership"
                        return (
                            <section key={section.category}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "11px",
                                        paddingBottom: "6px",
                                        borderBottom: isLeadershipSection
                                            ? "1px solid rgba(250, 52, 37, 0.2)"
                                            : "1px solid rgba(0, 2, 1, 0.08)",
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: "11px",
                                            fontWeight: 800,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                            color: isLeadershipSection
                                                ? redColor
                                                : greyColor,
                                        }}
                                    >
                                        {section.label}
                                    </h2>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: greyColor,
                                        }}
                                    >
                                        {section.items.length}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",
                                        gap: "12px",
                                    }}
                                >
                                    {section.items.map((action) => {
                                        const barColor = getAccentColor(
                                            action.accent
                                        )
                                        const isPressed =
                                            activeCardId === action.id

                                        return (
                                            <button
                                                key={action.id}
                                                type="button"
                                                onPointerDown={() =>
                                                    setActiveCardId(action.id)
                                                }
                                                onPointerUp={() =>
                                                    setActiveCardId(null)
                                                }
                                                onPointerLeave={() =>
                                                    setActiveCardId(null)
                                                }
                                                onClick={() =>
                                                    setSelectedAction(action)
                                                }
                                                style={{
                                                    textAlign: "left",
                                                    padding: "16px 15px",
                                                    borderRadius: "16px",
                                                    border: isLeadershipSection
                                                        ? "1px solid rgba(250, 52, 37, 0.3)"
                                                        : "1px solid rgba(0, 2, 1, 0.09)",
                                                    backgroundColor: "#FFFFFF",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent:
                                                        "space-between",
                                                    minHeight: "116px",
                                                    boxSizing: "border-box",
                                                    transform: isPressed
                                                        ? "scale(0.98)"
                                                        : "scale(1)",
                                                    transition:
                                                        "transform 120ms ease, box-shadow 120ms ease",
                                                    boxShadow: isPressed
                                                        ? "0 2px 6px rgba(0, 2, 1, 0.05)"
                                                        : "0 6px 18px rgba(0, 2, 1, 0.04)",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: "14px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "30px",
                                                            height: "3.5px",
                                                            borderRadius:
                                                                "999px",
                                                            backgroundColor:
                                                                barColor,
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            fontSize: "10px",
                                                            fontWeight: 800,
                                                            letterSpacing:
                                                                "0.08em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: isLeadershipSection
                                                                ? redColor
                                                                : greyColor,
                                                        }}
                                                    >
                                                        {isLeadershipSection
                                                            ? "Admin →"
                                                            : "→"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: "15px",
                                                            fontWeight: 700,
                                                            letterSpacing:
                                                                "-0.01em",
                                                            color: blackColor,
                                                            marginBottom: "4px",
                                                            lineHeight: 1.25,
                                                        }}
                                                    >
                                                        {action.title}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: greyColor,
                                                            lineHeight: 1.35,
                                                        }}
                                                    >
                                                        {action.subtitle}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <footer
                style={{
                    maxWidth: "460px",
                    width: "100%",
                    margin: "30px auto 0",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(0, 2, 1, 0.08)",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: greyColor,
                }}
            >
                risingtalentacademy.co.uk
            </footer>

            {/* Install Instructions Sheet (iPhone & Android) */}
            {installSheetOpen && (
                <div
                    onClick={() => setInstallSheetOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 2, 1, 0.55)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        zIndex: 25,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "460px",
                            backgroundColor: "#FFFFFF",
                            borderTopLeftRadius: "20px",
                            borderTopRightRadius: "20px",
                            padding: "22px 22px 28px",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                width: "36px",
                                height: "4px",
                                borderRadius: "999px",
                                backgroundColor: "rgba(0, 2, 1, 0.14)",
                                margin: "0 auto 16px",
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "14px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "18px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.01em",
                                    color: blackColor,
                                }}
                            >
                                Add to Home Screen
                            </h2>
                            <button
                                type="button"
                                onClick={() => setInstallSheetOpen(false)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: greyColor,
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div
                            style={{
                                padding: "13px 15px",
                                borderRadius: "14px",
                                border: "1px solid rgba(0, 2, 1, 0.1)",
                                backgroundColor: "#F9FAFB",
                                marginBottom: "12px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: redColor,
                                    marginBottom: "6px",
                                }}
                            >
                                iPhone (Safari)
                            </div>
                            <ol
                                style={{
                                    margin: 0,
                                    paddingLeft: "18px",
                                    fontSize: "13px",
                                    lineHeight: 1.55,
                                    color: blackColor,
                                }}
                            >
                                <li>
                                    Open this portal in <strong>Safari</strong>.
                                </li>
                                <li>
                                    Tap the <strong>Share</strong> icon at the
                                    bottom of the screen.
                                </li>
                                <li>
                                    Scroll down and tap{" "}
                                    <strong>Add to Home Screen</strong>, then
                                    tap <strong>Add</strong>.
                                </li>
                            </ol>
                        </div>

                        <div
                            style={{
                                padding: "13px 15px",
                                borderRadius: "14px",
                                border: "1px solid rgba(0, 2, 1, 0.1)",
                                backgroundColor: "#F9FAFB",
                                marginBottom: "18px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: blueColor,
                                    marginBottom: "6px",
                                }}
                            >
                                Android (Chrome)
                            </div>
                            <ol
                                style={{
                                    margin: 0,
                                    paddingLeft: "18px",
                                    fontSize: "13px",
                                    lineHeight: 1.55,
                                    color: blackColor,
                                }}
                            >
                                <li>
                                    Open this portal in <strong>Chrome</strong>.
                                </li>
                                <li>
                                    Tap the <strong>three-dot menu (⋮)</strong>{" "}
                                    in the top-right corner.
                                </li>
                                <li>
                                    Tap <strong>Add to Home screen</strong> (or{" "}
                                    <strong>Install app</strong>) and confirm.
                                </li>
                            </ol>
                        </div>

                        <button
                            type="button"
                            onClick={() => setInstallSheetOpen(false)}
                            style={{
                                width: "100%",
                                padding: "13px 16px",
                                borderRadius: "11px",
                                border: "none",
                                backgroundColor: blackColor,
                                color: "#FFFFFF",
                                fontSize: "13px",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            {/* Action Detail Sheet */}
            {selectedAction && (
                <div
                    onClick={() => setSelectedAction(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 2, 1, 0.55)",
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
                            borderTopLeftRadius: "20px",
                            borderTopRightRadius: "20px",
                            padding: "22px 22px 28px",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                width: "36px",
                                height: "4px",
                                borderRadius: "999px",
                                backgroundColor: "rgba(0, 2, 1, 0.14)",
                                margin: "0 auto 16px",
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.09em",
                                    textTransform: "uppercase",
                                    color: getAccentColor(
                                        selectedAction.accent
                                    ),
                                }}
                            >
                                {selectedAction.status}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedAction(null)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: greyColor,
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <h2
                            style={{
                                margin: "0 0 8px",
                                fontSize: "20px",
                                fontWeight: 800,
                                letterSpacing: "-0.01em",
                                color: blackColor,
                            }}
                        >
                            {selectedAction.title}
                        </h2>
                        <p
                            style={{
                                margin: "0 0 20px",
                                fontSize: "14px",
                                lineHeight: 1.55,
                                color: greyColor,
                            }}
                        >
                            {selectedAction.details}
                        </p>

                        <button
                            type="button"
                            onClick={() => setSelectedAction(null)}
                            style={{
                                width: "100%",
                                padding: "13px 16px",
                                borderRadius: "11px",
                                border: "none",
                                backgroundColor: blackColor,
                                color: "#FFFFFF",
                                fontSize: "13px",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
