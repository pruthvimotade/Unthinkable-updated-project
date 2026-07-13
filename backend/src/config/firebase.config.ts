import { initializeApp, cert, App } from "firebase-admin/app";
import { env } from "./env.config";
import { logger } from "./logger.config";

let firebaseEnabled = false;
let firebaseApp: App | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY || env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  try {
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
    
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    
    firebaseEnabled = true;
    logger.info("Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error({ error }, "Failed to initialize Firebase Admin SDK. Phone verification will be disabled.");
  }
} else {
  logger.warn("Firebase credentials not configured (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Phone verification will be disabled. Users will not be able to verify phone numbers via Firebase.");
}

export { firebaseEnabled, firebaseApp };
