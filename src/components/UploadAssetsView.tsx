import React, { useState, useEffect } from "react"
import { formatPermissionGroupLabel, type PermissionGroup } from "./supabase"

export type AssetStatus = "In Review" | "Approved" | "Needs Tweaks"
export type AssetType =
    | "Reel / TikTok"
    | "YouTube Short"
    | "Graphic / Thumbnail"
    | "Project / Raw"
export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5"
export type LinkSource =
    | "Google Drive"
    | "iCloud"
    | "Canva"
    | "CapCut"
    | "Other Link"

export interface CloudAsset {
    id: string
    title: string
    type: AssetType
    aspectRatio: AspectRatio
    source: LinkSource
    url: string
    creator: string
    dateAdded: string
    status: AssetStatus
    notes?: string
    reviewFeedback?: string
}

export const CLOUD_ASSETS_STORAGE_KEY = "rta_staff_portal_cloud_assets_v1"

export const INITIAL_CLOUD_ASSETS: CloudAsset[] = []

function formatDateUK(date = new Date()): string {
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const yyyy = date.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}

export function detectLinkSource(rawUrl: string): LinkSource {
    const lower = rawUrl.toLowerCase()
    if (lower.includes("drive.google.com") || lower.includes("docs.google.com"))
        return "Google Drive"
    if (lower.includes("icloud.com")) return "iCloud"
    if (lower.includes("canva.com")) return "Canva"
    if (lower.includes("capcut.com")) return "CapCut"
    return "Other Link"
}

function normalizeUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim()
    if (!trimmed) return ""
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
}

function getStatusBadgeStyle(
    status: AssetStatus,
    redColor: string,
    blueColor: string,
    greyColor: string
): React.CSSProperties {
    if (status === "Approved") {
        return {
            backgroundColor: "rgba(3, 78, 175, 0.1)",
            color: blueColor,
            border: "1px solid rgba(3, 78, 175, 0.24)",
        }
    }
    if (status === "Needs Tweaks") {
        return {
            backgroundColor: "rgba(250, 52, 37, 0.1)",
            color: redColor,
            border: "1px solid rgba(250, 52, 37, 0.28)",
        }
    }
    return {
        backgroundColor: "rgba(105, 105, 105, 0.12)",
        color: greyColor,
        border: "1px solid rgba(105, 105, 105, 0.22)",
    }
}

export function loadCloudAssets(): CloudAsset[] {
    try {
        const raw = localStorage.getItem(CLOUD_ASSETS_STORAGE_KEY)
        if (!raw) return INITIAL_CLOUD_ASSETS
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return INITIAL_CLOUD_ASSETS
        return parsed.filter(
            (item: CloudAsset) => item.id !== "cld-1" && item.id !== "cld-2"
        )
    } catch {
        return INITIAL_CLOUD_ASSETS
    }
}

export function saveCloudAssets(items: CloudAsset[]): void {
    try {
        localStorage.setItem(CLOUD_ASSETS_STORAGE_KEY, JSON.stringify(items))
    } catch {
        // Ignore storage errors
    }
}

interface UploadAssetsViewProps {
    defaultCreator?: string
    permissionGroup?: PermissionGroup
    singleSection?: boolean
    onBack?: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

export const UploadAssetsView: React.FC<UploadAssetsViewProps> = ({
    defaultCreator = "",
    permissionGroup,
    singleSection = false,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}) => {
    const [assets, setAssets] = useState<CloudAsset[]>(() => loadCloudAssets())
    const [filterStatus, setFilterStatus] = useState<"All" | AssetStatus>("All")
    const [sourceFilter, setSourceFilter] = useState<"All" | LinkSource>("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [bannerMessage, setBannerMessage] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [type, setType] = useState<AssetType>("Reel / TikTok")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16")
    const [url, setUrl] = useState("")
    const [source, setSource] = useState<LinkSource>("Google Drive")
    const [sourceManuallyPicked, setSourceManuallyPicked] = useState(false)
    const [creator, setCreator] = useState(defaultCreator)
    const [notes, setNotes] = useState("")

    useEffect(() => {
        if (defaultCreator && !creator) {
            setCreator(defaultCreator)
        }
    }, [defaultCreator, creator])

    useEffect(() => {
        saveCloudAssets(assets)
    }, [assets])

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === CLOUD_ASSETS_STORAGE_KEY) {
                setAssets(loadCloudAssets())
            }
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    const handleUrlChange = (nextUrl: string) => {
        setUrl(nextUrl)
        if (!sourceManuallyPicked && nextUrl.trim()) {
            setSource(detectLinkSource(nextUrl))
        }
    }

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault()
        const cleanUrl = normalizeUrl(url)
        if (!title.trim() || !cleanUrl) return

