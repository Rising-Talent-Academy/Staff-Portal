import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export interface MemoStaffUser {
    rtaId: string
    name: string
    role: string
    permissionGroup: string
}

export type MemoTargetDept =
    | "all"
    | "journalist"
    | "creator"
    | "both"
    | "outreach"
    | "leadership"

export type MemoStatus = "open" | "in_progress" | "completed"

export interface DeptMemo {
    id: string
    title: string
    targetDepartment: MemoTargetDept | string
    brief: string
    status: MemoStatus | string
    createdByRtaId: string
    createdByName: string
    claimedByRtaId: string | null
    claimedByName: string | null
    createdAt: string
}

interface DeptMemosViewProps {
    user: MemoStaffUser
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

const TARGET_DEPT_OPTIONS: { value: MemoTargetDept; label: string }[] = [
    { value: "all", label: "All Departments" },
    { value: "journalist", label: "Journalism" },
    { value: "creator", label: "Content Creation" },
    { value: "both", label: "Journalism & Creators" },
    { value: "outreach", label: "Outreach & Comms" },
    { value: "leadership", label: "Leadership & Admin" },
]

function targetDeptLabel(dept: string): string {
    return (
        TARGET_DEPT_OPTIONS.find((d) => d.value === dept)?.label ||
        "All Departments"
    )
}

function statusBadgeLabel(status: string): string {
    if (status === "completed") return "Completed"
    if (status === "in_progress") return "Picked Up"
    return "Open"
}

function isMemoSentToDepartment(
    targetDepartment: string,
    permissionGroup: string
): boolean {
    if (targetDepartment === "all") return true

    switch (permissionGroup) {
        case "journalist":
            return targetDepartment === "journalist" || targetDepartment === "both"
        case "creator":
            return targetDepartment === "creator" || targetDepartment === "both"
        case "both":
            return (
                targetDepartment === "both" ||
                targetDepartment === "journalist" ||
                targetDepartment === "creator"
            )
        case "outreach":
            return targetDepartment === "outreach"
        case "leadership":
            return targetDepartment === "leadership"
        default:
            return targetDepartment === permissionGroup
    }
}

export function DeptMemosView({
    user,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: DeptMemosViewProps) {
    const [memos, setMemos] = useState<DeptMemo[]>([])
    const [loading, setLoading] = useState(true)
    const [composerOpen, setComposerOpen] = useState(false)

    const [title, setTitle] = useState("")
    const [targetDept, setTargetDept] = useState<MemoTargetDept>("all")
    const [brief, setBrief] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [statusNote, setStatusNote] = useState("")

    const gradientBar = `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`
    const gradientVertical = `linear-gradient(180deg, ${redColor} 0%, ${blueColor} 100%)`

    const mapRows = (rows: any[]): DeptMemo[] =>
        rows.map((row) => ({
            id: String(row.id),
            title: String(row.title ?? ""),
            targetDepartment: String(row.target_department ?? "all"),
            brief: String(row.brief ?? ""),
            status: String(row.status ?? "open"),
            createdByRtaId: String(row.created_by_rta_id ?? "RTA"),
            createdByName: String(row.created_by_name ?? ""),
            claimedByRtaId: row.claimed_by_rta_id
                ? String(row.claimed_by_rta_id)
                : null,
            claimedByName: row.claimed_by_name
                ? String(row.claimed_by_name)
                : null,
            createdAt: row.created_at
                ? new Date(row.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                  })
                : "Recent",
        }))

    const loadMemos = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("department_handoffs")
                .select("*")
                .order("created_at", { ascending: false })

            if (!error && Array.isArray(data)) {
                setMemos(mapRows(data))
            }
        } catch {
            // Keep current list if offline or table unavailable
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMemos()
    }, [])

    const handleCreateMemo = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatusNote("")

        const cleanTitle = title.trim()
        const cleanBrief = brief.trim()
        if (!cleanTitle || !cleanBrief) {
            setStatusNote("Add both a memo title and brief before posting.")
            return
        }

        setSubmitting(true)
        const optimistic: DeptMemo = {
            id: `local-${Date.now()}`,
            title: cleanTitle,
            targetDepartment: targetDept,
            brief: cleanBrief,
            status: "open",
            createdByRtaId: user.rtaId,
            createdByName: user.name || user.rtaId,
            claimedByRtaId: null,
            claimedByName: null,
            createdAt: "Just now",
        }

        try {
            const { data, error } = await supabase
                .from("department_handoffs")
                .insert({
                    title: cleanTitle,
                    target_department: targetDept,
                    brief: cleanBrief,
                    status: "open",
                    created_by_rta_id: user.rtaId,
                    created_by_name: user.name || user.rtaId,
                })
                .select()
                .single()

            if (!error && data) {
                optimistic.id = String(data.id)
            }
        } catch {
            // Keep optimistic item locally
        }

        setMemos((prev) => [optimistic, ...prev])
        setTitle("")
        setTargetDept("all")
        setBrief("")
        setComposerOpen(false)
        setSubmitting(false)
        setStatusNote(`Memo sent to ${targetDeptLabel(targetDept)}.`)
    }

    const handleUpdateStatus = async (
        memo: DeptMemo,
        nextStatus: MemoStatus
    ) => {
        const claimedRta =
            nextStatus === "in_progress" ? user.rtaId : memo.claimedByRtaId
        const claimedName =
            nextStatus === "in_progress"
                ? user.name || user.rtaId
                : memo.claimedByName

        setMemos((prev) =>
            prev.map((m) =>
                m.id === memo.id
                    ? {
                          ...m,
                          status: nextStatus,
                          claimedByRtaId: claimedRta,
                          claimedByName: claimedName,
                      }
                    : m
            )
        )

        if (!memo.id.startsWith("local-")) {
            const payload: Record<string, unknown> = { status: nextStatus }
            if (nextStatus === "in_progress") {
                payload.claimed_by_rta_id = claimedRta
                payload.claimed_by_name = claimedName
            }
            try {
                await supabase
                    .from("department_handoffs")
                    .update(payload)
                    .eq("id", memo.id)
            } catch {
                // Keep optimistic update
            }
        }
    }

    const memosSentToDept = memos.filter((m) =>
        isMemoSentToDepartment(m.targetDepartment, user.permissionGroup)
    )

    const memosSentByDept = memos.filter(
        (m) =>
            m.createdByRtaId.toLowerCase() === user.rtaId.toLowerCase() ||
            (user.name &&
                m.createdByName.toLowerCase() === user.name.toLowerCase())
    )

    const getBadgeStyle = (status: string): React.CSSProperties => {
        if (status === "completed") {
            return {
                backgroundColor: "rgba(105, 105, 105, 0.14)",
                color: greyColor,
            }
        }
        if (status === "in_progress") {
            return {
                backgroundColor: "rgba(3, 78, 175, 0.12)",
                color: blueColor,
            }
        }
        return {
            background: gradientBar,
            color: "#FFFFFF",
        }
    }

    const renderMemoCard = (memo: DeptMemo) => (
        <article
            key={memo.id}
            style={{
                borderRadius: "18px",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(0, 2, 1, 0.1)",
                overflow: "hidden",
                opacity: memo.status === "completed" ? 0.72 : 1,
            }}
        >
            {memo.status === "open" && (
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
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                ...getBadgeStyle(memo.status),
                            }}
                        >
                            {statusBadgeLabel(memo.status)}
                        </span>
                        <span
                            style={{
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(0, 2, 1, 0.06)",
                                color: blackColor,
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        >
                            To: {targetDeptLabel(memo.targetDepartment)}
                        </span>
                    </div>

                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: greyColor,
                        }}
                    >
                        {memo.createdAt}
                    </span>
                </div>

                <h3
                    style={{
                        margin: "0 0 6px",
                        fontSize: "16.5px",
                        fontWeight: 800,
                        letterSpacing: "-0.015em",
                        color: blackColor,
                    }}
                >
                    {memo.title}
                </h3>

                <p
                    style={{
                        margin: "0 0 12px",
                        fontSize: "13.5px",
                        lineHeight: 1.5,
                        color: greyColor,
                        whiteSpace: "pre-line",
                    }}
                >
                    {memo.brief}
                </p>

                <div
                    style={{
                        paddingTop: "10px",
                        borderTop: "1px solid rgba(0, 2, 1, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        flexWrap: "wrap",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: blackColor,
                    }}
                >
                    <span>
                        From {memo.createdByRtaId}
                        {memo.claimedByRtaId ? (
                            <span style={{ color: greyColor }}>
                                {" "}
                                · Picked up by {memo.claimedByRtaId}
                            </span>
                        ) : null}
                    </span>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        {memo.status === "open" && (
                            <button
                                type="button"
                                onClick={() =>
                                    handleUpdateStatus(memo, "in_progress")
                                }
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    padding: 0,
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    color: blueColor,
                                    cursor: "pointer",
                                }}
                            >
                                Pick Up
                            </button>
                        )}

                        {memo.status !== "completed" && (
                            <button
                                type="button"
                                onClick={() =>
                                    handleUpdateStatus(memo, "completed")
                                }
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    padding: 0,
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    color: redColor,
                                    cursor: "pointer",
                                }}
                            >
                                Mark Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )

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
                    {composerOpen ? "Cancel" : "+ New Memo"}
                </button>
            </div>

            {/* Header Card (Matching Team Briefings) */}
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
                        Cross-Team · Inter-Dept Memos
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
                        Department Memos
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "13px",
                            lineHeight: 1.45,
                            color: "rgba(255, 255, 255, 0.72)",
                        }}
                    >
                        Memos sent to your department and memos sent out by you.
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

            {/* Composer */}
            {composerOpen && (
                <form
                    onSubmit={handleCreateMemo}
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
                        Post Inter-Department Memo
                    </div>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Memo headline / task title"
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

                    <div style={{ marginBottom: "10px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: greyColor,
                                marginBottom: "5px",
                            }}
                        >
                            Target Department
                        </label>
                        <select
                            value={targetDept}
                            onChange={(e) =>
                                setTargetDept(e.target.value as MemoTargetDept)
                            }
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "11px",
                                border: "1px solid rgba(0, 2, 1, 0.14)",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: blackColor,
                                backgroundColor: "#FFFFFF",
                                boxSizing: "border-box",
                            }}
                        >
                            {TARGET_DEPT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        rows={4}
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        placeholder="Add key details, deadlines, or what the other department needs..."
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
                        {submitting ? "Sending..." : "Send Department Memo"}
                    </button>
                </form>
            )}

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
                    Loading department memos...
                </div>
            ) : (
                <>
                    {/* Section 1: Memos Sent to Your Department */}
                    <section style={{ marginBottom: "20px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0 4px 10px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "11.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    color: blackColor,
                                }}
                            >
                                Memos Sent to Your Dept
                            </h2>
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: greyColor,
                                }}
                            >
                                {memosSentToDept.length}
                            </span>
                        </div>

                        {memosSentToDept.length === 0 ? (
                            <div
                                style={{
                                    padding: "16px 18px",
                                    borderRadius: "16px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.08)",
                                    fontSize: "13px",
                                    color: greyColor,
                                }}
                            >
                                No memos sent to your department yet.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "11px",
                                }}
                            >
                                {memosSentToDept.map(renderMemoCard)}
                            </div>
                        )}
                    </section>

                    {/* Section 2: Memos Sent by You */}
                    <section>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0 4px 10px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "11.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    color: greyColor,
                                }}
                            >
                                Memos Sent by You
                            </h2>
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: greyColor,
                                }}
                            >
                                {memosSentByDept.length}
                            </span>
                        </div>

                        {memosSentByDept.length === 0 ? (
                            <div
                                style={{
                                    padding: "16px 18px",
                                    borderRadius: "16px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.08)",
                                    fontSize: "13px",
                                    color: greyColor,
                                }}
                            >
                                You haven’t sent any department memos yet.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "11px",
                                }}
                            >
                                {memosSentByDept.map(renderMemoCard)}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
