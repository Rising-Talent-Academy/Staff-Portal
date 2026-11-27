import React, { useEffect, useState } from "react"
import { TeamDirectoryView } from "./TeamDirectoryView"
import { ArticlesView } from "./ArticlesView"
import { RoleManagerView } from "./RoleManagerView"
import { OutreachHubView, type OutreachPageMode } from "./OutreachHubView"
import { subscribeDeviceToPush } from "../lib/pushNotifications"
import { TechSystemsView } from "./TechSystemsView"
import { HrLegalVaultView } from "./HrLegalVaultView"
import { UploadAssetsView } from "./UploadAssetsView"

export type PermissionGroup =
    | "journalist"
    | "creator"
    | "both"
    | "outreach"
    | "leadership"

export interface StaffProfile {
    rtaId: string
    name: string
    role: string
    permissionGroup: PermissionGroup
}

type ActionCategory =
    | "core"
    | "journalist"
    | "creator"
    | "outreach"
    | "leadership"

type PortalView =
    | "directory"
    | "queue"
    | "submit"
    | "approvals"
    | "role-manager"
    | "outreach-tracker"
    | "outreach-templates"
    | "outreach-handoffs"
    | "tech-systems"
    | "hr-legal"
    | "upload-assets"

interface ActionItem {
    id: string
    title: string
    subtitle: string
    category: ActionCategory
    accent: "red" | "blue" | "black"
    status: string
    details: string
    featured?: boolean
    targetView?: PortalView
}

interface ActionSection {
    category: ActionCategory
    label: string
    shortLabel: string
    description: string
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
        featured: true,
        details:
            "Read leadership announcements, weekly campaign priorities, and internal operational updates.",
    },
    {
        id: "dept-handoffs",
        title: "Inter-Dept Handoffs",
        subtitle: "Collab briefs & cross-team tasks",
        category: "core",
        accent: "blue",
        status: "Live Board",
        targetView: "outreach-handoffs",
        details:
            "Pick up and complete cross-department requests from Outreach & Comms, Journalism, Creators, and Leadership.",
    },
    {
        id: "brand-kit",
        title: "Brand & Media Kit",
        subtitle: "Logos, colours & style rules",
        category: "core",
        accent: "black",
        status: "Current",
        details:
            "Official Rising Talent Academy brand palette (#fa3425, #000201, #034eaf, #696969), logo usage, and social styling rules.",
    },
    {
        id: "directory",
        title: "Team Directory",
        subtitle: "Staff, roles & contacts",
        category: "core",
        accent: "blue",
        status: "Active Roster",
        targetView: "directory",
        details:
            "View key Rising Talent Academy contacts and raise a ticket inside the portal.",
    },
    {
        id: "profile-docs",
        title: "My Profile & Docs",
        subtitle: "RTA ID, agreements & policies",
        category: "core",
        accent: "black",
        status: "Verified",
        details:
            "Review your assigned RTA ID details, signed agreements, and core portal guidelines.",
    },

    // Journalism
    {
        id: "pitch-queue",
        title: "Article Queue",
        subtitle: "Your articles & current status",
        category: "journalist",
        accent: "red",
        status: "Open",
        featured: true,
        targetView: "queue",
        details:
            "View your submitted articles and check their current editorial status.",
    },
    {
        id: "submit-copy",
        title: "Submit Article",
        subtitle: "Send in a new article",
        category: "journalist",
        accent: "blue",
        status: "Editorial Desk",
        targetView: "submit",
        details:
            "Submit a new article with title, description, photo, text, and credits.",
    },
    {
        id: "press-notes",
        title: "Press & Fact-Check",
        subtitle: "Driver stats & series notes",
        category: "journalist",
        accent: "black",
        status: "Reference",
        details:
            "Access verified driver profiles, standings, and official press reference notes.",
    },

    // Content Creation
    {
        id: "content-calendar",
        title: "Content Calendar",
        subtitle: "Reels, TikTok & Shorts slots",
        category: "creator",
        accent: "red",
        status: "Scheduled",
        featured: true,
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
        targetView: "upload-assets",
        details:
            "Share Google Drive, iCloud, Canva, CapCut & editing links for approval and social scheduling.",
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

    // Outreach & Communications
    {
        id: "outreach-tracker",
        title: "Outreach & Podcast Tracker",
        subtitle: "Rising Talent Talkers & sponsors",
        category: "outreach",
        accent: "red",
        status: "Pipeline",
        featured: true,
        targetView: "outreach-tracker",
        details:
            "Track drivers, teams, and brand partnerships for Rising Talent Talkers and RTA collaborations without double-contacting leads.",
    },
    {
        id: "outreach-templates",
        title: "Outreach Templates & Bio",
        subtitle: "DM scripts, pitches & RTA blurb",
        category: "outreach",
        accent: "blue",
        status: "Copy Ready",
        targetView: "outreach-templates",
        details:
            "Copy ready-to-send podcast invites, team outreach messages, sponsorship pitches, and official RTA descriptions.",
    },
    {
        id: "outreach-handoffs",
        title: "Send Dept Handoff",
        subtitle: "Brief Journalism, Creators & Admin",
        category: "outreach",
        accent: "black",
        status: "Comms Desk",
        targetView: "outreach-handoffs",
        details:
            "Send confirmed guest details, promo requests, and partnership announcements directly to other departments.",
    },

    // Leadership & Admin
    {
        id: "approvals",
        title: "Editorial & Content Approvals",
        subtitle: "Review & sign off submissions",
        category: "leadership",
        accent: "red",
        status: "Admin",
        featured: true,
        targetView: "approvals",
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
        targetView: "role-manager",
        details:
            "Create new RTA IDs, assign Journalist, Content Creator, Both, Outreach & Comms, or Leadership access, and manage active status.",
    },
    {
        id: "hr-legal",
        title: "HR & Legal Vault",
        subtitle: "Agreements, onboarding & logs",
        category: "leadership",
        accent: "black",
        status: "Restricted",
        targetView: "hr-legal",
        details:
            "Manage onboarding records, agreements, and internal documentation.",
    },
    {
        id: "tech-systems",
        title: "Tech & Systems Control",
        subtitle: "Website, domains & access",
        category: "leadership",
        accent: "red",
        status: "Restricted",
        targetView: "tech-systems",
        details:
            "Oversee risingtalentacademy.co.uk infrastructure, shared social credentials, and Staff Portal configuration.",
    },
]

