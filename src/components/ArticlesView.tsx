import React, { useEffect, useState } from "react"
import type { StaffProfile } from "./DashboardScreen"
import {
    CLOUD_ASSETS_STORAGE_KEY,
    loadCloudAssets,
    saveCloudAssets,
    type AssetStatus,
    type CloudAsset,
} from "./UploadAssetsView"

export type ArticlesViewMode = "queue" | "submit" | "approvals"

export interface ArticleSubmission {
    id: string
    title: string
    summary: string
    body: string
    photoUrl?: string
    credits: string
    author: string
    authorRtaId: string
    submittedDate: string
    status: "In Review" | "Approved" | "Needs Tweaks"
    reviewFeedback?: string
}

interface ArticlesViewProps {
    user: StaffProfile
    initialMode?: ArticlesViewMode
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

const ARTICLES_STORAGE_KEY = "rta_staff_portal_articles_v1"

const INITIAL_ARTICLES: ArticleSubmission[] = []

function formatDateUK(date = new Date()): string {
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const yyyy = date.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}

function loadArticles(): ArticleSubmission[] {
    try {
        const raw = localStorage.getItem(ARTICLES_STORAGE_KEY)
        if (!raw) return INITIAL_ARTICLES
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return INITIAL_ARTICLES
        // Filter out the old hardcoded sample IDs if still cached in localStorage
        return parsed.filter(
            (item: ArticleSubmission) => item.id !== "art-1" && item.id !== "art-2"
        )
    } catch {
        return INITIAL_ARTICLES
    }
}

function saveArticles(items: ArticleSubmission[]): void {
    try {
        localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(items))
    } catch {
        // Ignore storage errors
    }
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({
    user,
    initialMode = "queue",
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}) => {
    const canApprove = user.permissionGroup === "leadership"

    const [mode, setMode] = useState<ArticlesViewMode>(() =>
        initialMode === "approvals" && !canApprove ? "queue" : initialMode
    )
    const [approvalTab, setApprovalTab] = useState<"journalism" | "content">(
        "content"
    )
    const [assetStatusFilter, setAssetStatusFilter] = useState<
        "All" | AssetStatus
    >("In Review")

    const [articles, setArticles] = useState<ArticleSubmission[]>(() =>
        loadArticles()
    )
    const [contentAssets, setContentAssets] = useState<CloudAsset[]>(() =>
        loadCloudAssets()
    )

    // Submit Article form state
    const [title, setTitle] = useState("")
    const [summary, setSummary] = useState("")
    const [photoUrl, setPhotoUrl] = useState("")
    const [body, setBody] = useState("")
    const [credits, setCredits] = useState(`By ${user.name}`)

    useEffect(() => {
        setMode(initialMode === "approvals" && !canApprove ? "queue" : initialMode)
    }, [initialMode, canApprove])

    useEffect(() => {
        saveArticles(articles)
    }, [articles])

    useEffect(() => {
        saveCloudAssets(contentAssets)
    }, [contentAssets])

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === CLOUD_ASSETS_STORAGE_KEY) {
                setContentAssets(loadCloudAssets())
            } else if (event.key === ARTICLES_STORAGE_KEY) {
                setArticles(loadArticles())
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [])

