import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { StaffProfile } from "./DashboardScreen"

export interface DirectoryContact {
    id: string
    full_name: string
    role: string
    email: string
    focus: string
    sort_order: number
}

interface TeamDirectoryViewProps {
    user: StaffProfile
    onBack: () => void
    redColor?: string
    blueColor?: string
    greyColor?: string
    blackColor?: string
}

const CATEGORIES = [
    "Editorial & Journalism",
    "Leadership & General",
    "Account / RTA ID",
    "Portal & Tech",
]

export function TeamDirectoryView({
    user,
    onBack,
    redColor = "#fa3425",
    blueColor = "#034eaf",
    greyColor = "#696969",
    blackColor = "#000201",
}: TeamDirectoryViewProps) {
    const [contacts, setContacts] = useState<DirectoryContact[]>([])
    const [loadingContacts, setLoadingContacts] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const [recipientEmail, setRecipientEmail] = useState(
        "RisingTalentAcademy@gmail.com"
    )
    const [category, setCategory] = useState(CATEGORIES[0])
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [ticketError, setTicketError] = useState("")
    const [ticketSuccess, setTicketSuccess] = useState(false)

    useEffect(() => {
        let active = true

        async function loadContacts() {
            if (!supabase) {
                setLoadingContacts(false)
                return
            }

            const { data } = await supabase
                .from("directory_contacts")
                .select("id, full_name, role, email, focus, sort_order")
                .order("sort_order", { ascending: true })

            if (active && Array.isArray(data) && data.length > 0) {
                setContacts(data as DirectoryContact[])
                setRecipientEmail(data[0].email)
            }
            if (active) setLoadingContacts(false)
        }

        loadContacts()
        return () => {
            active = false
        }
    }, [])

    const handleCopyEmail = async (contact: DirectoryContact) => {
        try {
            await navigator.clipboard.writeText(contact.email)
            setCopiedId(contact.id)
            setTimeout(() => setCopiedId(null), 1800)
        } catch {
            // Ignore clipboard permission errors on restricted browsers
        }
    }

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setTicketError("")
        setTicketSuccess(false)

        if (!subject.trim() || !message.trim()) {
            setTicketError("Please enter a short subject and message.")
            return
        }

        if (!supabase) {
            setTicketError("Database connection is unavailable.")
            return
        }

        setSubmitting(true)
        try {
            const { data: sessionData } = await supabase.auth.getSession()
            const authUserId = sessionData.session?.user?.id ?? null

            const { error: insertError } = await supabase
                .from("support_tickets")
                .insert({
                    created_by: authUserId,
                    submitter_name: user.name,
                    submitter_rta_id: user.rtaId,
                    recipient_email: recipientEmail,
                    category,
                    subject: subject.trim(),
                    message: message.trim(),
                })

            if (insertError) {
                setTicketError(insertError.message || "Could not send ticket.")
                return
            }

            setTicketSuccess(true)
            setSubject("")
            setMessage("")
        } catch {
            setTicketError("Could not send ticket. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            style={{
                maxWidth: "760px",
                width: "100%",
                margin: "0 auto",
                padding: "20px 18px 40px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
            }}
        >
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
                            color: blueColor,
                        }}
                    >
                        Key Contacts & Support
                    </p>
                    <h2
                        style={{
                            margin: "4px 0 0",
                            fontSize: "22px",
                            fontWeight: 700,
                            color: blackColor,
                        }}
                    >
                        Team Directory
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

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "14px",
                }}
            >
                {loadingContacts ? (
                    <p style={{ color: greyColor, fontSize: "14px" }}>
                        Loading contacts...
                    </p>
                ) : (
                    contacts.map((contact, idx) => {
                        const accent = idx % 2 === 0 ? redColor : blueColor
                        return (
                            <div
                                key={contact.id}
                                style={{
                                    border: "1px solid rgba(0, 2, 1, 0.12)",
                                    borderRadius: "14px",
                                    padding: "18px",
                                    backgroundColor: "#FFFFFF",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    gap: "14px",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            width: "36px",
                                            height: "3px",
                                            borderRadius: "999px",
                                            backgroundColor: accent,
                                            marginBottom: "10px",
                                        }}
                                    />
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: "17px",
                                            fontWeight: 700,
                                            color: blackColor,
                                        }}
                                    >
                                        {contact.full_name}
                                    </h3>
                                    <p
                                        style={{
                                            margin: "3px 0 10px",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: accent,
                                        }}
                                    >
                                        {contact.role}
                                    </p>
                                    <p
                                        style={{
                                            margin: "0 0 10px",
                                            fontSize: "13px",
                                            color: greyColor,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {contact.focus}
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: blackColor,
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {contact.email}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleCopyEmail(contact)}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(0, 2, 1, 0.16)",
                                            backgroundColor: "#FFFFFF",
                                            color: blackColor,
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {copiedId === contact.id
                                            ? "Copied"
                                            : "Copy Email"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecipientEmail(contact.email)
                                            setTicketSuccess(false)
                                        }}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: blackColor,
                                            color: "#FFFFFF",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Message Lead
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

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
                        margin: "0 0 4px",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: blackColor,
                    }}
                >
                    Raise a Ticket
                </h3>
                <p
                    style={{
                        margin: "0 0 16px",
                        fontSize: "13px",
                        color: greyColor,
                    }}
                >
                    Send a message or request straight to leadership inside the
                    portal.
                </p>

                <form
                    onSubmit={handleTicketSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <label
                                htmlFor="ticket-recipient"
                                style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: greyColor,
                                    marginBottom: "6px",
                                }}
                            >
                                Direct To
                            </label>
                            <select
                                id="ticket-recipient"
                                value={recipientEmail}
                                onChange={(e) =>
                                    setRecipientEmail(e.target.value)
                                }
                                style={{
                                    width: "100%",
                                    padding: "11px 12px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(0, 2, 1, 0.16)",
                                    fontSize: "14px",
                                    color: blackColor,
                                    backgroundColor: "#FFFFFF",
                                }}
                            >
                                <option value="RisingTalentAcademy@gmail.com">
                                    Becca Wilcock-Mead (Founder & CEO)
                                </option>
                                <option value="ajdysonf1@gmail.com">
                                    Antony Dyson (Head of Journalism)
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="ticket-category"
                                style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: greyColor,
                                    marginBottom: "6px",
                                }}
                            >
                                Topic
                            </label>
                            <select
                                id="ticket-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "11px 12px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(0, 2, 1, 0.16)",
                                    fontSize: "14px",
                                    color: blackColor,
                                    backgroundColor: "#FFFFFF",
                                }}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="ticket-subject"
                            style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: greyColor,
                                marginBottom: "6px",
                            }}
                        >
                            Subject
                        </label>
                        <input
                            id="ticket-subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Short summary of what you need"
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
                            htmlFor="ticket-message"
                            style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: greyColor,
                                marginBottom: "6px",
                            }}
                        >
                            Message
                        </label>
                        <textarea
                            id="ticket-message"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your question or request..."
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "11px 12px",
                                borderRadius: "10px",
                                border: "1px solid rgba(0, 2, 1, 0.16)",
                                fontSize: "14px",
                                color: blackColor,
                                resize: "vertical",
                                fontFamily: "inherit",
                            }}
                        />
                    </div>

                    {ticketError && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 500,
                                color: redColor,
                            }}
                        >
                            {ticketError}
                        </p>
                    )}

                    {ticketSuccess && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 600,
                                color: blueColor,
                            }}
                        >
                            Ticket submitted. Leadership will follow up with you.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            alignSelf: "flex-start",
                            padding: "12px 18px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: blueColor,
                            color: "#FFFFFF",
                            fontSize: "13px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.7 : 1,
                        }}
                    >
                        {submitting ? "Sending..." : "Submit Ticket"}
                    </button>
                </form>
            </div>
        </div>
    )
}