        const entry: CloudAsset = {
            id: `cld-${Date.now()}`,
            title: title.trim(),
            type,
            aspectRatio,
            source,
            url: cleanUrl,
            creator: creator.trim() || defaultCreator || "Team Member",
            dateAdded: formatDateUK(),
            status: "In Review",
            notes: notes.trim() || undefined,
        }

        setAssets((prev) => [entry, ...prev])
        setTitle("")
        setUrl("")
        setNotes("")
        setAspectRatio("9:16")
        setSource("Google Drive")
        setSourceManuallyPicked(false)
        setShowAddForm(false)
        setBannerMessage(`"${entry.title}" added to Content Approvals.`)
        setTimeout(() => setBannerMessage(null), 2800)
    }

    const handleCopyLink = async (asset: CloudAsset) => {
        try {
            await navigator.clipboard.writeText(asset.url)
            setCopiedId(asset.id)
            setTimeout(() => setCopiedId((prev) => (prev === asset.id ? null : prev)), 1600)
        } catch {
            // Fallback ignored
        }
    }

    const resetFilters = () => {
        setFilterStatus("All")
        setSourceFilter("All")
        setSearchQuery("")
    }

    const counts = {
        All: assets.length,
        "In Review": assets.filter((a) => a.status === "In Review").length,
        Approved: assets.filter((a) => a.status === "Approved").length,
        "Needs Tweaks": assets.filter((a) => a.status === "Needs Tweaks").length,
    }

    const hasActiveFilters =
        filterStatus !== "All" || sourceFilter !== "All" || searchQuery.trim() !== ""

    const filteredAssets = assets.filter((item) => {
        const matchesStatus = filterStatus === "All" || item.status === filterStatus
        const matchesSource = sourceFilter === "All" || item.source === sourceFilter
        const q = searchQuery.trim().toLowerCase()
        const matchesSearch =
            !q ||
            item.title.toLowerCase().includes(q) ||
            item.creator.toLowerCase().includes(q) ||
            item.source.toLowerCase().includes(q) ||
            (item.notes && item.notes.toLowerCase().includes(q))
        return matchesStatus && matchesSource && matchesSearch
    })

    const fieldStyle: React.CSSProperties = {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid rgba(0, 2, 1, 0.16)",
        backgroundColor: "#FFFFFF",
        color: blackColor,
        fontSize: "13px",
        fontFamily: "inherit",
    }

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: "11px",
        fontWeight: 700,
        color: greyColor,
        marginBottom: "4px",
        letterSpacing: "0.02em",
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: singleSection ? "16px" : "14px",
                maxWidth: singleSection ? "680px" : undefined,
                margin: singleSection ? "0 auto" : undefined,
                width: "100%",
            }}
        >
            {/* Header Card */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${blackColor} 0%, #111827 68%, #071936 100%)`,
                    color: "#FFFFFF",
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 14px 28px rgba(0, 2, 1, 0.14)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
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
                        padding: singleSection ? "20px 22px 22px" : "18px 20px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {onBack && !singleSection ? (
                            <button
                                type="button"
                                onClick={onBack}
                                style={{
                                    background: "rgba(255,255,255,0.12)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    color: "#FFFFFF",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                ← Back
                            </button>
                        ) : (
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: redColor,
                                }}
                            >
                                Content Creation
                            </span>
                        )}

                        {permissionGroup && (
                            <span
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    border: "1px solid rgba(255,255,255,0.16)",
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                }}
                            >
                                {formatPermissionGroupLabel(permissionGroup)}
                            </span>
                        )}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: "21px", fontWeight: 800, letterSpacing: "-0.01em" }}>
                                Upload &amp; Assets
                            </h2>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "12.5px",
                                    color: "rgba(255,255,255,0.74)",
                                    lineHeight: 1.4,
                                }}
                            >
                                {singleSection
                                    ? "Your content workspace — share Drive, iCloud, Canva & CapCut links for review"
                                    : "Submit Google Drive, iCloud, Canva & CapCut links into the approval queue"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAddForm((prev) => !prev)}
                            style={{
                                backgroundColor: showAddForm ? "rgba(255,255,255,0.14)" : redColor,
                                color: "#FFFFFF",
                                border: showAddForm ? "1px solid rgba(255,255,255,0.22)" : "none",
                                borderRadius: "10px",
                                padding: "10px 14px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            {showAddForm ? "Close Form" : "+ Add Asset Link"}
                        </button>
                    </div>

                    {/* Quick Status Summary Strip (especially helpful in single-section view) */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "8px",
                            paddingTop: "4px",
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "12px",
                                padding: "9px 11px",
                            }}
                        >
                            <div style={{ fontSize: "16px", fontWeight: 800 }}>{counts["In Review"]}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.68)" }}>In Review</div>
                        </div>
                        <div
                            style={{
                                backgroundColor: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "12px",
                                padding: "9px 11px",
                            }}
                        >
                            <div style={{ fontSize: "16px", fontWeight: 800, color: "#fca5a5" }}>
                                {counts["Needs Tweaks"]}
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.68)" }}>Needs Tweaks</div>
                        </div>
                        <div
                            style={{
                                backgroundColor: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "12px",
                                padding: "9px 11px",
                            }}
                        >
                            <div style={{ fontSize: "16px", fontWeight: 800, color: "#93c5fd" }}>
                                {counts.Approved}
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.68)" }}>Approved</div>
                        </div>
                    </div>
                </div>
            </div>

            {bannerMessage && (
                <div
                    style={{
                        backgroundColor: "rgba(3, 78, 175, 0.08)",
                        border: "1px solid rgba(3, 78, 175, 0.24)",
                        color: blueColor,
                        borderRadius: "12px",
                        padding: "10px 14px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                    }}
                >
                    {bannerMessage}
                </div>
            )}

            {/* Add Asset Link Form */}
            {showAddForm && (
                <form
                    onSubmit={handleAddAsset}
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0, 2, 1, 0.12)",
                        borderRadius: "16px",
                        padding: "18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: "0 10px 24px rgba(0, 2, 1, 0.06)",
                    }}
                >
                    <div style={{ fontSize: "14px", fontWeight: 800, color: blackColor }}>
                        New Asset Submission
                    </div>

                    <div>
                        <label style={labelStyle}>Asset Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Qualifying Reaction Reel v1"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={fieldStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Share Link</label>
                        <input
                            type="text"
                            placeholder="Paste Google Drive, iCloud, Canva, or CapCut link..."
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            required
                            style={fieldStyle}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={labelStyle}>Source</label>
                            <select
                                value={source}
                                onChange={(e) => {
                                    setSource(e.target.value as LinkSource)
                                    setSourceManuallyPicked(true)
                                }}
                                style={fieldStyle}
                            >
                                <option value="Google Drive">Google Drive</option>
                                <option value="iCloud">iCloud</option>
                                <option value="Canva">Canva</option>
                                <option value="CapCut">CapCut</option>
                                <option value="Other Link">Other Link</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Format</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as AssetType)}
                                style={fieldStyle}
                            >
                                <option value="Reel / TikTok">Reel / TikTok</option>
                                <option value="YouTube Short">YouTube Short</option>
                                <option value="Graphic / Thumbnail">Graphic / Thumbnail</option>
                                <option value="Project / Raw">Project / Raw</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={labelStyle}>Creator</label>
                            <input
                                type="text"
                                placeholder="Creator name"
                                value={creator}
                                onChange={(e) => setCreator(e.target.value)}
                                style={fieldStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Aspect Ratio</label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                style={fieldStyle}
                            >
                                <option value="9:16">9:16 (Vertical)</option>
                                <option value="4:5">4:5 (Portrait)</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="16:9">16:9 (Landscape)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Reviewer Notes (Optional)</label>
                        <textarea
                            placeholder="Audio, hooks, export specs, or link access notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            style={{ ...fieldStyle, resize: "vertical" }}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            backgroundColor: blackColor,
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "10px",
                            padding: "11px 14px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Send to Content Approvals
                    </button>
                </form>
            )}

            {/* Search + Source Filter */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                    type="search"
                    placeholder="Search title, creator or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        ...fieldStyle,
                        flex: 1,
                        minWidth: "180px",
                        padding: "9px 12px",
                        fontSize: "12.5px",
                    }}
                />
                <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as "All" | LinkSource)}
                    style={{
                        padding: "9px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 2, 1, 0.14)",
                        backgroundColor: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: blackColor,
                    }}
                >
                    <option value="All">All Sources</option>
                    <option value="Google Drive">Google Drive</option>
                    <option value="iCloud">iCloud</option>
                    <option value="Canva">Canva</option>
                    <option value="CapCut">CapCut</option>
                    <option value="Other Link">Other Link</option>
                </select>
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {(["All", "In Review", "Approved", "Needs Tweaks"] as const).map((status) => {
                    const isActive = filterStatus === status
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "999px",
                                border: isActive ? `1px solid ${blackColor}` : "1px solid rgba(0,2,1,0.12)",
                                backgroundColor: isActive ? blackColor : "#FFFFFF",
                                color: isActive ? "#FFFFFF" : blackColor,
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            {status} ({counts[status]})
                        </button>
                    )
                })}
            </div>

            {/* Asset Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                {filteredAssets.length === 0 ? (
                    <div
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0,2,1,0.1)",
                            borderRadius: "16px",
                            padding: "28px 20px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "10px",
                            boxShadow: "0 6px 18px rgba(0, 2, 1, 0.04)",
                        }}
                    >
                        <div style={{ fontSize: "14px", fontWeight: 800, color: blackColor }}>
                            {hasActiveFilters ? "No matching assets found" : "No assets submitted yet"}
                        </div>
                        <div style={{ fontSize: "12.5px", color: greyColor, maxWidth: "380px", lineHeight: 1.45 }}>
                            {hasActiveFilters
                                ? "Try clearing your search or switching status/source filters."
                                : "Tap below to submit your first Drive, iCloud, Canva, or CapCut link for review."}
                        </div>
                        {hasActiveFilters ? (
                            <button
                                type="button"
                                onClick={resetFilters}
                                style={{
                                    marginTop: "2px",
                                    backgroundColor: "#FFFFFF",
                                    color: blackColor,
                                    border: "1px solid rgba(0,2,1,0.18)",
                                    borderRadius: "10px",
                                    padding: "8px 14px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Reset Filters
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowAddForm(true)}
                                style={{
                                    marginTop: "2px",
                                    backgroundColor: redColor,
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "9px 15px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                + Add Asset Link
                            </button>
                        )}
                    </div>
                ) : (
                    filteredAssets.map((asset) => {
                        const statusStyle = getStatusBadgeStyle(
                            asset.status,
                            redColor,
                            blueColor,
                            greyColor
                        )

                        return (
                            <div
                                key={asset.id}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border:
                                        asset.status === "Needs Tweaks"
                                            ? "1px solid rgba(250, 52, 37, 0.35)"
                                            : "1px solid rgba(0, 2, 1, 0.09)",
                                    borderRadius: "16px",
                                    padding: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
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
                                                display: "flex",
                                                gap: "6px",
                                                flexWrap: "wrap",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    fontWeight: 800,
                                                    color: blueColor,
                                                    backgroundColor: "rgba(3, 78, 175, 0.08)",
                                                    padding: "2px 8px",
                                                    borderRadius: "999px",
                                                }}
                                            >
                                                {asset.source}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: blackColor,
                                                    backgroundColor: "rgba(0, 2, 1, 0.05)",
                                                    padding: "2px 8px",
                                                    borderRadius: "999px",
                                                }}
                                            >
                                                {asset.type}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: greyColor,
                                                    backgroundColor: "rgba(105, 105, 105, 0.09)",
                                                    padding: "2px 8px",
                                                    borderRadius: "999px",
                                                }}
                                            >
                                                {asset.aspectRatio}
                                            </span>
                                        </div>

                                        <h3
                                            style={{
                                                margin: "6px 0 0",
                                                fontSize: "15px",
                                                fontWeight: 800,
                                                color: blackColor,
                                            }}
                                        >
                                            {asset.title}
                                        </h3>
                                        <div style={{ fontSize: "12px", color: greyColor, marginTop: "2px" }}>
                                            By {asset.creator} • {asset.dateAdded}
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            ...statusStyle,
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
                                    <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.45 }}>
                                        {asset.notes}
                                    </p>
                                )}

                                {asset.status === "Needs Tweaks" && asset.reviewFeedback && (
                                    <div
                                        style={{
                                            backgroundColor: "#FEF2F2",
                                            borderLeft: `3px solid ${redColor}`,
                                            padding: "9px 12px",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            color: "#991B1B",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        <strong>Tweaks requested:</strong> {asset.reviewFeedback}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                                    <a
                                        href={asset.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            padding: "7px 12px",
                                            borderRadius: "9px",
                                            border: `1px solid ${blueColor}`,
                                            backgroundColor: blueColor,
                                            color: "#FFFFFF",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            textDecoration: "none",
                                        }}
                                    >
                                        Open in {asset.source} ↗
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyLink(asset)}
                                        style={{
                                            padding: "7px 12px",
                                            borderRadius: "9px",
                                            border: "1px solid rgba(0,2,1,0.14)",
                                            backgroundColor: "#FFFFFF",
                                            color: blackColor,
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {copiedId === asset.id ? "Copied ✓" : "Copy Link"}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
