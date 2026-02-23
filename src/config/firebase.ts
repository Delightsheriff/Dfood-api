import admin from "firebase-admin";
import { env } from "./env";

let firebaseApp: admin.app.App;

export const initializeFirebase = () => {
  try {
    const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountPath) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT environment variable is not set",
      );
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });

    console.log("✅ Firebase initialized");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Don't throw - app should work without Firebase
  }
};

export const getFirebaseApp = () => firebaseApp;
