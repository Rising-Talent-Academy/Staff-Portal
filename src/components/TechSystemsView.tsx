import React, { useEffect, useState } from "react"
import type { StaffProfile } from "./DashboardScreen"

interface TechSystemsViewProps {
    user: StaffProfile
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

type SystemCategory = "Website" | "Database & Auth" | "Social & Media" | "Domains & Ops"
type SystemStatus = "Healthy" | "Review Due" | "Needs Attention"
type IncidentSeverity = "Info" | "Warning" | "Outage"

interface SystemItem {
    id: string
    name: string
    category: SystemCategory
    url: string
    owner: string
    status: SystemStatus
    notes: string
    lastChecked: string
}

interface ChangeLogItem {
    id: string
    title: string
    system: string
    severity: IncidentSeverity
    author: string
    timestamp: string
    details: string
    resolved: boolean
}

const SYSTEMS_STORAGE_KEY = "rta_tech_systems_v1"
const LOGS_STORAGE_KEY = "rta_tech_changelog_v1"

const DEFAULT_SYSTEMS: SystemItem[] = [
    {
        id: "sys-site",
        name: "Public Website (risingtalentacademy.co.uk)",
        category: "Website",
        url: "https://risingtalentacademy.co.uk",
        owner: "Leadership & Tech",
        status: "Healthy",
        notes: "Main public site, editorial articles feed & brand front.",
        lastChecked: "Today",
    },
    {
        id: "sys-portal",
        name: "RTA Staff Portal (GitHub Pages)",
        category: "Website",
        url: "https://rising-talent-academy.github.io",
        owner: "Leadership & Tech",
        status: "Healthy",
        notes: "React + Vite PWA deployed via GitHub Actions.",
        lastChecked: "Today",
    },
    {
        id: "sys-supabase",
        name: "Supabase Project (Auth, DB & Edge Functions)",
        category: "Database & Auth",
        url: "https://supabase.com/dashboard",
        owner: "Leadership & Tech",
        status: "Healthy",
        notes: "Hosts profiles, articles, outreach_leads, department_handoffs & create-staff-user.",
        lastChecked: "Today",
    },
    {
        id: "sys-domain",
        name: "Domain & DNS (risingtalentacademy.co.uk)",
        category: "Domains & Ops",
        url: "https://risingtalentacademy.co.uk",
        owner: "Leadership & Tech",
        status: "Healthy",
        notes: "Verify SSL certificate and DNS records before annual renewal.",
        lastChecked: "This week",
    },
    {
        id: "sys-socials",
        name: "Shared Social & Podcast Channels",
        category: "Social & Media",
        url: "",
        owner: "Outreach & Content",
        status: "Healthy",
        notes: "Instagram, TikTok, YouTube & Rising Talent Talkers publishing access.",
        lastChecked: "This week",
    },
]

const DEFAULT_LOGS: ChangeLogItem[] = [
    {
        id: "log-1",
        title: "Outreach & Comms Workspace Deployed",
        system: "RTA Staff Portal",
        severity: "Info",
        author: "Admin",
        timestamp: "Recent",
        details: "Added dedicated Outreach Tracker, Templates & Bio, and Dept Handoffs views.",
        resolved: true,
    },
]

export function TechSystemsView({
    user,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: TechSystemsViewProps) {
    const [systems, setSystems] = useState<SystemItem[]>(() => {
        try {
            const raw = localStorage.getItem(SYSTEMS_STORAGE_KEY)
            return raw ? JSON.parse(raw) : DEFAULT_SYSTEMS
        } catch {
            return DEFAULT_SYSTEMS
        }
    })

    const [logs, setLogs] = useState<ChangeLogItem[]>(() => {
        try {
            const raw = localStorage.getItem(LOGS_STORAGE_KEY)
            return raw ? JSON.parse(raw) : DEFAULT_LOGS
        } catch {
            return DEFAULT_LOGS
        }
    })

    const [categoryFilter, setCategoryFilter] = useState<string>("All")
    const [showAddSystem, setShowAddSystem] = useState(false)
    const [newSysName, setNewSysName] = useState("")
    const [newSysCategory, setNewSysCategory] = useState<SystemCategory>("Website")
    const [newSysUrl, setNewSysUrl] = useState("")
    const [newSysOwner, setNewSysOwner] = useState("Leadership & Tech")
    const [newSysNotes, setNewSysNotes] = useState("")

    const [logTitle, setLogTitle] = useState("")
    const [logSystem, setLogSystem] = useState("RTA Staff Portal")
    const [logSeverity, setLogSeverity] = useState<IncidentSeverity>("Info")
    const [logDetails, setLogDetails] = useState("")

    useEffect(() => {
        try {
            localStorage.setItem(SYSTEMS_STORAGE_KEY, JSON.stringify(systems))
        } catch {
            // ignore storage quota issues
        }
    }, [systems])

    useEffect(() => {
        try {
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))
        } catch {
            // ignore storage quota issues
        }
    }, [logs])

