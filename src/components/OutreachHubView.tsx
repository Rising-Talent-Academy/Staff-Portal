import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import type { StaffProfile } from "./DashboardScreen"

export type OutreachPageMode = "tracker" | "templates"

interface OutreachHubViewProps {
    user: StaffProfile
    mode?: OutreachPageMode
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

type LeadCategory = "podcast_guest" | "team" | "brand_partner"
type LeadStatus =
    | "to_contact"
    | "contacted"
    | "in_talks"
    | "confirmed"
    | "declined"

interface OutreachLead {
    id: string
    contact_name: string
    category: LeadCategory | string
    series_or_org: string | null
    handle_or_email: string | null
    status: LeadStatus | string
    owner_rta_id: string
    owner_name: string
    notes: string | null
    last_contacted_at?: string
    created_at?: string
}

const CATEGORY_OPTIONS: { value: LeadCategory; label: string }[] = [
    { value: "podcast_guest", label: "Rising Talent Talkers (Driver)" },
    { value: "team", label: "Team / Academy" },
    { value: "brand_partner", label: "Brand Partnership" },
]

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
    { value: "to_contact", label: "To Contact" },
    { value: "contacted", label: "DM / Email Sent" },
    { value: "in_talks", label: "In Talks" },
    { value: "confirmed", label: "Confirmed" },
    { value: "declined", label: "Declined / No Reply" },
]

const OUTREACH_TEMPLATES = [
    {
        id: "podcast-driver",
        tag: "Rising Talent Talkers • Driver Invite",
        title: "Podcast Guest DM / Email",
        body: `Hi [Driver Name],\n\nWe’ve been following your season in [Series/Championship] and love what you’re building on and off track. I’m reaching out from Rising Talent Academy—we spotlight rising drivers and motorsport talent across our digital platform and podcast, Rising Talent Talkers.\n\nWe’d love to have you on an upcoming episode of Rising Talent Talkers for a relaxed chat about your racing journey, this season so far, and what’s next for you. It’s recorded remotely and takes around 30–40 minutes.\n\nWould you be up for jumping on an episode soon? Let me know what days usually work best for you!\n\nBest,\n[Your Name]\nOutreach & Communications | Rising Talent Academy`,
    },
    {
        id: "team-collab",
        tag: "Teams & Academies",
        title: "Team / Driver Roster Feature",
        body: `Hi [Team Name / Media Contact],\n\nI’m getting in touch from Rising Talent Academy—a digital motorsport media platform dedicated to spotlighting emerging drivers, junior formulas, and karting talent.\n\nWe’d love to feature [Team Name] and your drivers across our editorial coverage and our podcast, Rising Talent Talkers, over the coming rounds. Happy to share our media overview and chat about how we can highlight your programme.\n\nWho is the best person on your comms side to coordinate with?\n\nBest regards,\n[Your Name]\nOutreach & Communications | Rising Talent Academy`,
    },
    {
        id: "brand-partner",
        tag: "Brand Partnerships",
        title: "Sponsor / Brand Collaboration Pitch",
        body: `Hi [Contact / Brand Name],\n\nI’m reaching out from Rising Talent Academy, a digital-first motorsport media platform covering rising drivers, junior categories, and grassroots racing—alongside our podcast, Rising Talent Talkers.\n\nWe’re currently lining up brand partners for our upcoming digital content series and podcast episodes, and [Brand Name] stood out as a natural fit for our audience of engaged motorsport fans and young competitors.\n\nWould you be open to a quick call or email exchange next week so I can share our audience stats and partnership options?\n\nBest,\n[Your Name]\nOutreach & Communications | Rising Talent Academy`,
    },
    {
        id: "rta-blurb",
        tag: "Quick Intro Bio",
        title: "Standard “Who is RTA?” Summary",
        body: `Rising Talent Academy is a digital motorsport media platform dedicated to spotlighting the next generation of racing drivers, teams, and industry talent through written journalism, social content, and our flagship podcast, Rising Talent Talkers.`,
    },
]

const PAGE_TITLES: Record<OutreachPageMode, string> = {
    tracker: "Outreach & Podcast Tracker",
    templates: "Outreach Templates & Bio",
}

function categoryLabel(cat: string): string {
    return (
        CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ||
        "Rising Talent Talkers"
    )
}

function statusLabel(status: string): string {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label || status
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
    const seen = new Set<string>()
    const unique: T[] = []
    for (const row of rows) {
        if (!row?.id || seen.has(row.id)) continue
        seen.add(row.id)
        unique.push(row)
    }
    return unique
}

