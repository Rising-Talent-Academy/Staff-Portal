import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import type { PermissionGroup, StaffProfile } from "./DashboardScreen"

interface RoleManagerViewProps {
    user: StaffProfile
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

interface ProfileRow {
    id: string
    email: string | null
    full_name: string | null
    rta_id: string
    role: string | null
    permission_group: PermissionGroup | string
    created_at?: string
}

const PERMISSION_OPTIONS: { value: PermissionGroup; label: string }[] = [
    { value: "journalist", label: "Journalist" },
    { value: "creator", label: "Content Creator" },
    { value: "both", label: "Journalist & Creator" },
    { value: "leadership", label: "Leadership & Admin" },
]

function normalizeGroup(value: string): PermissionGroup {
    if (
        value === "journalist" ||
        value === "creator" ||
        value === "both" ||
        value === "leadership"
    ) {
        return value
    }
    return "journalist"
}

function groupBadgeLabel(group: string): string {
    const found = PERMISSION_OPTIONS.find((opt) => opt.value === group)
    return found ? found.label : group || "Journalist"
}

export function RoleManagerView({
    user,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: RoleManagerViewProps) {
    const [profiles, setProfiles] = useState<ProfileRow[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState("")
    const [statusMsg, setStatusMsg] = useState("")

    // Filter state
    const [searchQuery, setSearchQuery] = useState("")
    const [groupFilter, setGroupFilter] = useState<"all" | PermissionGroup>(
        "all"
    )

    // New RTA ID form state
    const [fullName, setFullName] = useState("")
    const [rtaId, setRtaId] = useState("")
    const [roleTitle, setRoleTitle] = useState("")
    const [email, setEmail] = useState("")
    const [permissionGroup, setPermissionGroup] =
        useState<PermissionGroup>("journalist")
    const [creating, setCreating] = useState(false)

    // Inline edit state for an existing profile
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editFullName, setEditFullName] = useState("")
    const [editRole, setEditRole] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editGroup, setEditGroup] = useState<PermissionGroup>("journalist")
    const [savingId, setSavingId] = useState<string | null>(null)

    const loadProfiles = async () => {
        setLoading(true)
        setErrorMsg("")
        const { data, error } = await supabase
            .from("profiles")
            .select("id, email, full_name, rta_id, role, permission_group, created_at")
            .order("created_at", { ascending: false })

        if (error) {
            setErrorMsg(error.message)
        } else {
            setProfiles((data as ProfileRow[]) || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadProfiles()
    }, [])

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg("")
        setStatusMsg("")

        const cleanName = fullName.trim()
        const cleanRtaId = rtaId.trim().toUpperCase()
        const cleanRole = roleTitle.trim()
        const cleanEmail = email.trim()

        if (!cleanName || !cleanRtaId || !cleanRole) {
            setErrorMsg("Please fill in Full Name, RTA ID, and Role.")
            return
        }

        setCreating(true)

        const payload: {
            id?: string
            full_name: string
            rta_id: string
            role: string
            permission_group: PermissionGroup
            email?: string | null
        } = {
            full_name: cleanName,
            rta_id: cleanRtaId,
            role: cleanRole,
            permission_group: permissionGroup,
            email: cleanEmail || null,
        }

        // Generate a UUID if id has no default in Postgres
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
            payload.id = crypto.randomUUID()
        }

        const { error } = await supabase.from("profiles").insert(payload)

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(`Issued ${cleanRtaId} to ${cleanName}.`)
            setFullName("")
            setRtaId("")
            setRoleTitle("")
            setEmail("")
            setPermissionGroup("journalist")
            await loadProfiles()
        }