const GROUP_LABELS: Record<PermissionGroup, string> = {
    journalist: "Journalist Access",
    creator: "Content Creator Access",
    both: "Journalist & Creator Access",
    outreach: "Outreach & Comms Access",
    leadership: "Leadership & Admin Access",
}

const SECTION_CONFIG: {
    category: ActionCategory
    label: string
    shortLabel: string
    description: string
}[] = [
    {
        category: "core",
        label: "General",
        shortLabel: "General",
        description: "Briefings, handoffs, brand kit, roster & profile",
    },
    {
        category: "journalist",
        label: "Journalism",
        shortLabel: "Journalism",
        description: "Article queue, copy submission & press notes",
    },
    {
        category: "creator",
        label: "Content Creation",
        shortLabel: "Creator",
        description: "Calendar, asset uploads & hooks",
    },
    {
        category: "outreach",
        label: "Outreach & Communications",
        shortLabel: "Outreach",
        description: "Podcast guests, brand partnerships & comms",
    },
    {
        category: "leadership",
        label: "Leadership & Admin",
        shortLabel: "Leadership",
        description: "Approvals, RTA IDs, HR/legal & systems",
    },
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
        shortLabel: section.shortLabel,
        description: section.description,
        items: ALL_ACTIONS.filter(
            (action) => action.category === section.category
        ),
    }))
}