export function OutreachHubView({
    user,
    mode = "tracker",
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: OutreachHubViewProps) {
    const [errorMsg, setErrorMsg] = useState("")
    const [statusMsg, setStatusMsg] = useState("")

    // Leads state (only fetched on tracker page)
    const [leads, setLeads] = useState<OutreachLead[]>([])
    const [loadingLeads, setLoadingLeads] = useState(mode === "tracker")
    const [leadSearch, setLeadSearch] = useState("")
    const [leadCategoryFilter, setLeadCategoryFilter] = useState<string>("all")
    const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all")

    // New lead form
    const [contactName, setContactName] = useState("")
    const [category, setCategory] = useState<LeadCategory>("podcast_guest")
    const [seriesOrOrg, setSeriesOrOrg] = useState("")
    const [handleOrEmail, setHandleOrEmail] = useState("")
    const [leadStatus, setLeadStatus] = useState<LeadStatus>("contacted")
    const [notes, setNotes] = useState("")
    const [savingLead, setSavingLead] = useState(false)

    // Templates copy state (only shown on templates page)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const loadLeads = async (isCancelled?: () => boolean) => {
        setLoadingLeads(true)
        setErrorMsg("")
        const { data, error } = await supabase
            .from("outreach_leads")
            .select("*")
            .order("created_at", { ascending: false })

        if (isCancelled?.()) return

        if (error) {
            setErrorMsg(error.message)
        } else {
            setLeads(dedupeById((data as OutreachLead[]) || []))
        }
        setLoadingLeads(false)
    }

    useEffect(() => {
        let cancelled = false
        setErrorMsg("")
        setStatusMsg("")

        if (mode === "tracker") {
            loadLeads(() => cancelled)
        }

        return () => {
            cancelled = true
        }
    }, [mode])

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault()
        if (savingLead) return

        setErrorMsg("")
        setStatusMsg("")

        const cleanName = contactName.trim()
        const cleanHandle = handleOrEmail.trim()

        if (!cleanName) {
            setErrorMsg("Please enter a driver, team, or brand name.")
            return
        }

        const duplicateLead = leads.find((existing) => {
            const sameName =
                existing.contact_name.trim().toLowerCase() ===
                cleanName.toLowerCase()
            const sameHandle =
                Boolean(cleanHandle) &&
                Boolean(existing.handle_or_email) &&
                existing.handle_or_email!.trim().toLowerCase() ===
                    cleanHandle.toLowerCase()
            return sameName || sameHandle
        })

        if (duplicateLead) {
            setErrorMsg(
                `"${duplicateLead.contact_name}" is already in the tracker (claimed by ${duplicateLead.owner_rta_id} • ${statusLabel(duplicateLead.status)}). Update their status instead of adding a duplicate.`
            )
            return
        }

        setSavingLead(true)
        const { error } = await supabase.from("outreach_leads").insert({
            contact_name: cleanName,
            category,
            series_or_org: seriesOrOrg.trim() || null,
            handle_or_email: cleanHandle || null,
            status: leadStatus,
            owner_rta_id: user.rtaId,
            owner_name: user.name || user.rtaId,
            notes: notes.trim() || null,
            last_contacted_at: new Date().toISOString(),
        })

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(
                `Logged ${cleanName} under ${user.rtaId} so nobody double-contacts them.`
            )
            setContactName("")
            setSeriesOrOrg("")
            setHandleOrEmail("")
            setNotes("")
            await loadLeads()
        }
        setSavingLead(false)
    }

    const handleUpdateLeadStatus = async (
        lead: OutreachLead,
        newStatus: string
    ) => {
        setErrorMsg("")
        const { error } = await supabase
            .from("outreach_leads")
            .update({
                status: newStatus,
                last_contacted_at: new Date().toISOString(),
            })
            .eq("id", lead.id)

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(
                `Updated ${lead.contact_name} → ${statusLabel(newStatus)}.`
            )
            await loadLeads()
        }
    }

    const handleDeleteLead = async (lead: OutreachLead) => {
        setErrorMsg("")
        const { error } = await supabase
            .from("outreach_leads")
            .delete()
            .eq("id", lead.id)

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(`Removed ${lead.contact_name} from Outreach Tracker.`)
            await loadLeads()
        }
    }

    const handleCopyTemplate = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2200)
        } catch {
            setErrorMsg("Could not copy automatically—select and copy manually.")
        }
    }

    const filteredLeads = useMemo(() => {
        const q = leadSearch.trim().toLowerCase()
        return leads.filter((lead) => {
            if (
                leadCategoryFilter !== "all" &&
                lead.category !== leadCategoryFilter
            ) {
                return false
            }
            if (
                leadStatusFilter !== "all" &&
                lead.status !== leadStatusFilter
            ) {
                return false
            }
            if (!q) return true
            return (
                lead.contact_name.toLowerCase().includes(q) ||
                (lead.series_or_org || "").toLowerCase().includes(q) ||
                (lead.handle_or_email || "").toLowerCase().includes(q) ||
                lead.owner_rta_id.toLowerCase().includes(q) ||
                (lead.notes || "").toLowerCase().includes(q)
            )
        })
    }, [leads, leadSearch, leadCategoryFilter, leadStatusFilter])

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid rgba(0, 2, 1, 0.14)",
        backgroundColor: "#F9FAFC",
        color: blackColor,
        fontSize: "13px",
        boxSizing: "border-box",
    }

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: greyColor,
        marginBottom: "5px",
    }

    return (
        <div
            style={{
                maxWidth: "700px",
                width: "100%",
                margin: "0 auto",
                padding: "18px 18px 36px",
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "16px",
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
                            marginBottom: "2px",
                        }}
                    >
                        Outreach & Communications
                    </div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "20px",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: blackColor,
                        }}
                    >
                        {PAGE_TITLES[mode]}
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 2, 1, 0.14)",
                        backgroundColor: "#FFFFFF",
                        color: blackColor,
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    ← Back to Portal
                </button>
            </div>

            {errorMsg && (
                <div
                    style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(250, 52, 37, 0.1)",
                        border: `1px solid ${redColor}`,
                        color: redColor,
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "14px",
                    }}
                >
                    {errorMsg}
                </div>
            )}

            {statusMsg && (
                <div
                    style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(3, 78, 175, 0.1)",
                        border: `1px solid ${blueColor}`,
                        color: blueColor,
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "14px",
                    }}
                >
                    {statusMsg}
                </div>
            )}

            {/* PAGE 1: OUTREACH & PODCAST TRACKER */}
            {mode === "tracker" && (
                <>
                    <section
                        style={{
                            borderRadius: "18px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0, 2, 1, 0.08)",
                            boxShadow: "0 8px 22px rgba(0, 2, 1, 0.04)",
                            padding: "18px",
                            marginBottom: "18px",
                        }}
                    >
                        <h2
                            style={{
                                margin: "0 0 12px",
                                fontSize: "15px",
                                fontWeight: 800,
                                color: blackColor,
                            }}
                        >
                            Log Podcast Guest, Team, or Brand Lead
                        </h2>

                        <form onSubmit={handleAddLead}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "10px",
                                    marginBottom: "10px",
                                }}
                            >
                                <div>
                                    <label style={labelStyle}>
                                        Driver / Team / Brand Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Alex Dunne / Carlin / Sparco"
                                        value={contactName}
                                        onChange={(e) =>
                                            setContactName(e.target.value)
                                        }
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) =>
                                            setCategory(
                                                e.target.value as LeadCategory
                                            )
                                        }
                                        style={inputStyle}
                                    >
                                        {CATEGORY_OPTIONS.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={labelStyle}>
                                        Series / Championship / Sector
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. British F4 / Karting / Sim Gear"
                                        value={seriesOrOrg}
                                        onChange={(e) =>
                                            setSeriesOrOrg(e.target.value)
                                        }
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>
                                        @Handle or Email
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. @driverhandle or pr@brand.com"
                                        value={handleOrEmail}
                                        onChange={(e) =>
                                            setHandleOrEmail(e.target.value)
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "10px",
                                    marginBottom: "12px",
                                }}
                            >
                                <div>
                                    <label style={labelStyle}>
                                        Current Status
                                    </label>
                                    <select
                                        value={leadStatus}
                                        onChange={(e) =>
                                            setLeadStatus(
                                                e.target.value as LeadStatus
                                            )
                                        }
                                        style={inputStyle}
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={labelStyle}>
                                        Quick Notes
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. DM'd on IG for Rising Talent Talkers Ep 12"
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingLead}
                                style={{
                                    width: "100%",
                                    padding: "11px 16px",
                                    borderRadius: "11px",
                                    border: "none",
                                    backgroundColor: blueColor,
                                    color: "#FFFFFF",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: savingLead
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                {savingLead
                                    ? "Saving Lead..."
                                    : `Claim & Log Lead (${user.rtaId})`}
                            </button>
                        </form>
                    </section>

                    <section
                        style={{
                            borderRadius: "18px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0, 2, 1, 0.08)",
                            boxShadow: "0 8px 22px rgba(0, 2, 1, 0.04)",
                            padding: "18px",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(150px, 1fr))",
                                gap: "8px",
                                marginBottom: "14px",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Search driver, brand, @handle, RTA ID..."
                                value={leadSearch}
                                onChange={(e) => setLeadSearch(e.target.value)}
                                style={inputStyle}
                            />
                            <select
                                value={leadCategoryFilter}
                                onChange={(e) =>
                                    setLeadCategoryFilter(e.target.value)
                                }
                                style={inputStyle}
                            >
                                <option value="all">All Categories</option>
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={leadStatusFilter}
                                onChange={(e) =>
                                    setLeadStatusFilter(e.target.value)
                                }
                                style={inputStyle}
                            >
                                <option value="all">All Statuses</option>
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loadingLeads ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "16px 0",
                                    fontSize: "13px",
                                    color: greyColor,
                                }}
                            >
                                Loading outreach pipeline...
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "16px 0",
                                    fontSize: "13px",
                                    color: greyColor,
                                }}
                            >
                                No outreach leads logged yet.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                }}
                            >
                                {filteredLeads.map((lead, idx) => (
                                    <div
                                        key={lead.id || `lead-${idx}`}
                                        style={{
                                            padding: "14px",
                                            borderRadius: "14px",
                                            border:
                                                "1px solid rgba(0, 2, 1, 0.08)",
                                            backgroundColor: "#F9FAFC",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                gap: "10px",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        flexWrap: "wrap",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "14px",
                                                            fontWeight: 800,
                                                            color: blackColor,
                                                        }}
                                                    >
                                                        {lead.contact_name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            padding: "2px 8px",
                                                            borderRadius: "6px",
                                                            backgroundColor:
                                                                "rgba(3, 78, 175, 0.12)",
                                                            color: blueColor,
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {categoryLabel(
                                                            lead.category
                                                        )}
                                                    </span>
                                                    <span
                                                        style={{
                                                            padding: "2px 8px",
                                                            borderRadius: "6px",
                                                            backgroundColor:
                                                                "rgba(250, 52, 37, 0.1)",
                                                            color: redColor,
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Claimed:{" "}
                                                        {lead.owner_rta_id}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: greyColor,
                                                    }}
                                                >
                                                    {lead.series_or_org ||
                                                        "General"}
                                                    {lead.handle_or_email
                                                        ? ` • ${lead.handle_or_email}`
                                                        : ""}
                                                </div>

                                                {lead.notes && (
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: blackColor,
                                                            marginTop: "6px",
                                                        }}
                                                    >
                                                        {lead.notes}
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) =>
                                                        handleUpdateLeadStatus(
                                                            lead,
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: "8px",
                                                        border:
                                                            "1px solid rgba(0, 2, 1, 0.15)",
                                                        backgroundColor:
                                                            "#FFFFFF",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        color: blackColor,
                                                    }}
                                                >
                                                    {STATUS_OPTIONS.map(
                                                        (opt) => (
                                                            <option
                                                                key={opt.value}
                                                                value={
                                                                    opt.value
                                                                }
                                                            >
                                                                {opt.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteLead(lead)
                                                    }
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: "8px",
                                                        border: `1px solid ${redColor}`,
                                                        backgroundColor:
                                                            "rgba(250, 52, 37, 0.08)",
                                                        color: redColor,
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* PAGE 2: TEMPLATES & BIO */}
            {mode === "templates" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {OUTREACH_TEMPLATES.map((tpl) => {
                        const isCopied = copiedId === tpl.id
                        return (
                            <div
                                key={tpl.id}
                                style={{
                                    borderRadius: "16px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.08)",
                                    boxShadow:
                                        "0 8px 22px rgba(0, 2, 1, 0.04)",
                                    padding: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.08em",
                                                color: redColor,
                                            }}
                                        >
                                            {tpl.tag}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: 800,
                                                color: blackColor,
                                            }}
                                        >
                                            {tpl.title}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCopyTemplate(tpl.id, tpl.body)
                                        }
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: "9px",
                                            border: "none",
                                            backgroundColor: isCopied
                                                ? blackColor
                                                : blueColor,
                                            color: "#FFFFFF",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {isCopied ? "Copied!" : "Copy Text"}
                                    </button>
                                </div>

                                <pre
                                    style={{
                                        margin: 0,
                                        whiteSpace: "pre-wrap",
                                        fontFamily: "inherit",
                                        fontSize: "12px",
                                        lineHeight: 1.5,
                                        color: greyColor,
                                        backgroundColor: "#F9FAFC",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        border: "1px solid rgba(0, 2, 1, 0.06)",
                                    }}
                                >
                                    {tpl.body}
                                </pre>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
