const admin = require("firebase-admin");
const APP_BASE_URL = String(process.env.ACEBOARD_APP_BASE_URL || "https://aceboardhq.vercel.app").replace(/\/+$/, "");

function normalizeData(data = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [String(key), String(value)])
  );
}

function normalizePath(url = "/") {
  const value = String(url || "/");
  return value.startsWith("/") ? value : "/";
}

async function sendUserNotification(uid, options = {}) {
  const userRef = admin.firestore().collection("users").doc(String(uid));
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  const profile = userSnap.data() || {};
  const tokens = Array.isArray(profile.notificationTokens)
    ? [...new Set(profile.notificationTokens.filter(Boolean))]
    : profile.notificationTokens
      ? [String(profile.notificationTokens)]
      : [];

  if (tokens.length === 0 || profile.notificationSettings?.enabled !== true) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  const title = String(options.title || "AceBoard");
  const body = String(options.body || "You have a new AceBoard update.");
  const url = normalizePath(options.url || "/");
  const link = `${APP_BASE_URL}${url === "/" ? "" : url}`;
  const data = normalizeData({
    ...(options.data || {}),
    url,
  });

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data,
    webpush: {
      notification: {
        title,
        body,
        icon: "/icon.png",
      },
      fcmOptions: {
        link,
      },
    },
  });

  const invalidCodes = new Set([
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
  ]);

  const removedTokens = [];

  response.responses.forEach((result, index) => {
    if (!result.success && invalidCodes.has(result.error?.code)) {
      removedTokens.push(tokens[index]);
    }
  });

  if (removedTokens.length > 0) {
    const remainingTokens = tokens.filter((token) => !removedTokens.includes(token));

    await userRef.set(
      {
        notificationTokens: remainingTokens,
      },
      { merge: true }
    );
  }

  return {
    sent: response.successCount,
    failed: response.failureCount,
    removed: removedTokens.length,
  };
}

module.exports = {
  sendUserNotification,
};
