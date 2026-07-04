const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseConfig = null;

try {
  // 1. Try to load from "serviceAccountKey.json" (Best for Local Development)
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (serviceAccount.project_id === "paste-your-project-id" || (serviceAccount.private_key && serviceAccount.private_key.includes("PASTE-YOUR-PRIVATE-KEY"))) {
      console.warn("⚠️ Placeholder serviceAccountKey.json detected, ignoring.");
    } else {
      console.log("🔥 Using local serviceAccountKey.json for Firebase Admin configuration.");
      firebaseConfig = {
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fertilizer-89e57.firebasestorage.app"
      };
    }
  } 
  
  // 2. Fallback to Environment Variables (Best for Render / Cloud Production)
  if (!firebaseConfig && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    if (process.env.FIREBASE_PRIVATE_KEY.includes("YOUR_PRIVATE_KEY_HERE")) {
      console.warn("⚠️ Placeholder FIREBASE_PRIVATE_KEY detected in .env, ignoring.");
    } else {
      console.log("🔥 Using .env secrets for Firebase Admin configuration.");
      firebaseConfig = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fertilizer-89e57.firebasestorage.app"
      };
    }
  }
} catch (error) {
  console.error("⚠️ Failed to parse Firebase credentials:", error.message);
}

// 3. Fallback warning
if (!firebaseConfig) {
  console.warn("⚠️ No Valid Firebase Credentials Found! Defaulting to applicationDefault().");
  firebaseConfig = {
    credential: admin.credential.applicationDefault()
  };
}

try {
  admin.initializeApp(firebaseConfig);
  admin.firestore().settings({ preferRest: true });
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

module.exports = {
  auth,
  db,
  storage,
};
