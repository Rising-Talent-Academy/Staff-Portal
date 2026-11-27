import React, { useState, useEffect } from "react"

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

export const INITIAL_CLOUD_ASSETS: CloudAsset[] = [
    {
        id: "cld-1",
        title: "Race Weekend Driver Spotlight — Final Cut",
        type: "Reel / TikTok",
        aspectRatio: "9:16",
        source: "CapCut",
        url: "https://www.capcut.com",
        creator: "Brooke",
        dateAdded: "27/11/2026",
        status: "In Review",
        notes: "1080x1920 export, safe-zone captions checked; ready for approval.",
    },
    {
        id: "cld-2",
        title: "Academy Standings Carousel Template",
        type: "Graphic / Thumbnail",
        aspectRatio: "4:5",
        source: "Canva",
        url: "https://www.canva.com",
        creator: "Brooke",
        dateAdded: "25/11/2026",
        status: "Approved",
        notes: "Uses #fa3425 accent bar and clean headline hierarchy.",
    },
]

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

export function loadCloudAssets(): CloudAsset[] {
    try {
        const raw = localStorage.getItem(CLOUD_ASSETS_STORAGE_KEY)
        if (!raw) return INITIAL_CLOUD_ASSETS
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) && parsed.length > 0
            ? parsed
            : INITIAL_CLOUD_ASSETS
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
    onBack?: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

export const UploadAssetsView: React.FC<UploadAssetsViewProps> = ({
    defaultCreator = "Brooke",
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
        saveCloudAssets(assets)
    }, [assets])

    // Sync if updated in Editorial & Content Approvals while mounted
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

    const counts = {
        All: assets.length,
        "In Review": assets.filter((a) => a.status === "In Review").length,
        Approved: assets.filter((a) => a.status === "Approved").length,
        "Needs Tweaks": assets.filter((a) => a.status === "Needs Tweaks").length,
    }

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

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Dark Header Card */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${blackColor} 0%, #111827 70%, #071936 100%)`,
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
                <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {onBack ? (
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
                                ← Back
                            </button>
                        ) : (
                            <span />
                        )}
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
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
                                Upload &amp; Assets
                            </h2>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                Submit Google Drive, iCloud, Canva &amp; CapCut links into the approval queue
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddForm((prev) => !prev)}
                            style={{
                                backgroundColor: redColor,
                                color: "#FFFFFF",
                                border: "none",
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
                </div>
            </div>

            {/* Add Asset Link Form */}
            {showAddForm && (
                <form
                    onSubmit={handleAddAsset}
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
                    <div style={{ fontSize: "13px", fontWeight: 800, color: blackColor }}>
                        New Asset Submission
                    </div>

                    <input
                        type="text"
                        placeholder="Asset title (e.g. Qualifying Reaction Reel v1)"
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
                        placeholder="Paste Google Drive, iCloud, Canva, CapCut, or editor link..."
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        required
                        style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            fontSize: "13px",
                        }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <select
                            value={source}
                            onChange={(e) => {
                                setSource(e.target.value as LinkSource)
                                setSourceManuallyPicked(true)
                            }}
                            style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #D1D5DB",
                                fontSize: "13px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            <option value="Google Drive">Google Drive</option>
                            <option value="iCloud">iCloud</option>
                            <option value="Canva">Canva</option>
                            <option value="CapCut">CapCut</option>
                            <option value="Other Link">Other Link</option>
                        </select>

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as AssetType)}
                            style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #D1D5DB",
                                fontSize: "13px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            <option value="Reel / TikTok">Reel / TikTok</option>
                            <option value="YouTube Short">YouTube Short</option>
                            <option value="Graphic / Thumbnail">Graphic / Thumbnail</option>
                            <option value="Project / Raw">Project / Raw</option>
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <input
                            type="text"
                            placeholder="Creator name"
                            value={creator}
                            onChange={(e) => setCreator(e.target.value)}
                            style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #D1D5DB",
                                fontSize: "13px",
                            }}
                        />

                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #D1D5DB",
                                fontSize: "13px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            <option value="9:16">9:16 (Vertical)</option>
                            <option value="4:5">4:5 (Portrait)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                        </select>
                    </div>

                    <textarea
                        placeholder="Notes for reviewers (audio, hooks, export specs, or link access)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
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
                            backgroundColor: blackColor,
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "10px",
                            padding: "11px",
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
                        flex: 1,
                        minWidth: "180px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 2, 1, 0.12)",
                        backgroundColor: "#FFFFFF",
                        fontSize: "12px",
                    }}
                />
                <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as "All" | LinkSource)}
                    style={{
                        padding: "8px 11px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 2, 1, 0.12)",
                        backgroundColor: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: 600,
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
                                border: isActive ? `1px solid ${blackColor}` : "1px solid rgba(0,2,1,0.1)",
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
                            border: "1px solid rgba(0,2,1,0.08)",
                            borderRadius: "16px",
                            padding: "24px",
                            textAlign: "center",
                            fontSize: "13px",
                            color: greyColor,
                        }}
                    >
                        No matching assets found.
                    </div>
                ) : (
                    filteredAssets.map((asset) => {
                        const badgeBg =
                            asset.status === "Approved"
                                ? blueColor
                                : asset.status === "Needs Tweaks"
                                  ? redColor
                                  : greyColor

                        return (
                            <div
                                key={asset.id}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border:
                                        asset.status === "Needs Tweaks"
                                            ? `1px solid rgba(250, 52, 37, 0.35)`
                                            : "1px solid rgba(0, 2, 1, 0.08)",
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
                                                fontSize: "11px",
                                                fontWeight: 800,
                                                color: blueColor,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            {asset.source} • {asset.type} • {asset.aspectRatio}
                                        </div>
                                        <h3
                                            style={{
                                                margin: "3px 0 0",
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
                                            backgroundColor: badgeBg,
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
