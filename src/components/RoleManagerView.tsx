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
    { value: "outreach", label: "Outreach & Comms" },
    { value: "leadership", label: "Leadership & Admin" },
]

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function generateUuid(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

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
    const [createAuthAccount, setCreateAuthAccount] = useState(true)
    const [uuid, setUuid] = useState(() => generateUuid())
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

    // Delete state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const loadProfiles = async () => {
        setLoading(true)
        setErrorMsg("")
        const { data, error } = await supabase
            .from("profiles")
            .select(
                "id, email, full_name, rta_id, role, permission_group, created_at"
            )
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
        const cleanRtaId = rtaId.trim()
        const cleanRole = roleTitle.trim()
        const cleanEmail = email.trim().toLowerCase()
        let finalUuid = uuid.trim().toLowerCase()
        let tempPassword = ""

        if (!cleanName || !cleanRtaId || !cleanRole) {
            setErrorMsg("Please fill in Full Name, RTA ID, and Role Title.")
            return
        }

        if (createAuthAccount && !cleanEmail) {
            setErrorMsg(
                "Email is required when creating a Supabase Auth account."
            )
            return
        }

        if (!createAuthAccount) {
            if (!finalUuid || !UUID_REGEX.test(finalUuid)) {
                setErrorMsg(
                    "Please enter a valid UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)."
                )
                return
            }
        }

        setCreating(true)

        if (createAuthAccount) {
            const { data: fnData, error: fnError } =
                await supabase.functions.invoke("create-staff-user", {
                    body: {
                        email: cleanEmail,
                        full_name: cleanName,
                        rta_id: cleanRtaId,
                        role: cleanRole,
                        permission_group: permissionGroup,
                    },
                })

            if (fnError) {
                setErrorMsg(fnError.message || "Failed to call create-staff-user.")
                setCreating(false)
                return
            }

            if (fnData?.error || !fnData?.id) {
                setErrorMsg(
                    fnData?.error ||
                        "Edge Function did not return a valid Auth user ID."
                )
                setCreating(false)
                return
            }

            finalUuid = String(fnData.id).trim().toLowerCase()
            tempPassword = String(fnData.tempPassword || "RisingTalentAcademy")
            setUuid(finalUuid)
        }

        const { error } = await supabase.from("profiles").upsert(
            {
                id: finalUuid,
                full_name: cleanName,
                rta_id: cleanRtaId,
                role: cleanRole,
                permission_group: permissionGroup,
                email: cleanEmail || null,
            },
            { onConflict: "id" }
        )

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(
                createAuthAccount
                    ? `Created Auth account & issued ${cleanRtaId} to ${cleanName}. Temporary password: ${tempPassword}`
                    : `Issued ${cleanRtaId} to ${cleanName}.`
            )
            setUuid(generateUuid())
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
        setConfirmDeleteId(null)
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

    const handleDeleteProfile = async (row: ProfileRow) => {
        setErrorMsg("")
        setStatusMsg("")
        setDeletingId(row.id)

        const { data: fnData, error: fnError } =
            await supabase.functions.invoke("delete-staff-user", {
                body: { user_id: row.id },
            })

        if (fnError) {
            setErrorMsg(
                fnError.message || "Failed to remove user from Supabase Auth."
            )
            setDeletingId(null)
            return
        }

        if (fnData?.error) {
            setErrorMsg(fnData.error)
            setDeletingId(null)
            return
        }

        const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("id", row.id)

        if (error) {
            setErrorMsg(error.message)
        } else {
            setStatusMsg(
                `Removed ${row.full_name || row.rta_id} (${row.rta_id}) from roster and Supabase Auth.`
            )
            setConfirmDeleteId(null)
            if (editingId === row.id) {
                setEditingId(null)
            }
            await loadProfiles()
        }

        setDeletingId(null)
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
                (row.email || "").toLowerCase().includes(q) ||
                (row.id || "").toLowerCase().includes(q)
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
                    {/* Toggle Auth Account Creation */}
                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            backgroundColor: "#F9FAFC",
                            border: "1px solid rgba(0, 2, 1, 0.09)",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: blackColor,
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={createAuthAccount}
                                onChange={(e) =>
                                    setCreateAuthAccount(e.target.checked)
                                }
                            />
                            Create Supabase Auth login (Temp password:{" "}
                            <code>RisingTalentAcademy</code>)
                        </label>
                    </div>

                    {/* UUID Field */}
                    <div style={{ marginBottom: "12px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "5px",
                            }}
                        >
                            <label
                                style={{ ...labelStyle, marginBottom: 0 }}
                                htmlFor="new-uuid"
                            >
                                {createAuthAccount
                                    ? "UUID (Auto-assigned from Auth User)"
                                    : "UUID (Required)"}
                            </label>
                            {!createAuthAccount && (
                                <button
                                    type="button"
                                    onClick={() => setUuid(generateUuid())}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        padding: 0,
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: blueColor,
                                        cursor: "pointer",
                                    }}
                                >
                                    Generate UUID
                                </button>
                            )}
                        </div>
                        <input
                            id="new-uuid"
                            type="text"
                            required={!createAuthAccount}
                            disabled={createAuthAccount}
                            placeholder={
                                createAuthAccount
                                    ? "Generated automatically when Auth user is created"
                                    : "e.g. 550e8400-e29b-41d4-a716-446655440000"
                            }
                            value={createAuthAccount ? "" : uuid}
                            onChange={(e) => setUuid(e.target.value)}
                            style={{
                                ...inputStyle,
                                opacity: createAuthAccount ? 0.65 : 1,
                                fontFamily:
                                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: "12px",
                            }}
                        />
                    </div>

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
                                Full Name (Required)
                            </label>
                            <input
                                id="new-full-name"
                                type="text"
                                required
                                placeholder="e.g. Jordan Taylor"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="new-rta-id">
                                RTA ID (Required)
                            </label>
                            <input
                                id="new-rta-id"
                                type="text"
                                required
                                placeholder="e.g. J.Taylor1"
                                value={rtaId}
                                onChange={(e) => setRtaId(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="new-role">
                                Role Title (Required)
                            </label>
                            <input
                                id="new-role"
                                type="text"
                                required
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
                            {createAuthAccount
                                ? "Email (Required for Auth)"
                                : "Email (Optional)"}
                        </label>
                        <input
                            id="new-email"
                            type="email"
                            required={createAuthAccount}
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
                        {creating
                            ? createAuthAccount
                                ? "Creating Auth User & Issuing RTA ID..."
                                : "Issuing RTA ID..."
                            : createAuthAccount
                              ? "Create Auth User & Issue RTA ID"
                              : "Issue RTA ID"}
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
                        placeholder="Search name, RTA ID, role, or UUID..."
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
                            const isConfirmingDelete = confirmDeleteId === row.id
                            const isDeleting = deletingId === row.id
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
                                        <div>
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
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight: 800,
                                                                color:
                                                                    blackColor,
                                                            }}
                                                        >
                                                            {row.full_name ||
                                                                "Unnamed Staff"}
                                                        </span>
                                                        <span
                                                            style={{
                                                                padding:
                                                                    "2px 8px",
                                                                borderRadius:
                                                                    "6px",
                                                                backgroundColor:
                                                                    "rgba(0, 2, 1, 0.07)",
                                                                fontSize:
                                                                    "11px",
                                                                fontWeight: 800,
                                                                color:
                                                                    blackColor,
                                                            }}
                                                        >
                                                            {row.rta_id}
                                                        </span>
                                                        <span
                                                            style={{
                                                                padding:
                                                                    "2px 8px",
                                                                borderRadius:
                                                                    "6px",
                                                                backgroundColor:
                                                                    isLeadership
                                                                        ? "rgba(250, 52, 37, 0.12)"
                                                                        : "rgba(3, 78, 175, 0.12)",
                                                                fontSize:
                                                                    "11px",
                                                                fontWeight: 700,
                                                                color:
                                                                    isLeadership
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
                                                        {row.role ||
                                                            "No role set"}
                                                        {row.email
                                                            ? ` • ${row.email}`
                                                            : ""}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "11px",
                                                            color: greyColor,
                                                            marginTop: "3px",
                                                            fontFamily:
                                                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                                        }}
                                                    >
                                                        UUID: {row.id}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditing(row)
                                                        }
                                                        style={{
                                                            padding:
                                                                "7px 12px",
                                                            borderRadius:
                                                                "8px",
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
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setConfirmDeleteId(
                                                                isConfirmingDelete
                                                                    ? null
                                                                    : row.id
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "7px 12px",
                                                            borderRadius:
                                                                "8px",
                                                            border: `1px solid ${redColor}`,
                                                            backgroundColor:
                                                                "rgba(250, 52, 37, 0.08)",
                                                            color: redColor,
                                                            fontSize: "12px",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {isConfirmingDelete && (
                                                <div
                                                    style={{
                                                        marginTop: "10px",
                                                        paddingTop: "10px",
                                                        borderTop:
                                                            "1px solid rgba(250, 52, 37, 0.2)",
                                                        display: "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "space-between",
                                                        gap: "10px",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: 700,
                                                            color: redColor,
                                                        }}
                                                    >
                                                        Delete{" "}
                                                        {row.full_name ||
                                                            row.rta_id}{" "}
                                                        permanently?
                                                    </span>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setConfirmDeleteId(
                                                                    null
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "6px 11px",
                                                                borderRadius:
                                                                    "8px",
                                                                border:
                                                                    "1px solid rgba(0, 2, 1, 0.14)",
                                                                backgroundColor:
                                                                    "#FFFFFF",
                                                                color:
                                                                    blackColor,
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 700,
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Keep
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isDeleting}
                                                            onClick={() =>
                                                                handleDeleteProfile(
                                                                    row
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "6px 12px",
                                                                borderRadius:
                                                                    "8px",
                                                                border: "none",
                                                                backgroundColor:
                                                                    redColor,
                                                                color:
                                                                    "#FFFFFF",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 700,
                                                                cursor:
                                                                    isDeleting
                                                                        ? "not-allowed"
                                                                        : "pointer",
                                                            }}
                                                        >
                                                            {isDeleting
                                                                ? "Deleting..."
                                                                : "Confirm Delete"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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
