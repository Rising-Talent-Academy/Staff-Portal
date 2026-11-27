import React, { useEffect, useState } from "react"
import { TeamDirectoryView } from "./TeamDirectoryView"
import { ArticlesView } from "./ArticlesView"
import { RoleManagerView } from "./RoleManagerView"
import { OutreachHubView, type OutreachPageMode } from "./OutreachHubView"
import { subscribeDeviceToPush } from "../lib/pushNotifications"
import { TechSystemsView } from "./TechSystemsView"
import { HrLegalVaultView } from "./HrLegalVaultView"
import { UploadAssetsView } from "./UploadAssetsView"
import { TeamBriefingsView } from "./TeamBriefingsView"
import { DeptMemosView } from "./DeptMemosView"

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
    | "briefings"
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
    accent: "red" | "blue" | "dark"
    status: string
    details: string
    targetView?: PortalView
    featuredDark?: boolean
}

interface DepartmentPage {
    code: string
    category: ActionCategory
    title: string
    subtitle: string
    description: string
    scopeLabel: string
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
    // General
    {
        id: "briefings",
        title: "Team Briefings",
        subtitle: "Notices & weekly priorities",
        category: "core",
        accent: "red",
        status: "Pinned",
        targetView: "briefings",
        featuredDark: true,
        details:
            "Read leadership announcements, weekly campaign priorities, and internal operational updates.",
    },
    {
        id: "dept-handoffs",
        title: "Inter-Dept Handoffs",
        subtitle: "Collab briefs & cross-team tasks",
        category: "core",
        accent: "blue",
        status: "Live",
        targetView: "outreach-handoffs",
        details:
            "Pick up and complete cross-department requests from Outreach & Comms, Journalism, Creators, and Leadership.",
    },
    {
        id: "brand-kit",
        title: "Brand & Media Kit",
        subtitle: "Logos, colours & style rules",
        category: "core",
        accent: "dark",
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
        status: "Roster",
        targetView: "directory",
        details:
            "View key Rising Talent Academy contacts and raise a ticket inside the portal.",
    },
    {
        id: "profile-docs",
        title: "My Profile & Docs",
        subtitle: "RTA ID, agreements & policies",
        category: "core",
        accent: "dark",
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
        targetView: "queue",
        featuredDark: true,
        details:
            "View your submitted articles and check their current editorial status.",
    },
    {
        id: "submit-copy",
        title: "Submit Article",
        subtitle: "Send in a new article",
        category: "journalist",
        accent: "blue",
        status: "Editorial",
        targetView: "submit",
        details:
            "Submit a new article with title, description, photo, text, and credits.",
    },
    {
        id: "press-notes",
        title: "Press & Fact-Check",
        subtitle: "Driver stats & series notes",
        category: "journalist",
        accent: "dark",
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
        featuredDark: true,
        details:
            "Check upcoming posting dates, campaign deadlines, and assigned short-form video slots.",
    },
    {
        id: "upload-assets",
        title: "Upload & Assets",
        subtitle: "Clips, graphics & finished edits",
        category: "creator",
        accent: "blue",
        status: "Dropzone",
        targetView: "upload-assets",
        details:
            "Share Google Drive, iCloud, Canva, CapCut & editing links for approval and social scheduling.",
    },
    {
        id: "social-hooks",
        title: "Social Trends & Hooks",
        subtitle: "Captions, audio & templates",
        category: "creator",
        accent: "dark",
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
        targetView: "outreach-tracker",
        featuredDark: true,
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
        accent: "dark",
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
        targetView: "approvals",
        featuredDark: true,
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
        accent: "dark",
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
        accent: "blue",
        status: "Restricted",
        targetView: "tech-systems",
        details:
            "Oversee risingtalentacademy.co.uk infrastructure, shared social credentials, and Staff Portal configuration.",
    },
]

const GROUP_LABELS: Record<PermissionGroup, string> = {
    journalist: "Journalist",
    creator: "Content Creator",
    both: "Journalist & Creator",
    outreach: "Outreach & Comms",
    leadership: "Leadership & Admin",
}

