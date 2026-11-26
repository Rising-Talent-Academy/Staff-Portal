import React, { useEffect, useState } from "react"
import type { StaffProfile } from "./DashboardScreen"

interface HrLegalVaultViewProps {
    user: StaffProfile
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

type VaultCategory = "Agreements" | "Policies" | "Media Releases" | "Onboarding"
type VaultStatus = "Active" | "Needs Review" | "Action Required"
type ComplianceSeverity = "Info" | "Reminder" | "Urgent"

interface VaultRecord {
    id: string
    title: string
    category: VaultCategory
    owner: string
    version: string
    url: string
    status: VaultStatus
    notes: string
    lastReviewed: string
}

interface ComplianceLogItem {
    id: string
    title: string
    category: string
    severity: ComplianceSeverity
    author: string
    timestamp: string
    details: string
    resolved: boolean
}

const RECORDS_STORAGE_KEY = "rta_hr_legal_records_v1"
const LOGS_STORAGE_KEY = "rta_hr_legal_logs_v1"

const DEFAULT_RECORDS: VaultRecord[] = [
    {
        id: "hr-volunteer-agreement",
        title: "Staff & Contributor Volunteer Agreement",
        category: "Agreements",
        owner: "Leadership & Admin",
        version: "v1.0",
        url: "",
        status: "Active",
        notes: "Core contributor terms, IP ownership for RTA articles/videos, and confidentiality expectations.",
        lastReviewed: "Current",
    },
    {
        id: "hr-code-of-conduct",
        title: "Code of Conduct & Social Media Policy",
        category: "Policies",
        owner: "Leadership & Admin",
        version: "v1.0",
        url: "",
        status: "Active",
        notes: "Standards for representing Rising Talent Academy online, paddock/guest etiquette, and brand safety.",
        lastReviewed: "Current",
    },
    {
        id: "hr-editorial-standards",
        title: "Editorial Integrity & Fact-Check Guidelines",
        category: "Policies",
        owner: "Editorial & Leadership",
        version: "v1.0",
        url: "",
        status: "Active",
        notes: "Source verification, credit attribution, and defamation/copyright safeguards for journalism.",
        lastReviewed: "Current",
    },
    {
        id: "hr-media-release",
        title: "Podcast Guest & Media Release Form",
        category: "Media Releases",
        owner: "Outreach & Leadership",
        version: "v1.0",
        url: "",
        status: "Active",
        notes: "Permission to record, clip, and distribute Rising Talent Talkers episodes across YouTube, TikTok & Reels.",
        lastReviewed: "Current",
    },
    {
        id: "hr-onboarding-checklist",
        title: "New Starter Onboarding & RTA ID Sign-Off",
        category: "Onboarding",
        owner: "Leadership & Admin",
        version: "v1.0",
        url: "",
        status: "Active",
        notes: "Verify signed agreement, portal access group, brand kit briefing, and initial department handoff.",
        lastReviewed: "Current",
    },
]

const DEFAULT_LOGS: ComplianceLogItem[] = [
    {
        id: "hr-log-1",
        title: "HR & Legal Vault Initialised",
        category: "Onboarding",
        severity: "Info",
        author: "Admin",
        timestamp: "Recent",
        details: "Core contributor agreements, editorial policies, and podcast media release templates logged.",
        resolved: true,
    },
]

export function HrLegalVaultView({
    user,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: HrLegalVaultViewProps) {
    const [records, setRecords] = useState<VaultRecord[]>(() => {
        try {
            const raw = localStorage.getItem(RECORDS_STORAGE_KEY)
            return raw ? JSON.parse(raw) : DEFAULT_RECORDS
        } catch {
            return DEFAULT_RECORDS
        }
    })

    const [logs, setLogs] = useState<ComplianceLogItem[]>(() => {
        try {
            const raw = localStorage.getItem(LOGS_STORAGE_KEY)
            return raw ? JSON.parse(raw) : DEFAULT_LOGS
        } catch {
            return DEFAULT_LOGS
        }
    })

    const [categoryFilter, setCategoryFilter] = useState<string>("All")
    const [showAddForm, setShowAddForm] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newCategory, setNewCategory] = useState<VaultCategory>("Agreements")
    const [newOwner, setNewOwner] = useState("Leadership & Admin")
    const [newVersion, setNewVersion] = useState("v1.0")
    const [newUrl, setNewUrl] = useState("")
    const [newNotes, setNewNotes] = useState("")

    const [logTitle, setLogTitle] = useState("")
    const [logCategory, setLogCategory] = useState("Onboarding")
    const [logSeverity, setLogSeverity] = useState<ComplianceSeverity>("Info")
    const [logDetails, setLogDetails] = useState("")

    useEffect(() => {
        try {
            localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records))
        } catch {
            // ignore storage quota errors
        }
    }, [records])

    useEffect(() => {
        try {
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))
        } catch {
            // ignore storage quota errors
        }
    }, [logs])

    const cycleRecordStatus = (id: string) => {
        const order: VaultStatus[] = [
            "Active",
            "Needs Review",
            "Action Required",
        ]
        setRecords((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item
                const next =
                    order[(order.indexOf(item.status) + 1) % order.length]
                return {
                    ...item,
                    status: next,
                    lastReviewed: "Updated just now",
                }
            })
        )
    }

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTitle.trim()) return

        const item: VaultRecord = {
            id: `hr-${Date.now()}`,
            title: newTitle.trim(),
            category: newCategory,
            owner: newOwner.trim() || "Leadership & Admin",
            version: newVersion.trim() || "v1.0",
            url: newUrl.trim(),
            status: "Active",
            notes: newNotes.trim() || "Tracked HR & compliance document.",
            lastReviewed: "Just now",
        }

        setRecords((prev) => [item, ...prev])
        setNewTitle("")
        setNewUrl("")
        setNewNotes("")
        setShowAddForm(false)
    }

    const handleDeleteRecord = (id: string) => {
        setRecords((prev) => prev.filter((r) => r.id !== id))
    }

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault()
        if (!logTitle.trim()) return

        const entry: ComplianceLogItem = {
            id: `hr-log-${Date.now()}`,
            title: logTitle.trim(),
            category: logCategory.trim() || "General",
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

    const getStatusBadgeStyle = (status: VaultStatus): React.CSSProperties => {
        if (status === "Active") {
            return {
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#047857",
                border: "1px solid rgba(16, 185, 129, 0.28)",
            }
        }
        if (status === "Needs Review") {
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

    const getSeverityStyle = (
        severity: ComplianceSeverity
    ): React.CSSProperties => {
        if (severity === "Urgent") {
            return {
                backgroundColor: "rgba(250, 52, 37, 0.12)",
                color: redColor,
            }
        }
        if (severity === "Reminder") {
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

    const filteredRecords =
        categoryFilter === "All"
            ? records
            : records.filter((r) => r.category === categoryFilter)

    const activeCount = records.filter((r) => r.status === "Active").length
    const flaggedCount = records.filter((r) => r.status !== "Active").length

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
                        HR & Legal Vault
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
                        marginBottom: "12px",
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
                            Governance & Compliance
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 700 }}>
                            {activeCount} of {records.length} documents current
                            {flaggedCount > 0 ? ` • ${flaggedCount} flagged` : ""}
                        </div>
                    </div>

                    <span
                        style={{
                            padding: "6px 11px",
                            borderRadius: "9px",
                            backgroundColor: "rgba(250, 52, 37, 0.2)",
                            border: "1px solid rgba(250, 52, 37, 0.45)",
                            color: "#FF857C",
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        Restricted Access
                    </span>
                </div>

                <div
                    style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.68)",
                        lineHeight: 1.45,
                    }}
                >
                    Data privacy reminder: Track document versions, sign-off statuses, and Drive links here—keep personal addresses, ID scans, and signed PDFs in your locked Drive vault.
                </div>
            </div>

            {/* Documents & Policies Registry */}
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
                            Agreements, Policies & Releases
                        </h2>
                        <div style={{ fontSize: "11px", color: greyColor }}>
                            Tap any status pill to cycle Active → Needs Review → Action Required
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddForm((v) => !v)}
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
                        {showAddForm ? "Cancel" : "+ Add Record"}
                    </button>
                </div>

                {/* Add Record Form */}
                {showAddForm && (
                    <form
                        onSubmit={handleAddRecord}
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
                                placeholder="Document title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                }}
                            />
                            <select
                                value={newCategory}
                                onChange={(e) =>
                                    setNewCategory(e.target.value as VaultCategory)
                                }
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                    backgroundColor: "#FFFFFF",
                                }}
                            >
                                <option value="Agreements">Agreements</option>
                                <option value="Policies">Policies</option>
                                <option value="Media Releases">Media Releases</option>
                                <option value="Onboarding">Onboarding</option>
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
                                placeholder="Owner (e.g. Leadership & Admin)"
                                value={newOwner}
                                onChange={(e) => setNewOwner(e.target.value)}
                                style={{
                                    padding: "9px 11px",
                                    borderRadius: "9px",
                                    border: "1px solid rgba(0, 2, 1, 0.14)",
                                    fontSize: "12px",
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Version (e.g. v1.1)"
                                value={newVersion}
                                onChange={(e) => setNewVersion(e.target.value)}
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
                            placeholder="Document link (Google Drive / Doc URL, optional)"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            style={{
                                padding: "9px 11px",
                                borderRadius: "9px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                fontSize: "12px",
                            }}
                        />

                        <input
                            type="text"
                            placeholder="Summary / compliance notes"
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
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
                            Save Record
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
                        "Agreements",
                        "Policies",
                        "Media Releases",
                        "Onboarding",
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

                {/* Record Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {filteredRecords.map((rec) => (
                        <div
                            key={rec.id}
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
                                        {rec.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: greyColor,
                                        }}
                                    >
                                        {rec.category} • {rec.version} • Owner:{" "}
                                        {rec.owner} • {rec.lastReviewed}
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
                                        onClick={() => cycleRecordStatus(rec.id)}
                                        style={{
                                            padding: "4px 9px",
                                            borderRadius: "999px",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            letterSpacing: "0.04em",
                                            cursor: "pointer",
                                            ...getStatusBadgeStyle(rec.status),
                                        }}
                                    >
                                        {rec.status}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Remove record"
                                        onClick={() => handleDeleteRecord(rec.id)}
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
                                    marginBottom: rec.url ? "8px" : 0,
                                }}
                            >
                                {rec.notes}
                            </div>

                            {rec.url && (
                                <a
                                    href={rec.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: blueColor,
                                        textDecoration: "none",
                                    }}
                                >
                                    Open Document / Folder ↗
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Onboarding & Compliance Log */}
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
                    Onboarding & Compliance Log
                </h2>
                <div
                    style={{
                        fontSize: "11px",
                        color: greyColor,
                        marginBottom: "14px",
                    }}
                >
                    Log signed agreements, policy updates, or onboarding follow-ups.
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
                        placeholder="Note title (e.g. RTA-004 Volunteer Agreement signed)"
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
                            placeholder="Area (e.g. Onboarding, Media Release)"
                            value={logCategory}
                            onChange={(e) => setLogCategory(e.target.value)}
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
                                setLogSeverity(e.target.value as ComplianceSeverity)
                            }
                            style={{
                                padding: "9px 11px",
                                borderRadius: "9px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                fontSize: "12px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            <option value="Info">Info / Signed</option>
                            <option value="Reminder">Reminder / Follow-up</option>
                            <option value="Urgent">Urgent / Action Needed</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Details or reference notes..."
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
                        Add Log Entry
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
                                    {entry.category} • Logged by {entry.author} (
                                    {entry.timestamp})
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
                                    {entry.resolved ? "✓ Completed" : "Mark Complete"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
