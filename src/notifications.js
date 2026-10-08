import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function enableAceBoardNotifications(firebaseApp) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported", token: null };
  }

  if (!VAPID_KEY) {
    return { status: "missing-config", token: null };
  }

  if (!(await isSupported())) {
    return { status: "unsupported", token: null };
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") {
    return { status: "denied", token: null };
  }

  const serviceWorkerRegistration =
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration,
  });

  return {
    status: token ? "granted" : "no-token",
    token: token || null,
  };
}

export async function listenForAceBoardMessages(firebaseApp, handler) {
  if (!(await isSupported())) {
    return () => {};
  }

  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, handler);
}