    const handleCreateArticle = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !body.trim()) return

        const newArticle: ArticleSubmission = {
            id: `art-${Date.now()}`,
            title: title.trim(),
            summary: summary.trim() || "Submitted for editorial review.",
            body: body.trim(),
            photoUrl: photoUrl.trim() || undefined,
            credits: credits.trim() || `By ${user.name}`,
            author: user.name,
            authorRtaId: user.rtaId,
            submittedDate: formatDateUK(),
            status: "In Review",
        }

        setArticles((prev) => [newArticle, ...prev])
        setTitle("")
        setSummary("")
        setPhotoUrl("")
        setBody("")
        setMode("queue")
    }

    const handleArticleDecision = (
        articleId: string,
        nextStatus: "Approved" | "Needs Tweaks"
    ) => {
        let feedback: string | undefined
        if (nextStatus === "Needs Tweaks") {
            const existing =
                articles.find((a) => a.id === articleId)?.reviewFeedback ?? ""
            const input = window.prompt(
                "Enter editorial tweak notes for the writer:",
                existing
            )
            if (input === null) return
            feedback = input.trim() || "Editorial tweaks requested."
        }

        setArticles((prev) =>
            prev.map((item) =>
                item.id === articleId
                    ? {
                          ...item,
                          status: nextStatus,
                          reviewFeedback:
                              nextStatus === "Needs Tweaks"
                                  ? `${feedback} (${user.name})`
                                  : undefined,
                      }
                    : item
            )
        )
    }

    const handleAssetDecision = (
        assetId: string,
        nextStatus: "Approved" | "Needs Tweaks"
    ) => {
        let feedback: string | undefined
        if (nextStatus === "Needs Tweaks") {
            const existing =
                contentAssets.find((a) => a.id === assetId)?.reviewFeedback ??
                ""
            const input = window.prompt(
                "What tweaks are needed on this content submission?",
                existing
            )
            if (input === null) return
            feedback = input.trim() || "Tweaks requested by leadership."
        }

        setContentAssets((prev) =>
            prev.map((asset) =>
                asset.id === assetId
                    ? {
                          ...asset,
                          status: nextStatus,
                          reviewFeedback:
                              nextStatus === "Needs Tweaks"
                                  ? `${feedback} (${user.name})`
                                  : undefined,
                      }
                    : asset
            )
        )
    }

    const visibleAssets =
        assetStatusFilter === "All"
            ? contentAssets
            : contentAssets.filter((a) => a.status === assetStatusFilter)

    const getStatusBadgeColor = (status: "In Review" | "Approved" | "Needs Tweaks") => {
        if (status === "Approved") return blueColor
        if (status === "Needs Tweaks") return redColor
        return greyColor
    }

    return (
        <div
            style={{
                maxWidth: "680px",
                width: "100%",
                margin: "0 auto",
                padding: "18px 18px 32px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
            }}
        >
            {/* Top Header */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${blackColor} 0%, #111827 65%, #071936 100%)`,
                    color: "#FFFFFF",
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 14px 28px rgba(0, 2, 1, 0.14)",
                }}
            >
                <div
                    style={{
                        height: "4px",
                        background: `linear-gradient(90deg, ${redColor} 0%, ${blueColor} 100%)`,
                    }}
                />
                <div
                    style={{
                        padding: "18px 20px 20px",
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
                        }}
                    >
                        <button
                            type="button"
                            onClick={onBack}
                            style={{
                                background: "rgba(255,255,255,0.12)",
                                border: "none",
                                color: "#FFFFFF",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            ← Back to Portal
                        </button>
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color:
                                    mode === "approvals" ? redColor : "#84B6FF",
                            }}
                        >
                            {mode === "approvals"
                                ? "Admin & Approvals"
                                : "Editorial Desk"}
                        </span>
                    </div>

                    <div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: 800,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {mode === "approvals"
                                ? "Editorial & Content Approvals"
                                : mode === "submit"
                                  ? "Submit Article"
                                  : "Article Queue"}
                        </h1>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.72)",
                            }}
                        >
                            {mode === "approvals"
                                ? "Review journalism copy and content creator asset links, approve items, or request tweaks"
                                : "Track article status, submit copy, or jump into approvals"}
                        </p>
                    </div>

                    {/* Top Mode Switcher */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {(
                            [
                                { id: "queue", label: "Article Queue" },
                                { id: "submit", label: "Submit Article" },
                                ...(canApprove
                                    ? [
                                          {
                                              id: "approvals",
                                              label: "Approvals",
                                          },
                                      ]
                                    : []),
                            ] as const
                        ).map((tab) => {
                            const active = mode === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setMode(tab.id)}
                                    style={{
                                        padding: "7px 13px",
                                        borderRadius: "9px",
                                        border: "none",
                                        backgroundColor: active
                                            ? "#FFFFFF"
                                            : "rgba(255,255,255,0.12)",
                                        color: active ? blackColor : "#FFFFFF",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* MODE 1: ARTICLE QUEUE */}
            {mode === "queue" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    {articles.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(0, 2, 1, 0.08)",
                                borderRadius: "16px",
                                padding: "24px",
                                textAlign: "center",
                                fontSize: "13px",
                                color: greyColor,
                            }}
                        >
                            No articles in the queue yet.
                        </div>
                    ) : (
                        articles.map((article) => (
                            <div
                                key={article.id}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(0, 2, 1, 0.08)",
                                    borderRadius: "16px",
                                    padding: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    boxShadow: "0 6px 18px rgba(0, 2, 1, 0.04)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: 800,
                                                color: blackColor,
                                            }}
                                        >
                                            {article.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: greyColor,
                                                marginTop: "2px",
                                            }}
                                        >
                                            {article.author} ({article.authorRtaId}) •{" "}
                                            {article.submittedDate}
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            backgroundColor: getStatusBadgeColor(
                                                article.status
                                            ),
                                            color: "#FFFFFF",
                                            fontSize: "11px",
                                            fontWeight: 800,
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {article.status}
                                    </span>
                                </div>

                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        color: "#374151",
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {article.summary}
                                </p>

                                {article.status === "Needs Tweaks" &&
                                    article.reviewFeedback && (
                                        <div
                                            style={{
                                                backgroundColor: "#FEF2F2",
                                                borderLeft: `3px solid ${redColor}`,
                                                padding: "9px 12px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                color: "#991B1B",
                                            }}
                                        >
                                            <strong>Tweaks requested:</strong>{" "}
                                            {article.reviewFeedback}
                                        </div>
                                    )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODE 2: SUBMIT ARTICLE */}
            {mode === "submit" && (
                <form
                    onSubmit={handleCreateArticle}
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0, 2, 1, 0.1)",
                        borderRadius: "16px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        boxShadow: "0 8px 20px rgba(0, 2, 1, 0.05)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: blackColor,
                        }}
                    >
                        New Article Submission
                    </div>

                    <input
                        type="text"
                        placeholder="Headline / Article Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            fontSize: "13px",
                        }}
                    />

                    <input
                        type="text"
                        placeholder="Short standfirst / summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            fontSize: "13px",
                        }}
                    />

                    <input
                        type="text"
                        placeholder="Lead photo URL (optional)"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            fontSize: "13px",
                        }}
                    />

                    <input
                        type="text"
                        placeholder="Credits (e.g. Words & photos by...)"
                        value={credits}
                        onChange={(e) => setCredits(e.target.value)}
                        style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            fontSize: "13px",
                        }}
                    />

                    <textarea
                        placeholder="Write or paste article copy..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        required
                        style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            fontSize: "13px",
                            fontFamily: "inherit",
                        }}
                    />

                    <button
                        type="submit"
                        style={{
                            backgroundColor: blueColor,
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "10px",
                            padding: "11px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Submit for Editorial Review
                    </button>
                </form>
            )}

            {/* MODE 3: EDITORIAL & CONTENT APPROVALS */}
            {mode === "approvals" && canApprove && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Journalism vs Content Creation Tabs */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setApprovalTab("journalism")}
                            style={{
                                padding: "11px 14px",
                                borderRadius: "12px",
                                border:
                                    approvalTab === "journalism"
                                        ? `1px solid ${blackColor}`
                                        : "1px solid rgba(0,2,1,0.1)",
                                backgroundColor:
                                    approvalTab === "journalism"
                                        ? blackColor
                                        : "#FFFFFF",
                                color:
                                    approvalTab === "journalism"
                                        ? "#FFFFFF"
                                        : blackColor,
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Journalism ({articles.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setApprovalTab("content")}
                            style={{
                                padding: "11px 14px",
                                borderRadius: "12px",
                                border:
                                    approvalTab === "content"
                                        ? `1px solid ${blueColor}`
                                        : "1px solid rgba(0,2,1,0.1)",
                                backgroundColor:
                                    approvalTab === "content"
                                        ? blueColor
                                        : "#FFFFFF",
                                color:
                                    approvalTab === "content"
                                        ? "#FFFFFF"
                                        : blackColor,
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Content Creation ({contentAssets.length})
                        </button>
                    </div>

                    {/* JOURNALISM APPROVALS */}
                    {approvalTab === "journalism" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "11px",
                            }}
                        >
                            {articles.length === 0 ? (
                                <div
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        border: "1px solid rgba(0, 2, 1, 0.08)",
                                        borderRadius: "16px",
                                        padding: "22px",
                                        fontSize: "13px",
                                        color: greyColor,
                                    }}
                                >
                                    No journalism submissions awaiting review.
                                </div>
                            ) : (
                                articles.map((article) => (
                                    <div
                                        key={article.id}
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            border: "1px solid rgba(0, 2, 1, 0.09)",
                                            borderRadius: "16px",
                                            padding: "16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems: "flex-start",
                                                gap: "10px",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "15px",
                                                        fontWeight: 800,
                                                        color: blackColor,
                                                    }}
                                                >
                                                    {article.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: greyColor,
                                                    }}
                                                >
                                                    By {article.author} •{" "}
                                                    {article.submittedDate}
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    backgroundColor:
                                                        getStatusBadgeColor(
                                                            article.status
                                                        ),
                                                    color: "#FFFFFF",
                                                    fontSize: "11px",
                                                    fontWeight: 800,
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                }}
                                            >
                                                {article.status}
                                            </span>
                                        </div>

                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "13px",
                                                color: "#374151",
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {article.body}
                                        </p>

                                        {article.reviewFeedback && (
                                            <div
                                                style={{
                                                    backgroundColor: "#FEF2F2",
                                                    borderLeft: `3px solid ${redColor}`,
                                                    padding: "8px 11px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    color: "#991B1B",
                                                }}
                                            >
                                                <strong>Tweaks note:</strong>{" "}
                                                {article.reviewFeedback}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                marginTop: "4px",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleArticleDecision(
                                                        article.id,
                                                        "Approved"
                                                    )
                                                }
                                                style={{
                                                    padding: "7px 13px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: blueColor,
                                                    color: "#FFFFFF",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleArticleDecision(
                                                        article.id,
                                                        "Needs Tweaks"
                                                    )
                                                }
                                                style={{
                                                    padding: "7px 13px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${redColor}`,
                                                    backgroundColor: "#FFFFFF",
                                                    color: redColor,
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Request Tweaks
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* CONTENT CREATION APPROVALS */}
                    {approvalTab === "content" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "11px",
                            }}
                        >
                            {/* Status Filter Pills */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "7px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {(
                                    [
                                        "In Review",
                                        "Needs Tweaks",
                                        "Approved",
                                        "All",
                                    ] as const
                                ).map((status) => {
                                    const active = assetStatusFilter === status
                                    const count =
                                        status === "All"
                                            ? contentAssets.length
                                            : contentAssets.filter(
                                                  (a) => a.status === status
                                              ).length

                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                                setAssetStatusFilter(status)
                                            }
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: "999px",
                                                border: active
                                                    ? `1px solid ${blackColor}`
                                                    : "1px solid rgba(0,2,1,0.12)",
                                                backgroundColor: active
                                                    ? blackColor
                                                    : "#FFFFFF",
                                                color: active
                                                    ? "#FFFFFF"
                                                    : blackColor,
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {status} ({count})
                                        </button>
                                    )
                                })}
                            </div>

                            {visibleAssets.length === 0 ? (
                                <div
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        border: "1px solid rgba(0, 2, 1, 0.08)",
                                        borderRadius: "16px",
                                        padding: "22px",
                                        fontSize: "13px",
                                        color: greyColor,
                                    }}
                                >
                                    No content creation assets in &ldquo;
                                    {assetStatusFilter}&rdquo;.
                                </div>
                            ) : (
                                visibleAssets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            border: "1px solid rgba(0, 2, 1, 0.09)",
                                            borderRadius: "16px",
                                            padding: "16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems: "flex-start",
                                                gap: "10px",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: 800,
                                                        color: blueColor,
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    {asset.source} • {asset.type}{" "}
                                                    • {asset.aspectRatio}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "15px",
                                                        fontWeight: 800,
                                                        color: blackColor,
                                                        marginTop: "2px",
                                                    }}
                                                >
                                                    {asset.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: greyColor,
                                                    }}
                                                >
                                                    By {asset.creator} •{" "}
                                                    {asset.dateAdded}
                                                </div>
                                            </div>

                                            <span
                                                style={{
                                                    backgroundColor:
                                                        getStatusBadgeColor(
                                                            asset.status
                                                        ),
                                                    color: "#FFFFFF",
                                                    fontSize: "11px",
                                                    fontWeight: 800,
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {asset.status}
                                            </span>
                                        </div>

                                        {asset.notes && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: "13px",
                                                    color: "#374151",
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                {asset.notes}
                                            </p>
                                        )}

                                        {asset.reviewFeedback && (
                                            <div
                                                style={{
                                                    backgroundColor: "#FEF2F2",
                                                    borderLeft: `3px solid ${redColor}`,
                                                    padding: "8px 11px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    color: "#991B1B",
                                                }}
                                            >
                                                <strong>Tweaks note:</strong>{" "}
                                                {asset.reviewFeedback}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                flexWrap: "wrap",
                                                marginTop: "4px",
                                            }}
                                        >
                                            <a
                                                href={asset.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${blueColor}`,
                                                    color: blueColor,
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    textDecoration: "none",
                                                }}
                                            >
                                                Open Link ↗
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleAssetDecision(
                                                        asset.id,
                                                        "Approved"
                                                    )
                                                }
                                                style={{
                                                    padding: "7px 13px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: blueColor,
                                                    color: "#FFFFFF",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Approve
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleAssetDecision(
                                                        asset.id,
                                                        "Needs Tweaks"
                                                    )
                                                }
                                                style={{
                                                    padding: "7px 13px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${redColor}`,
                                                    backgroundColor: "#FFFFFF",
                                                    color: redColor,
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Request Tweaks
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