const DEPARTMENT_META: {
    code: string
    category: ActionCategory
    title: string
    subtitle: string
    description: string
    scopeLabel: string
}[] = [
    {
        code: "01",
        category: "core",
        title: "General",
        subtitle: "Core Hub",
        description: "Briefings, handoffs, brand kit, roster & profile",
        scopeLabel: "All Staff",
    },
    {
        code: "02",
        category: "journalist",
        title: "Journalism",
        subtitle: "Editorial Desk",
        description: "Article queue, copy submission & press reference notes",
        scopeLabel: "Editorial",
    },
    {
        code: "03",
        category: "creator",
        title: "Content Creation",
        subtitle: "Social & Video",
        description: "Content schedule, asset dropzone & trending hooks",
        scopeLabel: "Creators",
    },
    {
        code: "04",
        category: "outreach",
        title: "Outreach & Comms",
        subtitle: "Partnerships",
        description: "Podcast & sponsor tracker, outreach scripts & handoffs",
        scopeLabel: "Comms",
    },
    {
        code: "05",
        category: "leadership",
        title: "Leadership & Admin",
        subtitle: "Restricted Control",
        description: "Approvals, RTA IDs, HR & legal vault, and systems",
        scopeLabel: "Admin Only",
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

function getDepartmentPages(group: PermissionGroup): DepartmentPage[] {
    return DEPARTMENT_META.filter((dept) =>
        isCategoryAllowed(dept.category, group)
    ).map((dept) => ({
        ...dept,
        items: ALL_ACTIONS.filter((action) => action.category === dept.category),
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
    const [activeDepartment, setActiveDepartment] =
        useState<ActionCategory | null>(null)
    const [activeView, setActiveView] = useState<PortalView | null>(null)
    const [selectedAction, setSelectedAction] = useState<ActionItem | null>(
        null
    )
    const [pressedId, setPressedId] = useState<string | null>(null)
    const [installSheetOpen, setInstallSheetOpen] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [pushStatusMsg, setPushStatusMsg] = useState("")
    const [pushBusy, setPushBusy] = useState(false)

    const signatureGradient = `linear-gradient(135deg, ${redColor} 0%, ${blueColor} 100%)`
    const horizontalGradient = `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`

    const departments = getDepartmentPages(user.permissionGroup)
    const currentDepartment =
        departments.find((d) => d.category === activeDepartment) ?? null

    useEffect(() => {
        setActiveDepartment(null)
        setActiveView(null)
    }, [user.permissionGroup])

    useEffect(() => {
        const standalone =
            window.matchMedia?.("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean })
                .standalone === true
        setIsStandalone(Boolean(standalone))
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

    const getBarColor = (accent: ActionItem["accent"]): string => {
        if (accent === "red") return redColor
        if (accent === "blue") return blueColor
        return blackColor
    }

    const canvasStyle: React.CSSProperties = {
        minHeight: "100dvh",
        backgroundColor: "#F4F6FA",
        backgroundImage: `radial-gradient(circle at 18% 0%, rgba(250, 52, 37, 0.14) 0%, transparent 45%), radial-gradient(circle at 82% 0%, rgba(3, 78, 175, 0.14) 0%, transparent 48%), linear-gradient(180deg, #F7F8FC 0%, #F1F3F8 100%)`,
        color: blackColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }

    // Active sub-views
    if (activeView === "briefings") {
        return (
            <div style={canvasStyle}>
                <TeamBriefingsView
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

    if (activeView === "directory") {
        return (
            <div style={canvasStyle}>
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
            <div style={canvasStyle}>
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
            <div style={canvasStyle}>
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
            <div style={canvasStyle}>
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
            <div style={canvasStyle}>
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
            <div style={canvasStyle}>
                <div
                    style={{
                        maxWidth: "640px",
                        width: "100%",
                        margin: "0 auto",
                        padding: "18px 16px 32px",
                        boxSizing: "border-box",
                    }}
                >
                    <UploadAssetsView
                        defaultCreator={user.name}
                        permissionGroup={user.permissionGroup}
                        singleSection={user.permissionGroup === "creator"}
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
            <div style={canvasStyle}>
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

    const renderActionSheet = () => {
        if (!selectedAction) return null
        const accentColor = getBarColor(selectedAction.accent)
        return (
            <div
                onClick={() => setSelectedAction(null)}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 2, 1, 0.62)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    zIndex: 30,
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "520px",
                        backgroundColor: "#FFFFFF",
                        borderTopLeftRadius: "24px",
                        borderTopRightRadius: "24px",
                        overflow: "hidden",
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            height: "4px",
                            width: "100%",
                            background: horizontalGradient,
                        }}
                    />

                    <div style={{ padding: "20px 22px 28px" }}>
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
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: accentColor,
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
                                    fontWeight: 700,
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
                                letterSpacing: "-0.02em",
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
                                borderRadius: "12px",
                                border: "none",
                                background: horizontalGradient,
                                color: "#FFFFFF",
                                fontSize: "12.5px",
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const portalFooter = (
        <footer
            style={{
                maxWidth: "640px",
                width: "100%",
                margin: "32px auto 0",
                paddingTop: "16px",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: greyColor,
            }}
        >
            risingtalentacademy.co.uk
        </footer>
    )

    // Dedicated Department Page (2-column bento layout matching screenshot)
    if (currentDepartment) {
        const hasOddItem = currentDepartment.items.length % 2 === 1

        return (
            <div
                style={{
                    ...canvasStyle,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "16px 16px 28px",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        maxWidth: "640px",
                        width: "100%",
                        margin: "0 auto",
                    }}
                >
                    {/* Top Navigation Row */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            marginBottom: "14px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveDepartment(null)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "10px",
                                border: "1px solid rgba(0, 2, 1, 0.1)",
                                backgroundColor: "#FFFFFF",
                                color: blackColor,
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 1px 2px rgba(0, 2, 1, 0.04)",
                            }}
                        >
                            <span>←</span>
                            <span>Paddock Pass</span>
                        </button>

                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: greyColor,
                            }}
                        >
                            {user.rtaId}
                        </span>
                    </div>

                    {/* Dark Department Hero Card */}
                    <section
                        style={{
                            position: "relative",
                            borderRadius: "20px",
                            backgroundColor: "#060B14",
                            backgroundImage: `radial-gradient(circle at 22% 0%, rgba(250, 52, 37, 0.34) 0%, transparent 52%), radial-gradient(circle at 78% 0%, rgba(3, 78, 175, 0.36) 0%, transparent 55%)`,
                            color: "#FFFFFF",
                            overflow: "hidden",
                            marginBottom: "14px",
                            padding: "18px 20px 20px",
                            boxShadow: "0 10px 24px rgba(0, 2, 1, 0.12)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                marginBottom: "10px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "rgba(255, 255, 255, 0.72)",
                                }}
                            >
                                {currentDepartment.scopeLabel}
                            </span>

                            <span
                                style={{
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    color: "rgba(255, 255, 255, 0.78)",
                                }}
                            >
                                {currentDepartment.items.length} sections
                            </span>
                        </div>

                        <h1
                            style={{
                                margin: "0 0 6px",
                                fontSize: "24px",
                                fontWeight: 800,
                                letterSpacing: "-0.025em",
                                lineHeight: 1.15,
                                color: "#FFFFFF",
                            }}
                        >
                            {currentDepartment.title}
                        </h1>

                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                lineHeight: 1.4,
                                color: "rgba(255, 255, 255, 0.72)",
                            }}
                        >
                            {currentDepartment.description}
                        </p>
                    </section>

                    {/* 2-Column Section Tiles */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: "12px",
                        }}
                    >
                        {currentDepartment.items.map((action, idx) => {
                            const isPressed = pressedId === action.id
                            const isDarkTile = Boolean(action.featuredDark)
                            const isLastOdd =
                                hasOddItem &&
                                idx === currentDepartment.items.length - 1
                            const barColor = getBarColor(action.accent)
                            const actionLabel = action.targetView
                                ? "OPEN →"
                                : "VIEW →"

                            return (
                                <button
                                    key={action.id}
                                    type="button"
                                    onPointerDown={() => setPressedId(action.id)}
                                    onPointerUp={() => setPressedId(null)}
                                    onPointerLeave={() => setPressedId(null)}
                                    onClick={() => handleActionClick(action)}
                                    style={{
                                        gridColumn: isLastOdd
                                            ? "1 / -1"
                                            : "auto",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "16px 17px 18px",
                                        borderRadius: "18px",
                                        border: isDarkTile
                                            ? "1px solid rgba(255, 255, 255, 0.08)"
                                            : "1px solid rgba(0, 2, 1, 0.07)",
                                        backgroundColor: isDarkTile
                                            ? "#0A0F1A"
                                            : "#FFFFFF",
                                        color: isDarkTile
                                            ? "#FFFFFF"
                                            : blackColor,
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        minHeight: isLastOdd ? "104px" : "126px",
                                        boxShadow: isDarkTile
                                            ? "0 8px 20px rgba(0, 2, 1, 0.14)"
                                            : "0 2px 8px rgba(0, 2, 1, 0.04)",
                                        transform: isPressed
                                            ? "scale(0.985)"
                                            : "scale(1)",
                                        transition: "transform 110ms ease",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "8px",
                                            marginBottom: "18px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "24px",
                                                height: "4px",
                                                borderRadius: "999px",
                                                backgroundColor: barColor,
                                                flexShrink: 0,
                                            }}
                                        />

                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                color: isDarkTile
                                                    ? "rgba(255, 255, 255, 0.85)"
                                                    : action.accent === "blue"
                                                      ? blueColor
                                                      : blackColor,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {actionLabel}
                                        </span>
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                fontSize: "15.5px",
                                                fontWeight: 800,
                                                letterSpacing: "-0.015em",
                                                lineHeight: 1.25,
                                                color: isDarkTile
                                                    ? "#FFFFFF"
                                                    : blackColor,
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {action.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                lineHeight: 1.35,
                                                color: isDarkTile
                                                    ? "rgba(255, 255, 255, 0.65)"
                                                    : greyColor,
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

                {portalFooter}
                {selectedAction && renderActionSheet()}
            </div>
        )
    }

    // Main Dashboard Screen
    return (
        <div
            style={{
                ...canvasStyle,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "16px 16px 28px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: "640px",
                    width: "100%",
                    margin: "0 auto",
                }}
            >
                {/* Header */}
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "4px 2px 14px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "11px",
                            minWidth: 0,
                        }}
                    >
                        {logoUrl && (
                            <div
                                style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "12px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "6px",
                                    boxSizing: "border-box",
                                    flexShrink: 0,
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
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: "12.5px",
                                    fontWeight: 900,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: blackColor,
                                }}
                            >
                                Staff Portal
                            </div>
                            <div
                                style={{
                                    fontSize: "11.5px",
                                    fontWeight: 600,
                                    color: greyColor,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                Rising Talent Academy
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {!isStandalone && (
                            <button
                                type="button"
                                onClick={() => setInstallSheetOpen(true)}
                                style={{
                                    padding: "8px 11px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(0, 2, 1, 0.1)",
                                    backgroundColor: "#FFFFFF",
                                    color: blueColor,
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.04em",
                                    cursor: "pointer",
                                }}
                            >
                                App
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onSignOut}
                            style={{
                                padding: "8px 13px",
                                borderRadius: "10px",
                                border: "1px solid rgba(0, 2, 1, 0.12)",
                                backgroundColor: "#FFFFFF",
                                color: blackColor,
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Paddock Pass */}
                <section
                    style={{
                        position: "relative",
                        borderRadius: "22px",
                        backgroundColor: blackColor,
                        color: "#FFFFFF",
                        overflow: "hidden",
                        marginBottom: "18px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: "5px",
                            background: `linear-gradient(180deg, ${redColor} 0%, ${blueColor} 100%)`,
                        }}
                    />

                    <div
                        style={{
                            height: "3px",
                            width: "100%",
                            background: horizontalGradient,
                        }}
                    />

                    <div style={{ padding: "18px 20px 20px 24px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                marginBottom: "12px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "10.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.22em",
                                    textTransform: "uppercase",
                                    background: horizontalGradient,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
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
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    color: "rgba(255, 255, 255, 0.85)",
                                }}
                            >
                                <span
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "999px",
                                        background: signatureGradient,
                                    }}
                                />
                                Active
                            </span>
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                            <div
                                style={{
                                    fontSize: "23px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.025em",
                                    lineHeight: 1.15,
                                    color: "#FFFFFF",
                                    marginBottom: "4px",
                                }}
                            >
                                {user.name}
                            </div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "rgba(255, 255, 255, 0.7)",
                                }}
                            >
                                {user.role}
                            </div>
                        </div>

                        <div
                            style={{
                                paddingTop: "12px",
                                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
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
                                        padding: "4px 10px",
                                        borderRadius: "7px",
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.08)",
                                        border:
                                            "1px solid rgba(255, 255, 255, 0.14)",
                                        fontSize: "11px",
                                        fontWeight: 800,
                                        letterSpacing: "0.12em",
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
                                            "rgba(255, 255, 255, 0.04)",
                                        border:
                                            "1px solid rgba(255, 255, 255, 0.1)",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "rgba(255, 255, 255, 0.8)",
                                    }}
                                >
                                    {GROUP_LABELS[user.permissionGroup]}
                                </span>
                            </div>

                            {user.permissionGroup === "leadership" && (
                                <button
                                    type="button"
                                    disabled={pushBusy}
                                    onClick={handleEnablePush}
                                    style={{
                                        padding: "5px 10px",
                                        borderRadius: "7px",
                                        border:
                                            "1px solid rgba(255, 255, 255, 0.18)",
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.06)",
                                        color: "#FFFFFF",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        cursor: pushBusy
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                >
                                    {pushBusy ? "Enabling..." : "Push Alerts"}
                                </button>
                            )}
                        </div>

                        {pushStatusMsg && (
                            <div
                                style={{
                                    marginTop: "10px",
                                    fontSize: "11.5px",
                                    color: "rgba(255, 255, 255, 0.8)",
                                }}
                            >
                                {pushStatusMsg}
                            </div>
                        )}
                    </div>
                </section>

                {/* Department Label */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 4px 10px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: greyColor,
                        }}
                    >
                        Departments
                    </span>
                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: greyColor,
                        }}
                    >
                        {departments.length} available
                    </span>
                </div>

                {/* Department Cards */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {departments.map((dept) => {
                        const isPressed = pressedId === dept.category

                        return (
                            <button
                                key={dept.category}
                                type="button"
                                onPointerDown={() => setPressedId(dept.category)}
                                onPointerUp={() => setPressedId(null)}
                                onPointerLeave={() => setPressedId(null)}
                                onClick={() =>
                                    setActiveDepartment(dept.category)
                                }
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: 0,
                                    borderRadius: "20px",
                                    border: "1px solid rgba(0, 2, 1, 0.1)",
                                    backgroundColor: "#FFFFFF",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    transform: isPressed
                                        ? "scale(0.988)"
                                        : "scale(1)",
                                    transition: "transform 110ms ease",
                                }}
                            >
                                <div
                                    style={{
                                        height: "3px",
                                        width: "100%",
                                        background: horizontalGradient,
                                    }}
                                />

                                <div style={{ padding: "17px 18px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                gap: "10px",
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: 900,
                                                    letterSpacing: "0.08em",
                                                    background:
                                                        horizontalGradient,
                                                    WebkitBackgroundClip:
                                                        "text",
                                                    WebkitTextFillColor:
                                                        "transparent",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {dept.code}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "17.5px",
                                                    fontWeight: 800,
                                                    letterSpacing: "-0.02em",
                                                    color: blackColor,
                                                }}
                                            >
                                                {dept.title}
                                            </span>
                                        </div>

                                        <span
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: 800,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                color: blackColor,
                                                flexShrink: 0,
                                            }}
                                        >
                                            Open →
                                        </span>
                                    </div>

                                    <p
                                        style={{
                                            margin: "0 0 12px",
                                            fontSize: "13px",
                                            lineHeight: 1.4,
                                            color: greyColor,
                                        }}
                                    >
                                        {dept.description}
                                    </p>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            paddingTop: "10px",
                                            borderTop:
                                                "1px solid rgba(0, 2, 1, 0.06)",
                                            fontSize: "11.5px",
                                            fontWeight: 700,
                                            color: blackColor,
                                        }}
                                    >
                                        <span>{dept.subtitle}</span>
                                        <span style={{ color: greyColor }}>
                                            {dept.items.length} sections
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {portalFooter}

            {/* Install Sheet */}
            {installSheetOpen && (
                <div
                    onClick={() => setInstallSheetOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 2, 1, 0.62)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        zIndex: 30,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "520px",
                            backgroundColor: "#FFFFFF",
                            borderTopLeftRadius: "24px",
                            borderTopRightRadius: "24px",
                            overflow: "hidden",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                height: "4px",
                                width: "100%",
                                background: horizontalGradient,
                            }}
                        />

                        <div style={{ padding: "20px 22px 28px" }}>
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
                                        fontWeight: 700,
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
                                        Open this portal in{" "}
                                        <strong>Safari</strong>.
                                    </li>
                                    <li>
                                        Tap the <strong>Share</strong> icon at
                                        the bottom of the screen.
                                    </li>
                                    <li>
                                        Scroll down and tap{" "}
                                        <strong>Add to Home Screen</strong>,
                                        then tap <strong>Add</strong>.
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
                                        Open this portal in{" "}
                                        <strong>Chrome</strong>.
                                    </li>
                                    <li>
                                        Tap the{" "}
                                        <strong>three-dot menu (⋮)</strong> in
                                        the top-right corner.
                                    </li>
                                    <li>
                                        Tap <strong>Add to Home screen</strong>{" "}
                                        (or <strong>Install app</strong>) and
                                        confirm.
                                    </li>
                                </ol>
                            </div>

                            <button
                                type="button"
                                onClick={() => setInstallSheetOpen(false)}
                                style={{
                                    width: "100%",
                                    padding: "13px 16px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: horizontalGradient,
                                    color: "#FFFFFF",
                                    fontSize: "12.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                }}
                            >
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedAction && renderActionSheet()}
        </div>
    )
}
