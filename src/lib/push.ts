import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// You'll need to set FIREBASE_SERVICE_ACCOUNT env variable with your service account JSON
let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
  }

  try {
    const credentials = JSON.parse(serviceAccount);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    return firebaseApp;
  } catch {
    throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON");
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  try {
    const app = getFirebaseApp();
    const messaging = app.messaging();

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "hitpost_channel",
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error("Failed to send push notifications:", error);
    throw error;
  }
}

export async function sendDumpNotification(
  tokens: string[],
  senderEmail: string,
  viewUrl: string
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
  const senderName = senderEmail.split("@")[0];

  return sendPushNotification(tokens, {
    title: "New HitPost!",
    body: `${senderName} sent you a meme dump`,
    data: {
      type: "new_dump",
      url: viewUrl,
    },
  });
}
