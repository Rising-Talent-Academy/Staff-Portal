import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { PermissionGroup, StaffProfile } from "./DashboardScreen"

export type BriefingPriority = "priority" | "update" | "reminder"

export interface TeamBriefing {
    id: string
    title: string
    body: string
    priority: BriefingPriority
    pinned: boolean
    authorName: string
    authorRole: string
    authorRtaId: string
    createdAt: string
}

interface TeamBriefingsViewProps {
    user: StaffProfile
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

const PRIORITY_LABELS: Record<BriefingPriority, string> = {
    priority: "Priority",
    update: "Update",
    reminder: "Reminder",
}

const DEFAULT_BRIEFINGS: TeamBriefing[] = [
    {
        id: "seed-1",
        title: "Weekly Priorities & Content Alignment",
        body: "Check your department page for active deliverables, handoffs, and approval queues. Keep titles clear and tag any cross-team needs early so nothing stalls.",
        priority: "priority",
        pinned: true,
        authorName: "Antony Dyson",
        authorRole: "Founder & Leadership",
        authorRtaId: "RTA-001",
        createdAt: "Pinned",
    },
    {
        id: "seed-2",
        title: "Brand Palette & Gradient Standard",
        body: "Stick to Rising Talent Academy's core palette (#fa3425, #000201, #034eaf, #696969) and the red-to-blue gradient accents across portal and social assets.",
        priority: "update",
        pinned: false,
        authorName: "Leadership Desk",
        authorRole: "Admin",
        authorRtaId: "RTA-ADMIN",
        createdAt: "Recent",
    },
]

function isAdminGroup(group: PermissionGroup): boolean {
    return group === "leadership"
}

export function TeamBriefingsView({
    user,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: TeamBriefingsViewProps) {
    const canPost = isAdminGroup(user.permissionGroup)

    const [briefings, setBriefings] = useState<TeamBriefing[]>(DEFAULT_BRIEFINGS)
    const [loading, setLoading] = useState(true)
    const [composerOpen, setComposerOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [priority, setPriority] = useState<BriefingPriority>("update")
    const [pinned, setPinned] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [statusNote, setStatusNote] = useState("")

    const gradientBar = `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`
    const gradientVertical = `linear-gradient(180deg, ${redColor} 0%, ${blueColor} 100%)`

    useEffect(() => {
        let active = true

        async function loadBriefings() {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from("team_briefings")
                    .select("*")
                    .order("pinned", { ascending: false })
                    .order("created_at", { ascending: false })

                if (!active) return

                if (!error && Array.isArray(data) && data.length > 0) {
                    const mapped: TeamBriefing[] = data.map((row: any) => ({
                        id: String(row.id),
                        title: String(row.title ?? ""),
                        body: String(row.body ?? ""),
                        priority: (row.priority === "priority" ||
                        row.priority === "reminder"
                            ? row.priority
                            : "update") as BriefingPriority,
                        pinned: Boolean(row.pinned),
                        authorName: String(row.author_name ?? "Leadership"),
                        authorRole: String(row.author_role ?? "Admin"),
                        authorRtaId: String(row.author_rta_id ?? "RTA"),
                        createdAt: row.created_at
                            ? new Date(row.created_at).toLocaleDateString(
                                  "en-GB",
                                  {
                                      day: "2-digit",
                                      month: "short",
                                  }
                              )
                            : "Recent",
                    }))
                    setBriefings(mapped)
                }
            } catch {
                // Keep default briefings if table isn't reachable yet
            } finally {
                if (active) setLoading(false)
            }
        }

        loadBriefings()
        return () => {
            active = false
        }
    }, [])

    const sortedBriefings = [...briefings].sort((a, b) => {
        if (a.pinned === b.pinned) return 0
        return a.pinned ? -1 : 1
    })

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canPost) {
            setStatusNote("Only Leadership & Admin accounts can post briefings.")
            return
        }

        const cleanTitle = title.trim()
        const cleanBody = body.trim()
        if (!cleanTitle || !cleanBody) {
            setStatusNote("Add both a headline and briefing message first.")
            return
        }

        setSubmitting(true)
        setStatusNote("")

        const optimisticItem: TeamBriefing = {
            id: `local-${Date.now()}`,
            title: cleanTitle,
            body: cleanBody,
            priority,
            pinned,
            authorName: user.name,
            authorRole: user.role,
            authorRtaId: user.rtaId,
            createdAt: "Just now",
        }

        try {
            const { data, error } = await supabase
                .from("team_briefings")
                .insert({
                    title: cleanTitle,
                    body: cleanBody,
                    priority,
                    pinned,
                    author_name: user.name,
                    author_role: user.role,
                    author_rta_id: user.rtaId,
                })
                .select()
                .single()

            if (!error && data) {
                optimisticItem.id = String(data.id)
            }
        } catch {
            // Keep local item if Supabase isn't configured yet
        }

        setBriefings((prev) => [optimisticItem, ...prev])
        setTitle("")
        setBody("")
        setPriority("update")
        setPinned(false)
        setComposerOpen(false)
        setSubmitting(false)
        setStatusNote("Briefing posted to the team.")
    }