function getDefaultActiveTab(group: PermissionGroup): ActionCategory | "all" {
    if (group === "creator") return "creator"
    if (group === "journalist") return "journalist"
    if (group === "outreach") return "outreach"
    if (group === "both") return "all"
    if (group === "leadership") return "all"
    return "core"
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
    const [activeView, setActiveView] = useState<PortalView | null>(null)
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
    const [activeTab, setActiveTab] = useState<ActionCategory | "all">(() =>
        getDefaultActiveTab(user.permissionGroup)
    )
    const [pushStatusMsg, setPushStatusMsg] = useState("")
    const [pushBusy, setPushBusy] = useState(false)

    const sections = getGroupedSections(user.permissionGroup)
    const hasMultipleDepts = sections.length > 2

    useEffect(() => {
        setActiveTab(getDefaultActiveTab(user.permissionGroup))
    }, [user.permissionGroup])

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

    const handleEnablePush = async () => {
        setPushBusy(true)
        setPushStatusMsg("")
        const result = await subscribeDeviceToPush(
            user.rtaId,
            user.permissionGroup
        )
        setPushStatusMsg(result.message)
        setPushBusy(false)
    }

    const handleActionClick = (action: ActionItem) => {
        if (action.targetView) {
            setActiveView(action.targetView)
            return
        }
        setSelectedAction(action)
    }

    const getAccentColor = (accent: ActionItem["accent"]) => {
        if (accent === "red") return redColor
        if (accent === "blue") return blueColor
        return blackColor
    }

    const shellStyle: React.CSSProperties = {
        minHeight: "100dvh",
        background:
            "radial-gradient(circle at top right, rgba(3, 78, 175, 0.1), transparent 44%), radial-gradient(circle at top left, rgba(250, 52, 37, 0.09), transparent 40%), #F2F4F8",
        color: blackColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }

    if (activeView === "directory") {
        return (
            <div style={shellStyle}>
                <TeamDirectoryView
                    user={user}
                    onBack={() => setActiveView(null)}
                    redColor={redColor}
                    blueColor={blueColor}
                    greyColor={greyColor}
                    blackColor={blackColor}
                />
            </div>
        )
    }

    if (
        activeView === "queue" ||
        activeView === "submit" ||
        activeView === "approvals"
    ) {
        return (
            <div style={shellStyle}>
                <ArticlesView
                    user={user}
                    initialMode={activeView}
                    onBack={() => setActiveView(null)}
                    redColor={redColor}
                    blueColor={blueColor}
                    greyColor={greyColor}
                    blackColor={blackColor}
                />
            </div>
        )
    }

    if (activeView === "role-manager") {
        return (
            <div style={shellStyle}>
                <RoleManagerView
                    user={user}
                    onBack={() => setActiveView(null)}
                    redColor={redColor}
                    blueColor={blueColor}
                    greyColor={greyColor}
                    blackColor={blackColor}
                />
            </div>
        )
    }

    if (activeView === "tech-systems") {
        return (
            <div style={shellStyle}>
                <TechSystemsView
                    user={user}
                    onBack={() => setActiveView(null)}
                    redColor={redColor}
                    blueColor={blueColor}
                    greyColor={greyColor}
                    blackColor={blackColor}
                />
            </div>
        )
    }

    if (activeView === "hr-legal") {
        return (
            <div style={shellStyle}>
                <HrLegalVaultView
                    user={user}
                    onBack={() => setActiveView(null)}
                    redColor={redColor}
                    blueColor={blueColor}
                    greyColor={greyColor}
                    blackColor={blackColor}
                />
            </div>
        )
    }

    if (activeView === "upload-assets") {
        return (
            <div style={shellStyle}>
                <div
                    style={{
                        maxWidth: "680px",
                        width: "100%",
                        margin: "0 auto",
                        padding: "18px 16px 28px",
                        boxSizing: "border-box",
                    }}
                >
                    <UploadAssetsView
                        defaultCreator={user.name}
                        onBack={() => setActiveView(null)}
                        redColor={redColor}
                        blueColor={blueColor}
                        greyColor={greyColor}
                        blackColor={blackColor}
                    />
                </div>
            </div>
        )
    }

    if (
        activeView === "outreach-tracker" ||
        activeView === "outreach-templates" ||
        activeView === "outreach-handoffs"
    ) {
        const pageMode: OutreachPageMode =
            activeView === "outreach-templates"
                ? "templates"
                : activeView === "outreach-handoffs"
                  ? "handoffs"
                  : "tracker"

        return (
            <div style={shellStyle}>
                <OutreachHubView
                    key={pageMode}
                    user={user}
                    mode={pageMode}
                    onBack={() => setActiveView(null)}
                    redColor={redColor}
                    blueColor={blueColor}
                    greyColor={greyColor}
                    blackColor={blackColor}
                />
            </div>
        )
    }

    const visibleSections =
        activeTab === "all"
            ? sections
            : sections.filter((section) => section.category === activeTab)

    const totalActionsCount = sections.reduce(
        (sum, sec) => sum + sec.items.length,
        0
    )

    const shortInstallTip =
        platformHint === "ios"
            ? "iPhone (Safari): Tap Share → Add to Home Screen."
            : platformHint === "android"
              ? "Android (Chrome): Tap ⋮ → Add to Home screen."
              : "Add to your iPhone or Android Home Screen for full-screen app access."

    const tabs: { key: ActionCategory | "all"; label: string; count: number }[] =
        [
            ...sections.map((sec) => ({
                key: sec.category,
                label: sec.shortLabel,
                count: sec.items.length,
            })),
            ...(hasMultipleDepts
                ? [
                      {
                          key: "all" as const,
                          label: "All",
                          count: totalActionsCount,
                      },
                  ]
                : []),
        ]

    return (
        <div
            style={{
                ...shellStyle,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "16px 16px 28px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: "680px",
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
                            gap: "12px",
                            padding: "11px 14px",
                            marginBottom: "14px",
                            borderRadius: "14px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0, 2, 1, 0.09)",
                            boxShadow: "0 6px 18px rgba(0, 2, 1, 0.05)",
                        }}
                    >
                        <div
                            style={{
                                width: "4px",
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
                                    fontWeight: 800,
                                    letterSpacing: "0.02em",
                                    color: blackColor,
                                    marginBottom: "2px",
                                }}
                            >
                                Install RTA Staff Portal App
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
                                    padding: "7px 11px",
                                    borderRadius: "9px",
                                    border: "none",
                                    backgroundColor: blueColor,
                                    color: "#FFFFFF",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
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
                                    fontSize: "18px",
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
                        padding: "4px 2px 14px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        {logoUrl && (
                            <div
                                style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "12px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "5px",
                                    boxSizing: "border-box",
                                    boxShadow: "0 4px 12px rgba(0, 2, 1, 0.05)",
                                }}
                            >
                                <img
                                    src={logoUrl}
                                    alt="Rising Talent Academy"
                                    style={{
                                        maxHeight: "100%",
                                        maxWidth: "100%",
                                        width: "auto",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                />
                            </div>
                        )}
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
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
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: greyColor,
                                }}
                            >
                                Rising Talent Academy
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onSignOut}
                        style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            border: "1px solid rgba(0, 2, 1, 0.14)",
                            backgroundColor: "#FFFFFF",
                            color: blackColor,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 3px 10px rgba(0, 2, 1, 0.04)",
                        }}
                    >
                        Sign Out
                    </button>
                </header>

                {/* Executive Credential Card */}
                <section
                    style={{
                        borderRadius: "20px",
                        background:
                            "linear-gradient(135deg, #000201 0%, #0E131F 65%, #071936 100%)",
                        color: "#FFFFFF",
                        overflow: "hidden",
                        marginBottom: "14px",
                        boxShadow: "0 16px 34px rgba(0, 2, 1, 0.18)",
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
                                    fontWeight: 800,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "rgba(255, 255, 255, 0.56)",
                                }}
                            >
                                Paddock Pass
                            </span>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: "#FFFFFF",
                                }}
                            >
                                <span
                                    style={{
                                        width: "7px",
                                        height: "7px",
                                        borderRadius: "999px",
                                        backgroundColor: redColor,
                                        boxShadow: `0 0 8px ${redColor}`,
                                    }}
                                />
                                Active
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
                                    fontSize: "21px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    color: "#FFFFFF",
                                }}
                            >
                                {user.name}
                            </span>
                            <span
                                style={{
                                    color: "rgba(255, 255, 255, 0.32)",
                                    fontSize: "15px",
                                    fontWeight: 400,
                                }}
                            >
                                |
                            </span>
                            <span
                                style={{
                                    fontSize: "13.5px",
                                    fontWeight: 700,
                                    color: "#84B6FF",
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
                                justifyContent: "space-between",
                                gap: "8px",
                            }}
                        >
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
                                        padding: "5px 11px",
                                        borderRadius: "8px",
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.11)",
                                        border:
                                            "1px solid rgba(255, 255, 255, 0.16)",
                                        fontSize: "12px",
                                        fontWeight: 800,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: "#FFFFFF",
                                    }}
                                >
                                    {user.rtaId}
                                </span>

                                <span
                                    style={{
                                        padding: "5px 11px",
                                        borderRadius: "8px",
                                        backgroundColor:
                                            user.permissionGroup ===
                                            "leadership"
                                                ? "rgba(250, 52, 37, 0.22)"
                                                : "rgba(3, 78, 175, 0.35)",
                                        border:
                                            user.permissionGroup ===
                                            "leadership"
                                                ? "1px solid rgba(250, 52, 37, 0.5)"
                                                : "1px solid rgba(132, 182, 255, 0.35)",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        letterSpacing: "0.05em",
                                        color:
                                            user.permissionGroup ===
                                            "leadership"
                                                ? "#FF857C"
                                                : "#B5D2FF",
                                    }}
                                >
                                    {GROUP_LABELS[user.permissionGroup]}
                                </span>
                            </div>

                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "rgba(255, 255, 255, 0.65)",
                                }}
                            >
                                {totalActionsCount} tools
                            </span>
                        </div>
                    </div>
                </section>

                {/* Leadership Push Notifications Card */}
                {user.permissionGroup === "leadership" && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            padding: "12px 16px",
                            marginBottom: "14px",
                            borderRadius: "14px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(3, 78, 175, 0.2)",
                            boxShadow: "0 4px 14px rgba(0, 2, 1, 0.04)",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 800,
                                    color: blackColor,
                                }}
                            >
                                Review Alerts (iPhone & Android)
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: greyColor,
                                }}
                            >
                                {pushStatusMsg ||
                                    "Get notified when new articles or content arrive for review."}
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={pushBusy}
                            onClick={handleEnablePush}
                            style={{
                                padding: "8px 13px",
                                borderRadius: "9px",
                                border: "none",
                                backgroundColor: blueColor,
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: pushBusy ? "not-allowed" : "pointer",
                            }}
                        >
                            {pushBusy ? "Enabling..." : "Enable Alerts"}
                        </button>
                    </div>
                )}

                {/* Segmented Switcher (No Dropdowns — Clean 2-Tab Split for 2 Sections) */}
                <div
                    role="tablist"
                    aria-label="Portal sections"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                        gap: "6px",
                        padding: "5px",
                        marginBottom: "14px",
                        borderRadius: "15px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0, 2, 1, 0.09)",
                        boxShadow: "0 6px 18px rgba(0, 2, 1, 0.05)",
                    }}
                >
                    {tabs.map((tab) => {
                        const isSelected = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    position: "relative",
                                    padding: "10px 8px",
                                    borderRadius: "11px",
                                    border: "none",
                                    background: isSelected
                                        ? `linear-gradient(135deg, ${blackColor} 0%, #121A2D 100%)`
                                        : "transparent",
                                    color: isSelected ? "#FFFFFF" : blackColor,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.01em",
                                    overflow: "hidden",
                                    boxShadow: isSelected
                                        ? "0 6px 14px rgba(0, 2, 1, 0.16)"
                                        : "none",
                                }}
                            >
                                <span
                                    style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {tab.label}
                                </span>
                                <span
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        padding: "1px 6px",
                                        borderRadius: "999px",
                                        backgroundColor: isSelected
                                            ? "rgba(255, 255, 255, 0.16)"
                                            : "rgba(0, 2, 1, 0.06)",
                                        color: isSelected ? "#FFFFFF" : greyColor,
                                    }}
                                >
                                    {tab.count}
                                </span>
                                {isSelected && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            height: "3px",
                                            background: `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`,
                                        }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Active Section Cards */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                    }}
                >
                    {visibleSections.map((section) => {
                        const isLeadershipSection =
                            section.category === "leadership"
                        const hasOddCount = section.items.length % 2 === 1

                        return (
                            <section
                                key={section.category}
                                style={{
                                    borderRadius: "18px",
                                    backgroundColor: "#FFFFFF",
                                    border: isLeadershipSection
                                        ? "1px solid rgba(250, 52, 37, 0.25)"
                                        : "1px solid rgba(0, 2, 1, 0.08)",
                                    boxShadow: "0 8px 22px rgba(0, 2, 1, 0.04)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "3px",
                                        width: "100%",
                                        background: isLeadershipSection
                                            ? `linear-gradient(90deg, ${redColor} 0%, ${blackColor} 100%)`
                                            : `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`,
                                    }}
                                />

                                <div style={{ padding: "15px 16px 17px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "10px",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "2px",
                                                    transform: "rotate(45deg)",
                                                    backgroundColor:
                                                        isLeadershipSection
                                                            ? redColor
                                                            : blueColor,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <div style={{ minWidth: 0 }}>
                                                <h2
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "14px",
                                                        fontWeight: 800,
                                                        letterSpacing: "-0.01em",
                                                        color: isLeadershipSection
                                                            ? redColor
                                                            : blackColor,
                                                    }}
                                                >
                                                    {section.label}
                                                </h2>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: greyColor,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {section.description}
                                                </div>
                                            </div>
                                        </div>

                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                padding: "3px 8px",
                                                borderRadius: "999px",
                                                backgroundColor:
                                                    isLeadershipSection
                                                        ? "rgba(250, 52, 37, 0.1)"
                                                        : "rgba(3, 78, 175, 0.08)",
                                                color: isLeadershipSection
                                                    ? redColor
                                                    : blueColor,
                                                flexShrink: 0,
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
                                            gap: "11px",
                                        }}
                                    >
                                        {section.items.map((action, index) => {
                                            const barColor = getAccentColor(
                                                action.accent
                                            )
                                            const isPressed =
                                                activeCardId === action.id
                                            const isLastOddTile =
                                                hasOddCount &&
                                                index ===
                                                    section.items.length - 1
                                            const isDarkFeatured = Boolean(
                                                action.featured
                                            )

                                            return (
                                                <button
                                                    key={action.id}
                                                    type="button"
                                                    onPointerDown={() =>
                                                        setActiveCardId(
                                                            action.id
                                                        )
                                                    }
                                                    onPointerUp={() =>
                                                        setActiveCardId(null)
                                                    }
                                                    onPointerLeave={() =>
                                                        setActiveCardId(null)
                                                    }
                                                    onClick={() =>
                                                        handleActionClick(action)
                                                    }
                                                    style={{
                                                        gridColumn: isLastOddTile
                                                            ? "1 / -1"
                                                            : undefined,
                                                        textAlign: "left",
                                                        padding: "15px 14px",
                                                        borderRadius: "14px",
                                                        border: isDarkFeatured
                                                            ? `1px solid ${
                                                                  isLeadershipSection
                                                                      ? "rgba(250, 52, 37, 0.55)"
                                                                      : "rgba(255, 255, 255, 0.12)"
                                                              }`
                                                            : isLeadershipSection
                                                              ? "1px solid rgba(250, 52, 37, 0.24)"
                                                              : "1px solid rgba(0, 2, 1, 0.08)",
                                                        background: isDarkFeatured
                                                            ? `linear-gradient(135deg, ${blackColor} 0%, #141B2D 100%)`
                                                            : "#F9FAFC",
                                                        color: isDarkFeatured
                                                            ? "#FFFFFF"
                                                            : blackColor,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent:
                                                            "space-between",
                                                        minHeight: isLastOddTile
                                                            ? "88px"
                                                            : "108px",
                                                        boxSizing: "border-box",
                                                        transform: isPressed
                                                            ? "scale(0.985)"
                                                            : "scale(1)",
                                                        transition:
                                                            "transform 120ms ease",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "space-between",
                                                            marginBottom:
                                                                "12px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: "28px",
                                                                height: "3.5px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    isDarkFeatured &&
                                                                    action.accent ===
                                                                        "black"
                                                                        ? "#FFFFFF"
                                                                        : barColor,
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "10px",
                                                                fontWeight: 800,
                                                                letterSpacing:
                                                                    "0.08em",
                                                                textTransform:
                                                                    "uppercase",
                                                                color:
                                                                    isDarkFeatured
                                                                        ? "rgba(255, 255, 255, 0.72)"
                                                                        : isLeadershipSection
                                                                          ? redColor
                                                                          : greyColor,
                                                            }}
                                                        >
                                                            {isLeadershipSection
                                                                ? "Admin →"
                                                                : "Open →"}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight: 700,
                                                                letterSpacing:
                                                                    "-0.01em",
                                                                color:
                                                                    isDarkFeatured
                                                                        ? "#FFFFFF"
                                                                        : blackColor,
                                                                marginBottom:
                                                                    "3px",
                                                                lineHeight: 1.25,
                                                            }}
                                                        >
                                                            {action.title}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color:
                                                                    isDarkFeatured
                                                                        ? "rgba(255, 255, 255, 0.68)"
                                                                        : greyColor,
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
                                </div>
                            </section>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <footer
                style={{
                    maxWidth: "680px",
                    width: "100%",
                    margin: "32px auto 0",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(0, 2, 1, 0.09)",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
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
                        backgroundColor: "rgba(0, 2, 1, 0.58)",
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
                            maxWidth: "520px",
                            backgroundColor: "#FFFFFF",
                            borderTopLeftRadius: "22px",
                            borderTopRightRadius: "22px",
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
                        backgroundColor: "rgba(0, 2, 1, 0.58)",
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
                            maxWidth: "520px",
                            backgroundColor: "#FFFFFF",
                            borderTopLeftRadius: "22px",
                            borderTopRightRadius: "22px",
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
