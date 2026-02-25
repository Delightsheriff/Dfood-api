// import admin from "firebase-admin";
// import { env } from "./env";
// import path from "path";
// import fs from "fs";

// let firebaseApp: admin.app.App | null = null;

// export const initializeFirebase = () => {
//   try {
//     const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT
//       ? path.resolve(env.FIREBASE_SERVICE_ACCOUNT)
//       : path.resolve("firebase-service-account.json");

//     if (!fs.existsSync(serviceAccountPath)) {
//       console.warn(
//         "⚠️ Firebase service account file not found at:",
//         serviceAccountPath,
//       );
//       console.warn(
//         "⚠️ Push notifications will not work. Set FIREBASE_SERVICE_ACCOUNT in .env",
//       );
//       return;
//     }

//     firebaseApp = admin.initializeApp({
//       credential: admin.credential.cert(serviceAccountPath),
//     });

//     console.log("✅ Firebase initialized");
//   } catch (error) {
//     console.error("❌ Firebase initialization failed:", error);
//     // Don't throw - app should work without Firebase
//   }
// };

// export const isFirebaseInitialized = (): boolean => !!firebaseApp;

// export const getFirebaseApp = () => firebaseApp;
// Firebase Admin SDK — commented out until dev build / production
// Uncomment and configure google-services.json / GoogleService-Info.plist when ready

// import admin from "firebase-admin";
// import { env } from "./env";
// import path from "path";
// import fs from "fs";

// let firebaseApp: admin.app.App | null = null;

// export const initializeFirebase = () => { ... };
// export const isFirebaseInitialized = (): boolean => !!firebaseApp;
// export const getFirebaseApp = () => firebaseApp;

export const initializeFirebase = () => {
  console.log("⚠️ Firebase disabled — using Expo Push Notifications");
};
export const isFirebaseInitialized = () => false;
