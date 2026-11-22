import React, { useState } from "react"

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

function getVisibleActions(group: PermissionGroup): ActionItem[] {
    return ALL_ACTIONS.filter((action) => {
        if (action.category === "core") return true
        if (group === "leadership") return true
        if (group === "both") {
            return (
                action.category === "journalist" ||
                action.category === "creator"
            )
        }
        return action.category === group
    })
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

    const visibleActions = getVisibleActions(user.permissionGroup)

    const getAccentColor = (accent: ActionItem["accent"]) => {
        if (accent === "red") return redColor
        if (accent === "blue") return blueColor
        return blackColor
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
                padding: "20px 20px 24px",
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
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: "14px",
                        borderBottom: "1px solid rgba(0, 2, 1, 0.1)",
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
                                    height: "32px",
                                    width: "auto",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                        )}
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: greyColor,
                            }}
                        >
                            Staff Portal
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onSignOut}
                        style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(0, 2, 1, 0.16)",
                            backgroundColor: "#FFFFFF",
                            color: blackColor,
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Sign Out
                    </button>
                </header>

                <div
                    style={{
                        width: "100%",
                        height: "3px",
                        borderRadius: "999px",
                        background: `linear-gradient(90deg, ${redColor}, ${blueColor})`,
                        margin: "14px 0 18px",
                    }}
                />

                <section
                    style={{
                        padding: "16px 18px",
                        borderRadius: "14px",
                        border: "1px solid rgba(0, 2, 1, 0.12)",
                        backgroundColor: "rgba(0, 2, 1, 0.02)",
                        marginBottom: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                letterSpacing: "-0.01em",
                                color: blackColor,
                            }}
                        >
                            {user.name}
                        </span>
                        <span
                            style={{
                                color: greyColor,
                                fontSize: "14px",
                                fontWeight: 400,
                            }}
                        >
                            |
                        </span>
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: blueColor,
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
                                display: "inline-block",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(0, 2, 1, 0.06)",
                                fontSize: "12px",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: greyColor,
                            }}
                        >
                            {user.rtaId}
                        </span>

                        <span
                            style={{
                                display: "inline-block",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                backgroundColor:
                                    user.permissionGroup === "leadership"
                                        ? "rgba(250, 52, 37, 0.1)"
                                        : "rgba(3, 78, 175, 0.08)",
                                fontSize: "11px",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                color:
                                    user.permissionGroup === "leadership"
                                        ? redColor
                                        : blueColor,
                            }}
                        >
                            {GROUP_LABELS[user.permissionGroup]}
                        </span>
                    </div>
                </section>

                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "12px",
                    }}
                >
                    {visibleActions.map((action) => {
                        const barColor = getAccentColor(action.accent)
                        const isLeadershipAction =
                            action.category === "leadership"
                        return (
                            <button
                                key={action.id}
                                type="button"
                                onClick={() => setSelectedAction(action)}
                                style={{
                                    textAlign: "left",
                                    padding: "16px 14px",
                                    borderRadius: "14px",
                                    border: isLeadershipAction
                                        ? "1px solid rgba(250, 52, 37, 0.28)"
                                        : "1px solid rgba(0, 2, 1, 0.12)",
                                    backgroundColor: isLeadershipAction
                                        ? "rgba(250, 52, 37, 0.02)"
                                        : "#FFFFFF",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: "110px",
                                    boxSizing: "border-box",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "28px",
                                            height: "3px",
                                            borderRadius: "999px",
                                            backgroundColor: barColor,
                                        }}
                                    />
                                    {isLeadershipAction && (
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                letterSpacing: "0.06em",
                                                textTransform: "uppercase",
                                                color: redColor,
                                            }}
                                        >
                                            Admin
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div
                                        style={{
                                            fontSize: "15px",
                                            fontWeight: 700,
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
                </section>
            </div>

            <footer
                style={{
                    maxWidth: "460px",
                    width: "100%",
                    margin: "28px auto 0",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(0, 2, 1, 0.08)",
                    textAlign: "center",
                    fontSize: "12px",
                    color: greyColor,
                }}
            >
                risingtalentacademy.co.uk
            </footer>

            {selectedAction && (
                <div
                    onClick={() => setSelectedAction(null)}
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
                            padding: "22px 22px 28px",
                            boxSizing: "border-box",
                        }}
                    >
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
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
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
                                fontWeight: 700,
                                color: blackColor,
                            }}
                        >
                            {selectedAction.title}
                        </h2>
                        <p
                            style={{
                                margin: "0 0 18px",
                                fontSize: "14px",
                                lineHeight: 1.5,
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
                                borderRadius: "10px",
                                border: "none",
                                backgroundColor: blackColor,
                                color: "#FFFFFF",
                                fontSize: "13px",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
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
