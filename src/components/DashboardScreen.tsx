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

interface DepartmentPage {
    category: ActionCategory
    title: string
    badge: string
    description: string
    accentType: "brand" | "journalist" | "creator" | "outreach" | "leadership"
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

const DEPARTMENT_META: {
    category: ActionCategory
    title: string
    badge: string
    description: string
    accentType: DepartmentPage["accentType"]
}[] = [
    {
        category: "core",
        title: "General",
        badge: "All Staff",
        description: "Briefings, handoffs, brand kit, roster & profile",
        accentType: "brand",
    },
    {
        category: "journalist",
        title: "Journalism",
        badge: "Editorial",
        description: "Article queue, copy submission & press notes",
        accentType: "journalist",
    },
    {
        category: "creator",
        title: "Content Creation",
        badge: "Social & Video",
        description: "Content calendar, asset uploads & hooks",
        accentType: "creator",
    },
    {
        category: "outreach",
        title: "Outreach & Comms",
        badge: "Partnerships",
        description: "Podcast tracker, outreach scripts & handoffs",
        accentType: "outreach",
    },
    {
        category: "leadership",
        title: "Leadership & Admin",
        badge: "Restricted",
        description: "Approvals, RTA IDs, HR/legal vault & systems",
        accentType: "leadership",
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

    const getAccentColor = (accent: ActionItem["accent"]) => {
        if (accent === "red") return redColor
        if (accent === "blue") return blueColor
        return blackColor
    }

    const getDepartmentStripe = (accentType: DepartmentPage["accentType"]) => {
        if (accentType === "leadership") {
            return `linear-gradient(90deg, ${redColor} 0%, ${blackColor} 100%)`
        }
        if (accentType === "journalist") {
            return `linear-gradient(90deg, ${redColor} 0%, #9E1B12 100%)`
        }
        if (accentType === "creator") {
            return `linear-gradient(90deg, ${blueColor} 0%, #022C66 100%)`
        }
        if (accentType === "outreach") {
            return `linear-gradient(90deg, ${blueColor} 0%, ${redColor} 100%)`
        }
        return `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`
    }

    const pageBackdrop: React.CSSProperties = {
        minHeight: "100dvh",
        background: `radial-gradient(circle at 88% 4%, rgba(3, 78, 175, 0.13), transparent 40%), radial-gradient(circle at 12% 2%, rgba(250, 52, 37, 0.12), transparent 36%), #F3F5F9`,
        color: blackColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }

    // Active sub-views
    if (activeView === "directory") {
        return (
            <div style={pageBackdrop}>
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
            <div style={pageBackdrop}>
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
            <div style={pageBackdrop}>
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
            <div style={pageBackdrop}>
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
            <div style={pageBackdrop}>
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
            <div style={pageBackdrop}>
                <div
                    style={{
                        maxWidth: "680px",
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
            <div style={pageBackdrop}>
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

    // Dedicated Department Page (when a department card is opened)
    if (currentDepartment) {
        const isAdminDept = currentDepartment.category === "leadership"
        const hasOddCount = currentDepartment.items.length % 2 === 1

        return (
            <div
                style={{
                    ...pageBackdrop,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "16px 16px 30px",
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
                    {/* Sub-page Top Bar */}
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
                                padding: "9px 14px",
                                borderRadius: "11px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                backgroundColor: "#FFFFFF",
                                color: blackColor,
                                fontSize: "12.5px",
                                fontWeight: 800,
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0, 2, 1, 0.05)",
                            }}
                        >
                            <span>← Paddock Pass</span>
                        </button>

                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: greyColor,
                            }}
                        >
                            {user.rtaId}
                        </span>
                    </div>

                    {/* Department Header Banner */}
                    <section
                        style={{
                            borderRadius: "20px",
                            background: `linear-gradient(140deg, ${blackColor} 0%, #0D1424 60%, #071A38 100%)`,
                            color: "#FFFFFF",
                            overflow: "hidden",
                            marginBottom: "16px",
                            boxShadow: "0 16px 32px rgba(0, 2, 1, 0.18)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                    >
                        <div
                            style={{
                                height: "4px",
                                width: "100%",
                                background: getDepartmentStripe(
                                    currentDepartment.accentType
                                ),
                            }}
                        />

                        <div style={{ padding: "18px 20px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                    marginBottom: "6px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        color: isAdminDept
                                            ? "#FF8F86"
                                            : "#8BB9FF",
                                    }}
                                >
                                    {currentDepartment.badge}
                                </span>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "rgba(255, 255, 255, 0.68)",
                                    }}
                                >
                                    {currentDepartment.items.length} sections
                                </span>
                            </div>

                            <h1
                                style={{
                                    margin: "0 0 5px",
                                    fontSize: "21px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    color: "#FFFFFF",
                                }}
                            >
                                {currentDepartment.title}
                            </h1>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    lineHeight: 1.45,
                                    color: "rgba(255, 255, 255, 0.72)",
                                }}
                            >
                                {currentDepartment.description}
                            </p>
                        </div>
                    </section>

                    {/* All Sections Inside This Department */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: "12px",
                        }}
                    >
                        {currentDepartment.items.map((action, index) => {
                            const accentHex = getAccentColor(action.accent)
                            const isPressed = pressedId === action.id
                            const isLastOdd =
                                hasOddCount &&
                                index === currentDepartment.items.length - 1
                            const isFeatured = Boolean(action.featured)

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
                                            : undefined,
                                        textAlign: "left",
                                        padding: "16px 15px",
                                        borderRadius: "17px",
                                        border: isFeatured
                                            ? `1px solid ${
                                                  isAdminDept
                                                      ? "rgba(250, 52, 37, 0.5)"
                                                      : "rgba(255, 255, 255, 0.12)"
                                              }`
                                            : "1px solid rgba(0, 2, 1, 0.09)",
                                        background: isFeatured
                                            ? `linear-gradient(140deg, ${blackColor} 0%, #131B2E 100%)`
                                            : "#FFFFFF",
                                        color: isFeatured
                                            ? "#FFFFFF"
                                            : blackColor,
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        minHeight: isLastOdd ? "94px" : "116px",
                                        boxSizing: "border-box",
                                        boxShadow: isFeatured
                                            ? "0 12px 24px rgba(0, 2, 1, 0.16)"
                                            : "0 8px 20px rgba(0, 2, 1, 0.04)",
                                        transform: isPressed
                                            ? "scale(0.985)"
                                            : "scale(1)",
                                        transition: "transform 120ms ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "8px",
                                            marginBottom: "14px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "30px",
                                                height: "4px",
                                                borderRadius: "999px",
                                                backgroundColor:
                                                    isFeatured &&
                                                    action.accent === "black"
                                                        ? "#FFFFFF"
                                                        : accentHex,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                color: isFeatured
                                                    ? "rgba(255, 255, 255, 0.78)"
                                                    : isAdminDept
                                                      ? redColor
                                                      : greyColor,
                                            }}
                                        >
                                            {action.targetView
                                                ? "Open →"
                                                : "View →"}
                                        </span>
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                fontSize: "14.5px",
                                                fontWeight: 700,
                                                letterSpacing: "-0.01em",
                                                lineHeight: 1.25,
                                                marginBottom: "4px",
                                                color: isFeatured
                                                    ? "#FFFFFF"
                                                    : blackColor,
                                            }}
                                        >
                                            {action.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                lineHeight: 1.35,
                                                color: isFeatured
                                                    ? "rgba(255, 255, 255, 0.72)"
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
                        color: greyColor,
                    }}
                >
                    risingtalentacademy.co.uk
                </footer>