        setCreating(false)
    }

    const startEditing = (row: ProfileRow) => {
        setErrorMsg("")
        setStatusMsg("")
        setEditingId(row.id)
        setEditFullName(row.full_name || "")
        setEditRole(row.role || "")
        setEditEmail(row.email || "")
        setEditGroup(normalizeGroup(row.permission_group))
    }

    const cancelEditing = () => {
        setEditingId(null)
    }

    const handleSaveEdit = async (rowId: string) => {
        setErrorMsg("")
        setStatusMsg("")

        if (!editFullName.trim() || !editRole.trim()) {
            setErrorMsg("Full Name and Role cannot be empty.")
            return
        }

        setSavingId(rowId)

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: editFullName.trim(),
                role: editRole.trim(),
                email: editEmail.trim() || null,
                permission_group: editGroup,
            })
            .eq("id", rowId)

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(`Updated profile for ${editFullName.trim()}.`)
            setEditingId(null)
            await loadProfiles()
        }

        setSavingId(null)
    }

    const filteredProfiles = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        return profiles.filter((row) => {
            const matchesGroup =
                groupFilter === "all" ||
                normalizeGroup(row.permission_group) === groupFilter
            if (!matchesGroup) return false
            if (!q) return true

            return (
                (row.full_name || "").toLowerCase().includes(q) ||
                (row.rta_id || "").toLowerCase().includes(q) ||
                (row.role || "").toLowerCase().includes(q) ||
                (row.email || "").toLowerCase().includes(q)
            )
        })
    }, [profiles, searchQuery, groupFilter])

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
                            marginBottom: "2px",
                        }}
                    >
                        Leadership & Admin
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
                        RTA ID & Role Manager
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
                        boxShadow: "0 3px 10px rgba(0, 2, 1, 0.04)",
                    }}
                >
                    ← Back to Portal
                </button>
            </div>

            {/* Feedback Banners */}
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

            {/* Issue New RTA ID Card */}
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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "14px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 800,
                            color: blackColor,
                        }}
                    >
                        Issue New RTA ID
                    </h2>
                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: greyColor,
                        }}
                    >
                        Issued by {user.rtaId}
                    </span>
                </div>

                <form onSubmit={handleCreateProfile}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(210px, 1fr))",
                            gap: "12px",
                            marginBottom: "12px",
                        }}
                    >
                        <div>
                            <label style={labelStyle} htmlFor="new-full-name">
                                Full Name
                            </label>
                            <input
                                id="new-full-name"
                                type="text"
                                placeholder="e.g. Jordan Taylor"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="new-rta-id">
                                RTA ID
                            </label>
                            <input
                                id="new-rta-id"
                                type="text"
                                placeholder="e.g. J.TAYLOR1"
                                value={rtaId}
                                onChange={(e) => setRtaId(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="new-role">
                                Role Title
                            </label>
                            <input
                                id="new-role"
                                type="text"
                                placeholder="e.g. Motorsport Journalist"
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label
                                style={labelStyle}
                                htmlFor="new-permission-group"
                            >
                                Access Group
                            </label>
                            <select
                                id="new-permission-group"
                                value={permissionGroup}
                                onChange={(e) =>
                                    setPermissionGroup(
                                        e.target.value as PermissionGroup
                                    )
                                }
                                style={inputStyle}
                            >
                                {PERMISSION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                        <label style={labelStyle} htmlFor="new-email">
                            Email (Optional)
                        </label>
                        <input
                            id="new-email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        style={{
                            width: "100%",
                            padding: "11px 16px",
                            borderRadius: "11px",
                            border: "none",
                            backgroundColor: blueColor,
                            color: "#FFFFFF",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: creating ? "not-allowed" : "pointer",
                        }}
                    >
                        {creating ? "Issuing RTA ID..." : "Issue RTA ID"}
                    </button>
                </form>
            </section>

            {/* Staff Roster & Access Controls */}
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "12px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 800,
                            color: blackColor,
                        }}
                    >
                        Staff Roster ({filteredProfiles.length})
                    </h2>

                    <button
                        type="button"
                        onClick={loadProfiles}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: blueColor,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Refresh
                    </button>
                </div>

                {/* Search & Group Filter */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: "10px",
                        marginBottom: "14px",
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search name, RTA ID, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={inputStyle}
                    />

                    <select
                        value={groupFilter}
                        onChange={(e) =>
                            setGroupFilter(
                                e.target.value as "all" | PermissionGroup
                            )
                        }
                        style={inputStyle}
                    >
                        <option value="all">All Access Groups</option>
                        {PERMISSION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div
                        style={{
                            padding: "20px 0",
                            textAlign: "center",
                            fontSize: "13px",
                            color: greyColor,
                        }}
                    >
                        Loading staff profiles...
                    </div>
                ) : filteredProfiles.length === 0 ? (
                    <div
                        style={{
                            padding: "20px 0",
                            textAlign: "center",
                            fontSize: "13px",
                            color: greyColor,
                        }}
                    >
                        No matching staff profiles found.
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                        }}
                    >
                        {filteredProfiles.map((row) => {
                            const isEditing = editingId === row.id
                            const isSaving = savingId === row.id
                            const isLeadership =
                                normalizeGroup(row.permission_group) ===
                                "leadership"

                            return (
                                <div
                                    key={row.id}
                                    style={{
                                        padding: "14px",
                                        borderRadius: "14px",
                                        border: "1px solid rgba(0, 2, 1, 0.08)",
                                        backgroundColor: "#F9FAFC",
                                    }}
                                >
                                    {isEditing ? (
                                        <div>
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "repeat(auto-fit, minmax(170px, 1fr))",
                                                    gap: "10px",
                                                    marginBottom: "10px",
                                                }}
                                            >
                                                <div>
                                                    <label style={labelStyle}>
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editFullName}
                                                        onChange={(e) =>
                                                            setEditFullName(
                                                                e.target.value
                                                            )
                                                        }
                                                        style={inputStyle}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={labelStyle}>
                                                        Role Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editRole}
                                                        onChange={(e) =>
                                                            setEditRole(
                                                                e.target.value
                                                            )
                                                        }
                                                        style={inputStyle}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={labelStyle}>
                                                        Access Group
                                                    </label>
                                                    <select
                                                        value={editGroup}
                                                        onChange={(e) =>
                                                            setEditGroup(
                                                                e.target
                                                                    .value as PermissionGroup
                                                            )
                                                        }
                                                        style={inputStyle}
                                                    >
                                                        {PERMISSION_OPTIONS.map(
                                                            (opt) => (
                                                                <option
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label style={labelStyle}>
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={editEmail}
                                                        onChange={(e) =>
                                                            setEditEmail(
                                                                e.target.value
                                                            )
                                                        }
                                                        style={inputStyle}
                                                    />
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    justifyContent: "flex-end",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    style={{
                                                        padding: "7px 12px",
                                                        borderRadius: "8px",
                                                        border:
                                                            "1px solid rgba(0, 2, 1, 0.14)",
                                                        backgroundColor:
                                                            "#FFFFFF",
                                                        color: blackColor,
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isSaving}
                                                    onClick={() =>
                                                        handleSaveEdit(row.id)
                                                    }
                                                    style={{
                                                        padding: "7px 14px",
                                                        borderRadius: "8px",
                                                        border: "none",
                                                        backgroundColor:
                                                            blueColor,
                                                        color: "#FFFFFF",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: isSaving
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    }}
                                                >
                                                    {isSaving
                                                        ? "Saving..."
                                                        : "Save Changes"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent:
                                                    "space-between",
                                                gap: "12px",
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
                                                        marginBottom: "3px",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "14px",
                                                            fontWeight: 800,
                                                            color: blackColor,
                                                        }}
                                                    >
                                                        {row.full_name ||
                                                            "Unnamed Staff"}
                                                    </span>
                                                    <span
                                                        style={{
                                                            padding: "2px 8px",
                                                            borderRadius:
                                                                "6px",
                                                            backgroundColor:
                                                                "rgba(0, 2, 1, 0.07)",
                                                            fontSize: "11px",
                                                            fontWeight: 800,
                                                            color: blackColor,
                                                        }}
                                                    >
                                                        {row.rta_id}
                                                    </span>
                                                    <span
                                                        style={{
                                                            padding: "2px 8px",
                                                            borderRadius:
                                                                "6px",
                                                            backgroundColor:
                                                                isLeadership
                                                                    ? "rgba(250, 52, 37, 0.12)"
                                                                    : "rgba(3, 78, 175, 0.12)",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            color: isLeadership
                                                                ? redColor
                                                                : blueColor,
                                                        }}
                                                    >
                                                        {groupBadgeLabel(
                                                            row.permission_group
                                                        )}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: greyColor,
                                                    }}
                                                >
                                                    {row.role || "No role set"}
                                                    {row.email
                                                        ? ` • ${row.email}`
                                                        : ""}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => startEditing(row)}
                                                style={{
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    border:
                                                        "1px solid rgba(0, 2, 1, 0.14)",
                                                    backgroundColor: "#FFFFFF",
                                                    color: blackColor,
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