    const cycleSystemStatus = (id: string) => {
        const order: SystemStatus[] = ["Healthy", "Review Due", "Needs Attention"]
        setSystems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item
                const nextStatus =
                    order[(order.indexOf(item.status) + 1) % order.length]
                return {
                    ...item,
                    status: nextStatus,
                    lastChecked: "Just now",
                }
            })
        )
    }

    const handleAddSystem = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSysName.trim()) return

        const item: SystemItem = {
            id: `sys-${Date.now()}`,
            name: newSysName.trim(),
            category: newSysCategory,
            url: newSysUrl.trim(),
            owner: newSysOwner.trim() || "Leadership & Tech",
            status: "Healthy",
            notes: newSysNotes.trim() || "Tracked internal system.",
            lastChecked: "Just now",
        }

        setSystems((prev) => [item, ...prev])
        setNewSysName("")
        setNewSysUrl("")
        setNewSysNotes("")
        setShowAddSystem(false)
    }

    const handleDeleteSystem = (id: string) => {
        setSystems((prev) => prev.filter((s) => s.id !== id))
    }

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault()
        if (!logTitle.trim()) return

        const entry: ChangeLogItem = {
            id: `log-${Date.now()}`,
            title: logTitle.trim(),
            system: logSystem.trim() || "General",
            severity: logSeverity,
            author: user.rtaId || user.name,
            timestamp: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }),
            details: logDetails.trim(),
            resolved: logSeverity === "Info",
        }

        setLogs((prev) => [entry, ...prev])
        setLogTitle("")
        setLogDetails("")
    }

    const toggleLogResolved = (id: string) => {
        setLogs((prev) =>
            prev.map((l) => (l.id === id ? { ...l, resolved: !l.resolved } : l))
        )
    }

    const getStatusBadgeStyle = (status: SystemStatus): React.CSSProperties => {
        if (status === "Healthy") {
            return {
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#047857",
                border: "1px solid rgba(16, 185, 129, 0.28)",
            }
        }
        if (status === "Review Due") {
            return {
                backgroundColor: "rgba(3, 78, 175, 0.1)",
                color: blueColor,
                border: "1px solid rgba(3, 78, 175, 0.25)",
            }
        }
        return {
            backgroundColor: "rgba(250, 52, 37, 0.12)",
            color: redColor,
            border: "1px solid rgba(250, 52, 37, 0.3)",
        }
    }

    const getSeverityStyle = (severity: IncidentSeverity): React.CSSProperties => {
        if (severity === "Outage") {
            return {
                backgroundColor: "rgba(250, 52, 37, 0.12)",
                color: redColor,
            }
        }
        if (severity === "Warning") {
            return {
                backgroundColor: "rgba(245, 158, 11, 0.14)",
                color: "#B45309",
            }
        }
        return {
            backgroundColor: "rgba(3, 78, 175, 0.1)",
            color: blueColor,
        }
    }

    const filteredSystems =
        categoryFilter === "All"
            ? systems
            : systems.filter((s) => s.category === categoryFilter)

    const healthyCount = systems.filter((s) => s.status === "Healthy").length
    const attentionCount = systems.filter((s) => s.status !== "Healthy").length

    return (
        <div
            style={{
                maxWidth: "680px",
                width: "100%",
                margin: "0 auto",
                padding: "18px 18px 36px",
                boxSizing: "border-box",
            }}
        >
            {/* Top Bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "18px",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: redColor,
                            marginBottom: "3px",
                        }}
                    >
                        Leadership & Admin
                    </div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: blackColor,
                        }}
                    >
                        Tech & Systems Control
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        padding: "9px 14px",
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
                    ← Back to Portal
                </button>
            </div>

            {/* Summary Banner */}
            <div
                style={{
                    borderRadius: "18px",
                    background: `linear-gradient(135deg, ${blackColor} 0%, #101828 100%)`,
                    color: "#FFFFFF",
                    padding: "18px 20px",
                    marginBottom: "18px",
                    boxShadow: "0 14px 28px rgba(0, 2, 1, 0.14)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "14px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.6)",
                                marginBottom: "4px",
                            }}
                        >
                            Infrastructure Overview
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 700 }}>
                            {healthyCount} of {systems.length} systems operational
                            {attentionCount > 0 ? ` • ${attentionCount} flagged` : ""}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <a
                            href="https://risingtalentacademy.co.uk"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: "7px 11px",
                                borderRadius: "9px",
                                backgroundColor: "rgba(255,255,255,0.12)",
                                border: "1px solid rgba(255,255,255,0.18)",
                                color: "#FFFFFF",
                                fontSize: "11px",
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            Live Site ↗
                        </a>
                        <a
                            href="https://supabase.com/dashboard"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: "7px 11px",
                                borderRadius: "9px",
                                backgroundColor: blueColor,
                                color: "#FFFFFF",
                                fontSize: "11px",
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            Supabase ↗
                        </a>
                        <a
                            href="https://github.com/Rising-Talent-Academy/Staff-Portal/actions"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: "7px 11px",
                                borderRadius: "9px",
                                backgroundColor: redColor,
                                color: "#FFFFFF",
                                fontSize: "11px",
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            Deployments ↗
                        </a>
                    </div>
                </div>

                <div
                    style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.68)",
                        lineHeight: 1.45,
                    }}
                >
                    Security reminder: Store system owners, URLs, and status notes here—keep API keys and passwords inside Supabase Secrets or your password manager.
                </div>
            </div>

            {/* Systems Registry */}
            <section
                style={{
                    borderRadius: "18px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0, 2, 1, 0.08)",
                    padding: "18px",
                    marginBottom: "18px",
                    boxShadow: "0 8px 22px rgba(0, 2, 1, 0.04)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "16px",
                                fontWeight: 800,
                                color: blackColor,
                            }}
                        >
                            Systems & Access Registry
                        </h2>
                        <div style={{ fontSize: "11px", color: greyColor }}>
                            Tap any status pill to cycle Healthy → Review Due → Needs Attention
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddSystem((v) => !v)}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "9px",
                            border: "none",
                            backgroundColor: blackColor,
                            color: "#FFFFFF",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        {showAddSystem ? "Cancel" : "+ Add System"}
                    </button>
                </div>

                {/* Add System Form */}
                {showAddSystem && (
                    <form
                        onSubmit={handleAddSystem}
                        style={{
                            padding: "14px",
                            borderRadius: "14px",
                            backgroundColor: "#F9FAFC",
                            border: "1px solid rgba(0, 2, 1, 0.09)",
                            marginBottom: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: "10px",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="System name (e.g. Podcast RSS Host)"
                                value={newSysName}
                                onChange={(e) => setNewSysName(e.target.value)}
                                required
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                }}
                            />
                            <select
                                value={newSysCategory}
                                onChange={(e) =>
                                    setNewSysCategory(e.target.value as SystemCategory)
                                }
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                    backgroundColor: "#FFFFFF",
                                }}
                            >
                                <option value="Website">Website</option>
                                <option value="Database & Auth">Database & Auth</option>
                                <option value="Social & Media">Social & Media</option>
                                <option value="Domains & Ops">Domains & Ops</option>
                            </select>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: "10px",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="URL (optional)"
                                value={newSysUrl}
                                onChange={(e) => setNewSysUrl(e.target.value)}
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Owner / Team"
                                value={newSysOwner}
                                onChange={(e) => setNewSysOwner(e.target.value)}
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                }}
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Access / maintenance notes (no passwords)"
                            value={newSysNotes}
                            onChange={(e) => setNewSysNotes(e.target.value)}
                            style={{
                                padding: "9px 11px",
                                borderRadius: "9px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                fontSize: "12px",
                            }}
                        />

                        <button
                            type="submit"
                            style={{
                                padding: "10px 14px",
                                borderRadius: "9px",
                                border: "none",
                                backgroundColor: blueColor,
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Save System Entry
                        </button>
                    </form>
                )}

                {/* Category Filter Pills */}
                <div
                    style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom: "14px",
                    }}
                >
                    {[
                        "All",
                        "Website",
                        "Database & Auth",
                        "Social & Media",
                        "Domains & Ops",
                    ].map((cat) => {
                        const active = categoryFilter === cat
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategoryFilter(cat)}
                                style={{
                                    padding: "6px 11px",
                                    borderRadius: "999px",
                                    border: active
                                        ? `1px solid ${blueColor}`
                                        : "1px solid rgba(0, 2, 1, 0.1)",
                                    backgroundColor: active ? blueColor : "#F9FAFC",
                                    color: active ? "#FFFFFF" : blackColor,
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                {cat}
                            </button>
                        )
                    })}
                </div>

                {/* System Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {filteredSystems.map((sys) => (
                        <div
                            key={sys.id}
                            style={{
                                padding: "14px",
                                borderRadius: "14px",
                                backgroundColor: "#F9FAFC",
                                border: "1px solid rgba(0, 2, 1, 0.08)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: "10px",
                                    marginBottom: "6px",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            color: blackColor,
                                            marginBottom: "2px",
                                        }}
                                    >
                                        {sys.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: greyColor,
                                        }}
                                    >
                                        {sys.category} • Owner: {sys.owner} • Checked:{" "}
                                        {sys.lastChecked}
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
                                        onClick={() => cycleSystemStatus(sys.id)}
                                        style={{
                                            padding: "4px 9px",
                                            borderRadius: "999px",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            letterSpacing: "0.04em",
                                            cursor: "pointer",
                                            ...getStatusBadgeStyle(sys.status),
                                        }}
                                    >
                                        {sys.status}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Remove system"
                                        onClick={() => handleDeleteSystem(sys.id)}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            color: greyColor,
                                            fontSize: "15px",
                                            cursor: "pointer",
                                            padding: "2px 4px",
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    fontSize: "12px",
                                    color: blackColor,
                                    lineHeight: 1.4,
                                    marginBottom: sys.url ? "8px" : 0,
                                }}
                            >
                                {sys.notes}
                            </div>

                            {sys.url && (
                                <a
                                    href={sys.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: blueColor,
                                        textDecoration: "none",
                                    }}
                                >
                                    Open Dashboard / Link ↗
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Change & Incident Log */}
            <section
                style={{
                    borderRadius: "18px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0, 2, 1, 0.08)",
                    padding: "18px",
                    boxShadow: "0 8px 22px rgba(0, 2, 1, 0.04)",
                }}
            >
                <h2
                    style={{
                        margin: "0 0 4px",
                        fontSize: "16px",
                        fontWeight: 800,
                        color: blackColor,
                    }}
                >
                    Change & Incident Log
                </h2>
                <div
                    style={{
                        fontSize: "11px",
                        color: greyColor,
                        marginBottom: "14px",
                    }}
                >
                    Record deployments, DNS edits, permission changes, or issues.
                </div>

                <form
                    onSubmit={handleAddLog}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "9px",
                        padding: "13px",
                        borderRadius: "14px",
                        backgroundColor: "#F9FAFC",
                        border: "1px solid rgba(0, 2, 1, 0.08)",
                        marginBottom: "14px",
                    }}
                >
                    <input
                        type="text"
                        placeholder="Change or issue title (e.g. Updated Supabase RLS policy)"
                        value={logTitle}
                        onChange={(e) => setLogTitle(e.target.value)}
                        required
                        style={{
                            padding: "9px 11px",
                            borderRadius: "9px",
                            border: "1px solid rgba(0, 2, 1, 0.14)",
                            fontSize: "12px",
                        }}
                    />

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: "9px",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="System affected"
                            value={logSystem}
                            onChange={(e) => setLogSystem(e.target.value)}
                            style={{
                                padding: "9px 11px",
                                borderRadius: "9px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                fontSize: "12px",
                            }}
                        />

                        <select
                            value={logSeverity}
                            onChange={(e) =>
                                setLogSeverity(e.target.value as IncidentSeverity)
                            }
                            style={{
                                padding: "9px 11px",
                                borderRadius: "9px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                fontSize: "12px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            <option value="Info">Info / Update</option>
                            <option value="Warning">Warning / Review</option>
                            <option value="Outage">Outage / Urgent</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Notes or resolution details..."
                        value={logDetails}
                        onChange={(e) => setLogDetails(e.target.value)}
                        style={{
                            padding: "9px 11px",
                            borderRadius: "9px",
                            border: "1px solid rgba(0, 2, 1, 0.14)",
                            fontSize: "12px",
                        }}
                    />

                    <button
                        type="submit"
                        style={{
                            padding: "10px 14px",
                            borderRadius: "9px",
                            border: "none",
                            backgroundColor: redColor,
                            color: "#FFFFFF",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Log Entry
                    </button>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    {logs.map((entry) => (
                        <div
                            key={entry.id}
                            style={{
                                padding: "12px 14px",
                                borderRadius: "13px",
                                backgroundColor: "#F9FAFC",
                                border: "1px solid rgba(0, 2, 1, 0.08)",
                                opacity: entry.resolved ? 0.85 : 1,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                    marginBottom: "4px",
                                }}
                            >
                                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                                    {entry.title}
                                </div>
                                <span
                                    style={{
                                        padding: "3px 8px",
                                        borderRadius: "999px",
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        ...getSeverityStyle(entry.severity),
                                    }}
                                >
                                    {entry.severity}
                                </span>
                            </div>

                            {entry.details && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: blackColor,
                                        marginBottom: "6px",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {entry.details}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    fontSize: "11px",
                                    color: greyColor,
                                }}
                            >
                                <span>
                                    {entry.system} • Logged by {entry.author} ({entry.timestamp})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => toggleLogResolved(entry.id)}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: entry.resolved ? "#047857" : blueColor,
                                        fontWeight: 700,
                                        fontSize: "11px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {entry.resolved ? "✓ Resolved" : "Mark Resolved"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
