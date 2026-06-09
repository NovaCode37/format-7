import { api } from "./api";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushStatus = "unsupported" | "denied" | "subscribed" | "unsubscribed";

export async function getPushStatus(): Promise<PushStatus> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return "unsubscribed";
  const sub = await reg.pushManager.getSubscription();
  return sub ? "subscribed" : "unsubscribed";
}

export async function subscribePush(token?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const { key } = await api.pushVapidKey();
  if (!key) {
    console.warn("[push] backend has no VAPID key configured");
    return false;
  }

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,

    applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
  });

  const json = sub.toJSON();
  await api.pushSubscribe({
    endpoint: json.endpoint!,
    p256dh: json.keys?.p256dh || "",
    auth:   json.keys?.auth   || "",
    user_agent: navigator.userAgent.slice(0, 300),
  }, token);
  return true;
}

export async function unsubscribePush(token?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return true;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  try {
    await api.pushUnsubscribe(endpoint, token);
  } catch {  }
  return true;
}
