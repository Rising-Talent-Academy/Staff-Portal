import { supabase, type PermissionGroup } from "./supabase"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ""
const SW_PATH = "/Staff-Portal/sw.js"
const SW_SCOPE = "/Staff-Portal/"

export interface PushResult {
    ok: boolean
    message: string
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function isPushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    )
}

export async function subscribeDeviceToPush(
    rtaId: string,
    permissionGroup: PermissionGroup | string
): Promise<PushResult> {
    if (!isPushSupported()) {
        return {
            ok: false,
            message:
                "Push alerts aren't supported in this browser. On iPhone, add the portal to your Home Screen first.",
        }
    }

    if (!VAPID_PUBLIC_KEY) {
        return {
            ok: false,
            message: "Push public key is not configured yet.",
        }
    }

    if (!supabase) {
        return {
            ok: false,
            message: "Database unavailable.",
        }
    }

    try {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
            return {
                ok: false,
                message:
                    "Notification permission was blocked. Enable notifications in your browser or device settings.",
            }
        }

        const registration = await navigator.serviceWorker.register(SW_PATH, {
            scope: SW_SCOPE,
        })
        await navigator.serviceWorker.ready

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        const json = subscription.toJSON()
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
            return {
                ok: false,
                message: "Could not read device push keys.",
            }
        }

        const { error } = await supabase.from("push_subscriptions").upsert(
            {
                rta_id: rtaId,
                permission_group: permissionGroup,
                endpoint: json.endpoint,
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
            },
            { onConflict: "endpoint" }
        )

        if (error) {
            return {
                ok: false,
                message: error.message || "Could not save push subscription.",
            }
        }

        return {
            ok: true,
            message: "Push alerts enabled on this device.",
        }
    } catch (err) {
        return {
            ok: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Something went wrong while enabling push alerts.",
        }
    }
}