    const handleDelete = async (id: string) => {
        if (!canPost) return
        setBriefings((prev) => prev.filter((item) => item.id !== id))
        try {
            await supabase.from("team_briefings").delete().eq("id", id)
        } catch {
            // Ignore network error after local removal
        }
    }

    const getTagStyle = (item: TeamBriefing): React.CSSProperties => {
        if (item.pinned || item.priority === "priority") {
            return {
                background: gradientBar,
                color: "#FFFFFF",
            }
        }
        if (item.priority === "reminder") {
            return {
                backgroundColor: "rgba(250, 52, 37, 0.1)",
                color: redColor,
            }
        }
        return {
            backgroundColor: "rgba(3, 78, 175, 0.1)",
            color: blueColor,
        }
    }

    return (
        <div
            style={{
                maxWidth: "620px",
                width: "100%",
                margin: "0 auto",
                padding: "16px 16px 32px",
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
                    marginBottom: "14px",
                }}
            >
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 14px",
                        borderRadius: "11px",
                        border: "1px solid rgba(0, 2, 1, 0.12)",
                        backgroundColor: "#FFFFFF",
                        color: blackColor,
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    <span>←</span>
                    <span>Back</span>
                </button>

                {canPost ? (
                    <button
                        type="button"
                        onClick={() => {
                            setComposerOpen((prev) => !prev)
                            setStatusNote("")
                        }}
                        style={{
                            padding: "9px 14px",
                            borderRadius: "11px",
                            border: "none",
                            background: gradientBar,
                            color: "#FFFFFF",
                            fontSize: "12px",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                        }}
                    >
                        {composerOpen ? "Cancel" : "+ New Briefing"}
                    </button>
                ) : (
                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: greyColor,
                        }}
                    >
                        Read Only
                    </span>
                )}
            </div>

            {/* Header Card */}
            <section
                style={{
                    position: "relative",
                    borderRadius: "20px",
                    backgroundColor: blackColor,
                    color: "#FFFFFF",
                    overflow: "hidden",
                    marginBottom: "14px",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: "4px",
                        background: gradientVertical,
                    }}
                />
                <div
                    style={{
                        height: "3px",
                        width: "100%",
                        background: gradientBar,
                    }}
                />
                <div style={{ padding: "18px 20px 18px 22px" }}>
                    <div
                        style={{
                            fontSize: "10.5px",
                            fontWeight: 800,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            background: gradientBar,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            marginBottom: "4px",
                        }}
                    >
                        General · Team Feed
                    </div>
                    <h1
                        style={{
                            margin: "0 0 5px",
                            fontSize: "22px",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "#FFFFFF",
                        }}
                    >
                        Team Briefings
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "13px",
                            lineHeight: 1.45,
                            color: "rgba(255, 255, 255, 0.72)",
                        }}
                    >
                        {canPost
                            ? "Post announcements, priorities, and updates for all staff."
                            : "Announcements and weekly priorities posted by leadership."}
                    </p>
                </div>
            </section>

            {statusNote && (
                <div
                    style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0, 2, 1, 0.1)",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: blackColor,
                        marginBottom: "12px",
                    }}
                >
                    {statusNote}
                </div>
            )}

            {/* Admin-Only Composer */}
            {canPost && composerOpen && (
                <form
                    onSubmit={handlePublish}
                    style={{
                        borderRadius: "18px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0, 2, 1, 0.12)",
                        padding: "16px",
                        marginBottom: "14px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: greyColor,
                            marginBottom: "10px",
                        }}
                    >
                        Publish Briefing (Admin Only)
                    </div>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Briefing headline"
                        style={{
                            width: "100%",
                            padding: "11px 13px",
                            borderRadius: "11px",
                            border: "1px solid rgba(0, 2, 1, 0.14)",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: blackColor,
                            marginBottom: "10px",
                            boxSizing: "border-box",
                        }}
                    />

                    <textarea
                        rows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write the update or instructions for the team..."
                        style={{
                            width: "100%",
                            padding: "11px 13px",
                            borderRadius: "11px",
                            border: "1px solid rgba(0, 2, 1, 0.14)",
                            fontSize: "13.5px",
                            lineHeight: 1.45,
                            color: blackColor,
                            marginBottom: "12px",
                            resize: "vertical",
                            boxSizing: "border-box",
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            marginBottom: "14px",
                        }}
                    >
                        <div style={{ display: "flex", gap: "6px" }}>
                            {(
                                ["priority", "update", "reminder"] as BriefingPriority[]
                            ).map((level) => {
                                const selected = priority === level
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setPriority(level)}
                                        style={{
                                            padding: "6px 11px",
                                            borderRadius: "8px",
                                            border: selected
                                                ? "none"
                                                : "1px solid rgba(0, 2, 1, 0.12)",
                                            background: selected
                                                ? gradientBar
                                                : "#F5F6F9",
                                            color: selected
                                                ? "#FFFFFF"
                                                : blackColor,
                                            fontSize: "11.5px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {PRIORITY_LABELS[level]}
                                    </button>
                                )
                            })}
                        </div>

                        <label
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: blackColor,
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={pinned}
                                onChange={(e) => setPinned(e.target.checked)}
                            />
                            Pin to top
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "11px",
                            border: "none",
                            background: gradientBar,
                            color: "#FFFFFF",
                            fontSize: "12.5px",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: submitting ? "not-allowed" : "pointer",
                        }}
                    >
                        {submitting ? "Posting..." : "Post Briefing"}
                    </button>
                </form>
            )}

            {/* Briefings List */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "11px",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            padding: "18px",
                            borderRadius: "16px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0, 2, 1, 0.08)",
                            fontSize: "13px",
                            color: greyColor,
                        }}
                    >
                        Loading briefings...
                    </div>
                ) : (
                    sortedBriefings.map((item) => (
                        <article
                            key={item.id}
                            style={{
                                borderRadius: "18px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(0, 2, 1, 0.1)",
                                overflow: "hidden",
                            }}
                        >
                            {item.pinned && (
                                <div
                                    style={{
                                        height: "3px",
                                        width: "100%",
                                        background: gradientBar,
                                    }}
                                />
                            )}

                            <div style={{ padding: "16px 18px" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "8px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        {item.pinned && (
                                            <span
                                                style={{
                                                    padding: "3px 8px",
                                                    borderRadius: "6px",
                                                    backgroundColor: blackColor,
                                                    color: "#FFFFFF",
                                                    fontSize: "10px",
                                                    fontWeight: 800,
                                                    letterSpacing: "0.08em",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                Pinned
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                padding: "3px 8px",
                                                borderRadius: "6px",
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                ...getTagStyle(item),
                                            }}
                                        >
                                            {PRIORITY_LABELS[item.priority]}
                                        </span>
                                    </div>

                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: greyColor,
                                        }}
                                    >
                                        {item.createdAt}
                                    </span>
                                </div>

                                <h2
                                    style={{
                                        margin: "0 0 6px",
                                        fontSize: "16.5px",
                                        fontWeight: 800,
                                        letterSpacing: "-0.015em",
                                        color: blackColor,
                                    }}
                                >
                                    {item.title}
                                </h2>

                                <p
                                    style={{
                                        margin: "0 0 12px",
                                        fontSize: "13.5px",
                                        lineHeight: 1.5,
                                        color: greyColor,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {item.body}
                                </p>

                                <div
                                    style={{
                                        paddingTop: "10px",
                                        borderTop:
                                            "1px solid rgba(0, 2, 1, 0.06)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "8px",
                                        fontSize: "11.5px",
                                        fontWeight: 700,
                                        color: blackColor,
                                    }}
                                >
                                    <span>
                                        {item.authorName}{" "}
                                        <span style={{ color: greyColor }}>
                                            · {item.authorRole}
                                        </span>
                                    </span>

                                    {canPost && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                padding: 0,
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: redColor,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    )
}