                {selectedAction && renderActionModal()}
            </div>
        )
    }

    function renderActionModal() {
        if (!selectedAction) return null
        return (
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
                                color: getAccentColor(selectedAction.accent),
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
        )
    }

    // Main Dashboard Screen (Paddock Pass + Department Cards)
    return (
        <div
            style={{
                ...pageBackdrop,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "16px 16px 30px",
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
                {/* Top Header */}
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
                            gap: "12px",
                            minWidth: 0,
                        }}
                    >
                        {logoUrl && (
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "13px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.09)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "6px",
                                    boxSizing: "border-box",
                                    boxShadow: "0 6px 16px rgba(0, 2, 1, 0.06)",
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
                                    fontSize: "13px",
                                    fontWeight: 900,
                                    letterSpacing: "0.15em",
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
                                    border: "1px solid rgba(3, 78, 175, 0.22)",
                                    backgroundColor: "rgba(3, 78, 175, 0.07)",
                                    color: blueColor,
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.03em",
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
                    </div>
                </header>

                {/* Paddock Pass Hero */}
                <section
                    style={{
                        borderRadius: "22px",
                        background: `linear-gradient(140deg, ${blackColor} 0%, #0D1322 58%, #071A38 100%)`,
                        color: "#FFFFFF",
                        overflow: "hidden",
                        marginBottom: "18px",
                        boxShadow: "0 18px 36px rgba(0, 2, 1, 0.2)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                >
                    <div
                        style={{
                            height: "4px",
                            width: "100%",
                            background: `linear-gradient(90deg, ${redColor} 0%, ${redColor} 45%, ${blueColor} 100%)`,
                        }}
                    />

                    <div style={{ padding: "19px 20px 20px" }}>
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
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: "rgba(255, 255, 255, 0.62)",
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
                                    color: "#FFFFFF",
                                }}
                            >
                                <span
                                    style={{
                                        width: "7px",
                                        height: "7px",
                                        borderRadius: "999px",
                                        backgroundColor: redColor,
                                        boxShadow: `0 0 10px ${redColor}`,
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
                                marginBottom: "15px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "22px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    color: "#FFFFFF",
                                }}
                            >
                                {user.name}
                            </span>
                            <span
                                style={{
                                    color: "rgba(255, 255, 255, 0.28)",
                                    fontSize: "15px",
                                }}
                            >
                                |
                            </span>
                            <span
                                style={{
                                    fontSize: "13.5px",
                                    fontWeight: 700,
                                    color: "#8BB9FF",
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
                                        fontSize: "11.5px",
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
                                                ? "1px solid rgba(250, 52, 37, 0.48)"
                                                : "1px solid rgba(139, 185, 255, 0.35)",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                        color:
                                            user.permissionGroup ===
                                            "leadership"
                                                ? "#FF8F86"
                                                : "#C2DAFF",
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
                                        borderRadius: "8px",
                                        border:
                                            "1px solid rgba(255, 255, 255, 0.2)",
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.08)",
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
                                    color: "#C2DAFF",
                                }}
                            >
                                {pushStatusMsg}
                            </div>
                        )}
                    </div>
                </section>

                {/* Department Cards (Each opens its own full page) */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {departments.map((dept) => {
                        const isPressed = pressedId === dept.category
                        const isAdmin = dept.category === "leadership"

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
                                    border: isAdmin
                                        ? "1px solid rgba(250, 52, 37, 0.28)"
                                        : "1px solid rgba(0, 2, 1, 0.09)",
                                    backgroundColor: "#FFFFFF",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    boxShadow: "0 10px 24px rgba(0, 2, 1, 0.05)",
                                    transform: isPressed
                                        ? "scale(0.988)"
                                        : "scale(1)",
                                    transition: "transform 120ms ease",
                                }}
                            >
                                <div
                                    style={{
                                        height: "3.5px",
                                        width: "100%",
                                        background: getDepartmentStripe(
                                            dept.accentType
                                        ),
                                    }}
                                />

                                <div style={{ padding: "17px 18px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "10px",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "2px",
                                                    transform: "rotate(45deg)",
                                                    backgroundColor: isAdmin
                                                        ? redColor
                                                        : blueColor,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: "17px",
                                                    fontWeight: 800,
                                                    letterSpacing: "-0.015em",
                                                    color: isAdmin
                                                        ? redColor
                                                        : blackColor,
                                                }}
                                            >
                                                {dept.title}
                                            </span>
                                        </div>

                                        <span
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: 800,
                                                letterSpacing: "0.06em",
                                                textTransform: "uppercase",
                                                color: isAdmin
                                                    ? redColor
                                                    : blueColor,
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
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: "4px 9px",
                                                borderRadius: "7px",
                                                backgroundColor: "#F3F5F9",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: blackColor,
                                            }}
                                        >
                                            {dept.items.length} sections
                                        </span>

                                        {dept.items.slice(0, 3).map((item) => (
                                            <span
                                                key={item.id}
                                                style={{
                                                    padding: "4px 9px",
                                                    borderRadius: "7px",
                                                    backgroundColor:
                                                        "rgba(0, 2, 1, 0.04)",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    color: greyColor,
                                                }}
                                            >
                                                {item.title}
                                            </span>
                                        ))}

                                        {dept.items.length > 3 && (
                                            <span
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "7px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: greyColor,
                                                }}
                                            >
                                                +{dept.items.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
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

            {/* Install Instructions Sheet */}
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

            {selectedAction && renderActionModal()}
        </div>
    )
}
