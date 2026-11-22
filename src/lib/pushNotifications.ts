import { supabase } from "./supabase"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ""

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

export async function subscribeDeviceToPush(
    rtaId: string,
    permissionGroup: string
): Promise<{ ok: boolean; message: string }> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
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

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
        return {
            ok: false,
            message:
                "Notification permission was blocked. Enable notifications in your phone settings.",
        }
    }

    const registration = await navigator.serviceWorker.register(
        "/Staff-Portal/sw.js",
        { scope: "/Staff-Portal/" }
    )
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

    if (!supabase) {
        return { ok: false, message: "Database unavailable." }
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
        message: "Push alerts enabled on this device!",
    }
}
