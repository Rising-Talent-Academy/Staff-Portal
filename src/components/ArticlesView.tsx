import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { StaffProfile } from "./DashboardScreen"

export type ArticleStatus =
    | "draft"
    | "pending_review"
    | "approved"
    | "scheduled"
    | "rejected"

export interface ArticleRecord {
    id: string
    created_at: string
    updated_at: string
    author_id: string | null
    author_name: string
    author_rta_id: string
    title: string
    description: string
    photo_url: string | null
    article_body: string
    credits: string
    status: ArticleStatus
    rejection_reason?: string
    scheduled_for?: string | null
}

interface ArticlesViewProps {
    user: StaffProfile
    onBack: () => void
    initialMode?: "queue" | "submit" | "approvals"
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

const STATUS_LABELS: Record<ArticleStatus, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    approved: "Approved",
    scheduled: "Scheduled",
    rejected: "Rejected",
}

export function ArticlesView({
    user,
    onBack,
    initialMode = "queue",
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: ArticlesViewProps) {
    const [articles, setArticles] = useState<ArticleRecord[]>([])
    const [loading, setLoading] = useState(true)

    const [approvalDept, setApprovalDept] = useState<
        "journalism" | "content"
    >("journalism")

    // Review & workflow action states (admin)
    const [reviewingArticle, setReviewingArticle] =
        useState<ArticleRecord | null>(null)
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [schedulingId, setSchedulingId] = useState<string | null>(null)
    const [scheduleDateTime, setScheduleDateTime] = useState("")
    const [actionBusyId, setActionBusyId] = useState<string | null>(null)

    // Submission / edit form state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [articleBody, setArticleBody] = useState("")
    const [credits, setCredits] = useState("")
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    const isLeadership = user.permissionGroup === "leadership"

    const resetForm = () => {
        setEditingId(null)
        setTitle("")
        setDescription("")
        setArticleBody("")
        setCredits("")
        setPhotoUrl(null)
        setPhotoFile(null)
        setErrorMsg("")
    }

    const loadArticles = async () => {
        if (!supabase) {
            setLoading(false)
            return
        }
        setLoading(true)

        let query = supabase
            .from("articles")
            .select("*")
            .order("updated_at", { ascending: false })

        if (initialMode === "queue") {
            const { data: sessionData } = await supabase.auth.getSession()
            const authUserId = sessionData.session?.user?.id
            if (authUserId) {
                query = query.eq("author_id", authUserId)
            } else {
                query = query.eq("author_rta_id", user.rtaId)
            }
        }

        const { data, error } = await query
        if (!error && Array.isArray(data)) {
            setArticles(data as ArticleRecord[])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadArticles()
    }, [initialMode])

    const startEditing = (item: ArticleRecord) => {
        setEditingId(item.id)
        setTitle(item.title)
        setDescription(item.description)
        setArticleBody(item.article_body)
        setCredits(item.credits)
        setPhotoUrl(item.photo_url)
        setPhotoFile(null)
        setErrorMsg("")
        setSuccessMsg("")
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const uploadPhotoIfNeeded = async (): Promise<string | null> => {
        if (!photoFile) return photoUrl
        if (!supabase) return photoUrl

        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg"
        const safeName = `${user.rtaId.toLowerCase()}-${Date.now()}.${ext}`
        const filePath = `articles/${safeName}`

        const { error: uploadError } = await supabase.storage
            .from("portal-media")
            .upload(filePath, photoFile, {
                cacheControl: "3600",
                upsert: false,
            })

        if (uploadError) {
            throw new Error(uploadError.message || "Photo upload failed.")
        }

        const { data: publicUrlData } = supabase.storage
            .from("portal-media")
            .getPublicUrl(filePath)

        return publicUrlData.publicUrl
    }

    const resolveNextStatus = (
        intent: "draft" | "submit" | "approve",
        currentStatus?: ArticleStatus
    ): ArticleStatus => {
        if (intent === "approve") return "approved"
        if (intent === "submit") return "pending_review"
        if (
            (currentStatus === "approved" || currentStatus === "scheduled") &&
            isLeadership
        ) {
            return currentStatus
        }
        return "draft"
    }

    const handleSaveArticle = async (
        intent: "draft" | "submit" | "approve"
    ) => {
        setErrorMsg("")
        setSuccessMsg("")

        if (!title.trim()) {
            setErrorMsg("Please add an article title.")
            return
        }
        if (intent !== "draft" && !articleBody.trim()) {
            setErrorMsg(
                "Please add the article text before submitting for review."
            )
            return
        }
        if (!supabase) {
            setErrorMsg("Database connection is unavailable.")
            return
        }

        setSaving(true)
        try {
            const uploadedUrl = await uploadPhotoIfNeeded()
            const existingItem = editingId
                ? articles.find((a) => a.id === editingId)
                : undefined
            const nextStatus = resolveNextStatus(intent, existingItem?.status)

            if (editingId) {
                const { error: updateError } = await supabase
                    .from("articles")
                    .update({
                        title: title.trim(),
                        description: description.trim(),
                        photo_url: uploadedUrl,
                        article_body: articleBody.trim(),
                        credits: credits.trim(),
                        status: nextStatus,
                        rejection_reason:
                            nextStatus === "pending_review"
                                ? ""
                                : existingItem?.rejection_reason ?? "",
                    })
                    .eq("id", editingId)

                if (updateError) {
                    setErrorMsg(
                        updateError.message || "Could not update article."
                    )
                    return
                }

                setSuccessMsg(
                    `Saved — status is now ${STATUS_LABELS[nextStatus]}.`
                )
                setEditingId(null)
            } else {
                const { data: sessionData } = await supabase.auth.getSession()
                const authUserId = sessionData.session?.user?.id ?? null

                const { error: insertError } = await supabase
                    .from("articles")
                    .insert({
                        author_id: authUserId,
                        author_name: user.name,
                        author_rta_id: user.rtaId,
                        title: title.trim(),
                        description: description.trim(),
                        photo_url: uploadedUrl,
                        article_body: articleBody.trim(),
                        credits: credits.trim(),
                        status: nextStatus,
                    })

                if (insertError) {
                    setErrorMsg(
                        insertError.message || "Could not submit article."
                    )
                    return
                }

                setSuccessMsg(
                    `Article sent — status is now ${STATUS_LABELS[nextStatus]}.`
                )
                resetForm()
            }

            await loadArticles()
        } catch (err) {
            setErrorMsg(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while saving."
            )
        } finally {
            setSaving(false)
        }
    }

    const handleApproveArticle = async (id: string) => {
        if (!supabase) return
        setActionBusyId(id)
        setErrorMsg("")
        const { error } = await supabase
            .from("articles")
            .update({ status: "approved", rejection_reason: "" })
            .eq("id", id)

        setActionBusyId(null)
        if (!error) {
            setSuccessMsg("Approved — status updated to Approved.")
            await loadArticles()
        } else {
            setErrorMsg(error.message || "Could not approve article.")
        }
    }

    const openRejectBox = (item: ArticleRecord) => {
        setSchedulingId(null)
        setRejectingId(item.id)
        setRejectReason(item.rejection_reason || "")
        setErrorMsg("")
    }

    const handleConfirmReject = async (id: string) => {
        if (!supabase) return
        if (!rejectReason.trim()) {
            setErrorMsg("Please enter a reason why this article is rejected.")
            return
        }

        setActionBusyId(id)
        setErrorMsg("")
        const { error } = await supabase
            .from("articles")
            .update({
                status: "rejected",
                rejection_reason: rejectReason.trim(),
            })
            .eq("id", id)

        setActionBusyId(null)
        if (!error) {
            setRejectingId(null)
            setRejectReason("")
            setSuccessMsg("Rejected — reason saved for the writer.")
            await loadArticles()
        } else {
            setErrorMsg(error.message || "Could not reject article.")
        }
    }

    const openScheduleBox = (item: ArticleRecord) => {
        setRejectingId(null)
        setSchedulingId(item.id)
        if (item.scheduled_for) {
            const localIso = new Date(item.scheduled_for)
                .toISOString()
                .slice(0, 16)
            setScheduleDateTime(localIso)
        } else {
            setScheduleDateTime("")
        }
        setErrorMsg("")
    }

    const handleConfirmSchedule = async (id: string) => {
        if (!supabase) return
        if (!scheduleDateTime) {
            setErrorMsg("Please pick a date and time to schedule.")
            return
        }

        setActionBusyId(id)
        setErrorMsg("")
        const isoDate = new Date(scheduleDateTime).toISOString()

        const { error } = await supabase
            .from("articles")
            .update({
                status: "scheduled",
                scheduled_for: isoDate,
                rejection_reason: "",
            })
            .eq("id", id)

        setActionBusyId(null)
        if (!error) {
            setSchedulingId(null)
            setScheduleDateTime("")
            setSuccessMsg(
                "Scheduled — ready for Squarespace publish sync."
            )
            await loadArticles()
        } else {
            setErrorMsg(error.message || "Could not schedule article.")
        }
    }

    const getStatusBadgeStyle = (
        status: ArticleStatus
    ): React.CSSProperties => {
        if (status === "approved" || status === "scheduled") {
            return {
                backgroundColor: "rgba(3, 78, 175, 0.12)",
                color: blueColor,
                border: "1px solid rgba(3, 78, 175, 0.28)",
            }
        }
        if (status === "pending_review" || status === "rejected") {
            return {
                backgroundColor: "rgba(250, 52, 37, 0.12)",
                color: redColor,
                border: "1px solid rgba(250, 52, 37, 0.28)",
            }
        }
        return {
            backgroundColor: "rgba(0, 2, 1, 0.06)",
            color: greyColor,
            border: "1px solid rgba(0, 2, 1, 0.12)",
        }
    }

    const headingLabel =
        initialMode === "approvals"
            ? "Editorial & Content Approvals"
            : initialMode === "submit"
              ? "Submit Article"
              : "Article Queue"

    const renderFormCard = (formTitle: string, showApproveButton: boolean) => (
        <div
            style={{
                border: "1px solid rgba(0, 2, 1, 0.12)",
                borderRadius: "16px",
                padding: "20px",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 8px 22px rgba(0, 2, 1, 0.04)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "14px",
                    flexWrap: "wrap",
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 700,
                        color: blackColor,
                    }}
                >
                    {editingId ? "Edit Article" : formTitle}
                </h3>

                {editingId && (
                    <button
                        type="button"
                        onClick={resetForm}
                        style={{
                            border: "1px solid rgba(0, 2, 1, 0.15)",
                            backgroundColor: "#F9FAFC",
                            color: blackColor,
                            borderRadius: "8px",
                            padding: "6px 11px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Cancel Edit
                    </button>
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                }}
            >
                <div>
                    <label
                        htmlFor="article-title"
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: greyColor,
                            marginBottom: "6px",
                        }}
                    >
                        Title
                    </label>
                    <input
                        id="article-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Article headline"
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 12px",
                            borderRadius: "10px",
                            border: "1px solid rgba(0, 2, 1, 0.16)",
                            fontSize: "14px",
                            color: blackColor,
                        }}
                    />
                </div>

                <div>
                    <label
                        htmlFor="article-description"
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: greyColor,
                            marginBottom: "6px",
                        }}
                    >
                        Description
                    </label>
                    <input
                        id="article-description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short summary of the article"
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 12px",
                            borderRadius: "10px",
                            border: "1px solid rgba(0, 2, 1, 0.16)",
                            fontSize: "14px",
                            color: blackColor,
                        }}
                    />
                </div>

                <div>
                    <label
                        htmlFor="article-photo"
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: greyColor,
                            marginBottom: "6px",
                        }}
                    >
                        Photo
                    </label>
                    <input
                        id="article-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setPhotoFile(file)
                            if (file) {
                                setPhotoUrl(URL.createObjectURL(file))
                            }
                        }}
                        style={{
                            width: "100%",
                            fontSize: "13px",
                            color: blackColor,
                        }}
                    />
                    {photoUrl && (
                        <img
                            src={photoUrl}
                            alt="Article preview"
                            style={{
                                marginTop: "10px",
                                maxWidth: "100%",
                                maxHeight: "200px",
                                borderRadius: "10px",
                                objectFit: "cover",
                                border: "1px solid rgba(0, 2, 1, 0.1)",
                            }}
                        />
                    )}
                </div>

                <div>
                    <label
                        htmlFor="article-body"
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: greyColor,
                            marginBottom: "6px",
                        }}
                    >
                        Article
                    </label>
                    <textarea
                        id="article-body"
                        rows={6}
                        value={articleBody}
                        onChange={(e) => setArticleBody(e.target.value)}
                        placeholder="Write or paste the full article here..."
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 12px",
                            borderRadius: "10px",
                            border: "1px solid rgba(0, 2, 1, 0.16)",
                            fontSize: "14px",
                            lineHeight: 1.55,
                            color: blackColor,
                            resize: "vertical",
                            fontFamily: "inherit",
                        }}
                    />
                </div>

                <div>
                    <label
                        htmlFor="article-credits"
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: greyColor,
                            marginBottom: "6px",
                        }}
                    >
                        Credits
                    </label>
                    <input
                        id="article-credits"
                        type="text"
                        value={credits}
                        onChange={(e) => setCredits(e.target.value)}
                        placeholder="e.g., Written by..."
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 12px",
                            borderRadius: "10px",
                            border: "1px solid rgba(0, 2, 1, 0.16)",
                            fontSize: "14px",
                            color: blackColor,
                        }}
                    />
                </div>

                {errorMsg && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: redColor,
                        }}
                    >
                        {errorMsg}
                    </p>
                )}

                {successMsg && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 700,
                            color: blueColor,
                        }}
                    >
                        {successMsg}
                    </p>
                )}

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        paddingTop: "4px",
                    }}
                >
                    {initialMode === "submit" && !editingId ? (
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleSaveArticle("submit")}
                            style={{
                                padding: "12px 18px",
                                borderRadius: "10px",
                                border: "none",
                                backgroundColor: blueColor,
                                color: "#FFFFFF",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: saving ? "not-allowed" : "pointer",
                            }}
                        >
                            {saving ? "Submitting..." : "Submit Article"}
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleSaveArticle("draft")}
                                style={{
                                    padding: "11px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(0, 2, 1, 0.18)",
                                    backgroundColor: "#FFFFFF",
                                    color: blackColor,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: saving ? "not-allowed" : "pointer",
                                }}
                            >
                                {saving ? "Saving..." : "Save Draft"}
                            </button>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleSaveArticle("submit")}
                                style={{
                                    padding: "11px 16px",
                                    borderRadius: "10px",
                                    border: "none",
                                    backgroundColor: blueColor,
                                    color: "#FFFFFF",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: saving ? "not-allowed" : "pointer",
                                }}
                            >
                                {saving ? "Saving..." : "Submit for Review"}
                            </button>

                            {showApproveButton && (
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleSaveArticle("approve")}
                                    style={{
                                        padding: "11px 16px",
                                        borderRadius: "10px",
                                        border: "none",
                                        backgroundColor: blackColor,
                                        color: "#FFFFFF",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        cursor: saving
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                >
                                    {saving ? "Saving..." : "Save & Approve"}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div
            style={{
                maxWidth: "760px",
                width: "100%",
                margin: "0 auto",
                padding: "20px 18px 44px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "22px",
            }}
        >
            {/* Top Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: redColor,
                        }}
                    >
                        {initialMode === "approvals"
                            ? "Admin & Approvals"
                            : "Editorial Desk"}
                    </p>
                    <h2
                        style={{
                            margin: "4px 0 0",
                            fontSize: "22px",
                            fontWeight: 800,
                            color: blackColor,
                        }}
                    >
                        {headingLabel}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        padding: "9px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 2, 1, 0.16)",
                        backgroundColor: "#FFFFFF",
                        color: blackColor,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Back to Portal
                </button>
            </div>

            {/* MODE 1: SUBMIT ARTICLE ONLY */}
            {initialMode === "submit" &&
                renderFormCard("Submit New Article", false)}

            {/* MODE 2: ARTICLE QUEUE */}
            {initialMode === "queue" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {editingId && renderFormCard("Edit Article", false)}

                    {successMsg && !editingId && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 700,
                                color: blueColor,
                            }}
                        >
                            {successMsg}
                        </p>
                    )}

                    {loading ? (
                        <p style={{ color: greyColor, fontSize: "14px" }}>
                            Loading your articles...
                        </p>
                    ) : articles.length === 0 ? (
                        <div
                            style={{
                                border: "1px solid rgba(0, 2, 1, 0.1)",
                                borderRadius: "14px",
                                padding: "18px",
                                backgroundColor: "#FFFFFF",
                                color: greyColor,
                                fontSize: "14px",
                            }}
                        >
                            You haven&apos;t submitted any articles yet. Use{" "}
                            <strong>Submit Article</strong> from the portal to
                            send one in.
                        </div>
                    ) : (
                        articles.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    border: "1px solid rgba(0, 2, 1, 0.12)",
                                    borderRadius: "14px",
                                    padding: "18px",
                                    backgroundColor: "#FFFFFF",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            ...getStatusBadgeStyle(item.status),
                                        }}
                                    >
                                        {STATUS_LABELS[item.status]}
                                    </span>

                                    <span
                                        style={{
                                            fontSize: "12px",
                                            color: greyColor,
                                        }}
                                    >
                                        {item.author_rta_id}
                                    </span>
                                </div>

                                <h4
                                    style={{
                                        margin: 0,
                                        fontSize: "17px",
                                        fontWeight: 700,
                                        color: blackColor,
                                    }}
                                >
                                    {item.title}
                                </h4>

                                {item.description && (
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "13px",
                                            color: greyColor,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {item.description}
                                    </p>
                                )}

                                {item.status === "rejected" &&
                                    item.rejection_reason && (
                                        <div
                                            style={{
                                                padding: "10px 12px",
                                                borderRadius: "10px",
                                                backgroundColor:
                                                    "rgba(250, 52, 37, 0.08)",
                                                border:
                                                    "1px solid rgba(250, 52, 37, 0.25)",
                                                fontSize: "13px",
                                                color: blackColor,
                                            }}
                                        >
                                            <strong style={{ color: redColor }}>
                                                Reason for rejection:{" "}
                                            </strong>
                                            {item.rejection_reason}
                                        </div>
                                    )}

                                {item.status === "scheduled" &&
                                    item.scheduled_for && (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: blueColor,
                                            }}
                                        >
                                            Scheduled for:{" "}
                                            {new Date(
                                                item.scheduled_for
                                            ).toLocaleString()}
                                        </p>
                                    )}

                                {item.photo_url && (
                                    <img
                                        src={item.photo_url}
                                        alt={item.title}
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "220px",
                                            borderRadius: "10px",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}

                                {item.article_body && (
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            color: blackColor,
                                            lineHeight: 1.6,
                                            whiteSpace: "pre-line",
                                        }}
                                    >
                                        {item.article_body}
                                    </p>
                                )}

                                {item.credits && (
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: greyColor,
                                        }}
                                    >
                                        Credits: {item.credits}
                                    </p>
                                )}

                                <div>
                                    <button
                                        type="button"
                                        onClick={() => startEditing(item)}
                                        style={{
                                            padding: "8px 13px",
                                            borderRadius: "8px",
                                            border:
                                                "1px solid rgba(0, 2, 1, 0.16)",
                                            backgroundColor: "#FFFFFF",
                                            color: blackColor,
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Edit Article
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODE 3: EDITORIAL & CONTENT APPROVALS */}
            {initialMode === "approvals" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setApprovalDept("journalism")}
                            style={{
                                padding: "12px 14px",
                                borderRadius: "12px",
                                border:
                                    approvalDept === "journalism"
                                        ? "none"
                                        : "1px solid rgba(0, 2, 1, 0.14)",
                                backgroundColor:
                                    approvalDept === "journalism"
                                        ? redColor
                                        : "#FFFFFF",
                                color:
                                    approvalDept === "journalism"
                                        ? "#FFFFFF"
                                        : blackColor,
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Journalism
                        </button>

                        <button
                            type="button"
                            onClick={() => setApprovalDept("content")}
                            style={{
                                padding: "12px 14px",
                                borderRadius: "12px",
                                border:
                                    approvalDept === "content"
                                        ? "none"
                                        : "1px solid rgba(0, 2, 1, 0.14)",
                                backgroundColor:
                                    approvalDept === "content"
                                        ? blueColor
                                        : "#FFFFFF",
                                color:
                                    approvalDept === "content"
                                        ? "#FFFFFF"
                                        : blackColor,
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Content Creation
                        </button>
                    </div>

                    {errorMsg && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 600,
                                color: redColor,
                            }}
                        >
                            {errorMsg}
                        </p>
                    )}

                    {successMsg && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 700,
                                color: blueColor,
                            }}
                        >
                            {successMsg}
                        </p>
                    )}

                    {approvalDept === "journalism" ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                            }}
                        >
                            {editingId &&
                                renderFormCard(
                                    "Edit Journalism Submission",
                                    isLeadership
                                )}

                            {loading ? (
                                <p style={{ color: greyColor, fontSize: "14px" }}>
                                    Loading journalism submissions...
                                </p>
                            ) : articles.length === 0 ? (
                                <div
                                    style={{
                                        border: "1px solid rgba(0, 2, 1, 0.1)",
                                        borderRadius: "14px",
                                        padding: "18px",
                                        backgroundColor: "#FFFFFF",
                                        color: greyColor,
                                        fontSize: "14px",
                                    }}
                                >
                                    No journalism submissions yet.
                                </div>
                            ) : (
                                articles.map((item) => {
                                    const isRejectOpen = rejectingId === item.id
                                    const isScheduleOpen =
                                        schedulingId === item.id
                                    const isBusy = actionBusyId === item.id

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                border:
                                                    "1px solid rgba(0, 2, 1, 0.12)",
                                                borderRadius: "14px",
                                                padding: "18px",
                                                backgroundColor: "#FFFFFF",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "10px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: "10px",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "999px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        ...getStatusBadgeStyle(
                                                            item.status
                                                        ),
                                                    }}
                                                >
                                                    {STATUS_LABELS[item.status]}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        color: greyColor,
                                                    }}
                                                >
                                                    {item.author_name} (
                                                    {item.author_rta_id})
                                                </span>
                                            </div>

                                            <h4
                                                style={{
                                                    margin: 0,
                                                    fontSize: "17px",
                                                    fontWeight: 700,
                                                    color: blackColor,
                                                }}
                                            >
                                                {item.title}
                                            </h4>

                                            {item.description && (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "13px",
                                                        color: greyColor,
                                                        lineHeight: 1.45,
                                                    }}
                                                >
                                                    {item.description}
                                                </p>
                                            )}

                                            {item.scheduled_for && (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: blueColor,
                                                    }}
                                                >
                                                    Scheduled:{" "}
                                                    {new Date(
                                                        item.scheduled_for
                                                    ).toLocaleString()}
                                                </p>
                                            )}

                                            {item.rejection_reason && (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: redColor,
                                                    }}
                                                >
                                                    Rejection reason:{" "}
                                                    {item.rejection_reason}
                                                </p>
                                            )}

                                            {item.credits && (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: greyColor,
                                                    }}
                                                >
                                                    Credits: {item.credits}
                                                </p>
                                            )}

                                            {/* Admin Action Buttons */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    flexWrap: "wrap",
                                                    paddingTop: "4px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setReviewingArticle(item)
                                                    }
                                                    style={{
                                                        padding: "8px 13px",
                                                        borderRadius: "8px",
                                                        border:
                                                            "1px solid rgba(0, 2, 1, 0.16)",
                                                        backgroundColor:
                                                            "#F9FAFC",
                                                        color: blackColor,
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Review
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEditing(item)
                                                    }
                                                    style={{
                                                        padding: "8px 13px",
                                                        borderRadius: "8px",
                                                        border:
                                                            "1px solid rgba(0, 2, 1, 0.16)",
                                                        backgroundColor:
                                                            "#FFFFFF",
                                                        color: blackColor,
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Edit
                                                </button>

                                                {isLeadership && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                openScheduleBox(
                                                                    item
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 13px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "1px solid rgba(3, 78, 175, 0.3)",
                                                                backgroundColor:
                                                                    "rgba(3, 78, 175, 0.08)",
                                                                color:
                                                                    blueColor,
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 700,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Schedule
                                                        </button>

                                                        {item.status !==
                                                            "approved" && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isBusy
                                                                }
                                                                onClick={() =>
                                                                    handleApproveArticle(
                                                                        item.id
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "8px 13px",
                                                                    borderRadius:
                                                                        "8px",
                                                                    border:
                                                                        "none",
                                                                    backgroundColor:
                                                                        blueColor,
                                                                    color:
                                                                        "#FFFFFF",
                                                                    fontSize:
                                                                        "12px",
                                                                    fontWeight: 700,
                                                                    cursor:
                                                                        "pointer",
                                                                }}
                                                            >
                                                                Approve
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                openRejectBox(
                                                                    item
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 13px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "none",
                                                                backgroundColor:
                                                                    redColor,
                                                                color:
                                                                    "#FFFFFF",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 700,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Reject Reason Box */}
                                            {isRejectOpen && (
                                                <div
                                                    style={{
                                                        marginTop: "6px",
                                                        padding: "14px",
                                                        borderRadius: "12px",
                                                        backgroundColor:
                                                            "rgba(250, 52, 37, 0.05)",
                                                        border:
                                                            "1px solid rgba(250, 52, 37, 0.28)",
                                                        display: "flex",
                                                        flexDirection:
                                                            "column",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <label
                                                        htmlFor={`reject-reason-${item.id}`}
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: 700,
                                                            color: redColor,
                                                        }}
                                                    >
                                                        Reason why this is
                                                        rejected
                                                    </label>
                                                    <textarea
                                                        id={`reject-reason-${item.id}`}
                                                        rows={3}
                                                        value={rejectReason}
                                                        onChange={(e) =>
                                                            setRejectReason(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Write what needs fixing or why it wasn't approved..."
                                                        style={{
                                                            width: "100%",
                                                            boxSizing:
                                                                "border-box",
                                                            padding:
                                                                "10px 12px",
                                                            borderRadius:
                                                                "8px",
                                                            border:
                                                                "1px solid rgba(0, 2, 1, 0.16)",
                                                            fontSize: "13px",
                                                            fontFamily:
                                                                "inherit",
                                                            backgroundColor:
                                                                "#FFFFFF",
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                handleConfirmReject(
                                                                    item.id
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 14px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "none",
                                                                backgroundColor:
                                                                    redColor,
                                                                color:
                                                                    "#FFFFFF",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 700,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Confirm Reject
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRejectingId(
                                                                    null
                                                                )
                                                                setRejectReason(
                                                                    ""
                                                                )
                                                            }}
                                                            style={{
                                                                padding:
                                                                    "8px 12px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "1px solid rgba(0, 2, 1, 0.15)",
                                                                backgroundColor:
                                                                    "#FFFFFF",
                                                                color:
                                                                    blackColor,
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 600,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Schedule Date/Time Box (Squarespace sync hook) */}
                                            {isScheduleOpen && (
                                                <div
                                                    style={{
                                                        marginTop: "6px",
                                                        padding: "14px",
                                                        borderRadius: "12px",
                                                        backgroundColor:
                                                            "rgba(3, 78, 175, 0.05)",
                                                        border:
                                                            "1px solid rgba(3, 78, 175, 0.25)",
                                                        display: "flex",
                                                        flexDirection:
                                                            "column",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <label
                                                        htmlFor={`schedule-dt-${item.id}`}
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: 700,
                                                            color: blueColor,
                                                        }}
                                                    >
                                                        Schedule publish date &
                                                        time (Squarespace queue)
                                                    </label>
                                                    <input
                                                        id={`schedule-dt-${item.id}`}
                                                        type="datetime-local"
                                                        value={scheduleDateTime}
                                                        onChange={(e) =>
                                                            setScheduleDateTime(
                                                                e.target.value
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "9px 12px",
                                                            borderRadius:
                                                                "8px",
                                                            border:
                                                                "1px solid rgba(0, 2, 1, 0.16)",
                                                            fontSize: "13px",
                                                            backgroundColor:
                                                                "#FFFFFF",
                                                            maxWidth: "260px",
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                handleConfirmSchedule(
                                                                    item.id
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 14px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "none",
                                                                backgroundColor:
                                                                    blueColor,
                                                                color:
                                                                    "#FFFFFF",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 700,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Save Schedule
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSchedulingId(
                                                                    null
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 12px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "1px solid rgba(0, 2, 1, 0.15)",
                                                                backgroundColor:
                                                                    "#FFFFFF",
                                                                color:
                                                                    blackColor,
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 600,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    ) : (
                        <div
                            style={{
                                border: "1px solid rgba(0, 2, 1, 0.12)",
                                borderRadius: "14px",
                                padding: "20px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 6px",
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    color: blackColor,
                                }}
                            >
                                Content Creation Approvals
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: greyColor,
                                    lineHeight: 1.5,
                                }}
                            >
                                Video clips, reels, graphics, and social edits
                                awaiting review will appear here once content
                                submissions are connected.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Full Article Review Modal */}
            {reviewingArticle && (
                <div
                    onClick={() => setReviewingArticle(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 2, 1, 0.58)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                        zIndex: 40,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "620px",
                            maxHeight: "85dvh",
                            overflowY: "auto",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "18px",
                            padding: "22px",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                            }}
                        >
                            <span
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    ...getStatusBadgeStyle(
                                        reviewingArticle.status
                                    ),
                                }}
                            >
                                {STATUS_LABELS[reviewingArticle.status]}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReviewingArticle(null)}
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

                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: 800,
                                color: blackColor,
                            }}
                        >
                            {reviewingArticle.title}
                        </h3>

                        <p
                            style={{
                                margin: 0,
                                fontSize: "12px",
                                color: greyColor,
                            }}
                        >
                            By {reviewingArticle.author_name} (
                            {reviewingArticle.author_rta_id})
                        </p>

                        {reviewingArticle.description && (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: blackColor,
                                }}
                            >
                                {reviewingArticle.description}
                            </p>
                        )}

                        {reviewingArticle.photo_url && (
                            <img
                                src={reviewingArticle.photo_url}
                                alt={reviewingArticle.title}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "260px",
                                    borderRadius: "12px",
                                    objectFit: "cover",
                                }}
                            />
                        )}

                        <div
                            style={{
                                fontSize: "14px",
                                lineHeight: 1.65,
                                color: blackColor,
                                whiteSpace: "pre-line",
                            }}
                        >
                            {reviewingArticle.article_body}
                        </div>

                        {reviewingArticle.credits && (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: greyColor,
                                }}
                            >
                                Credits: {reviewingArticle.credits}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
