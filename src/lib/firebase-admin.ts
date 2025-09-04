// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  } else {
    // Initialize without credentials for local development if needed,
    // though some services like Storage might have limitations.
    console.warn("Firebase Admin SDK initialized without service account credentials. Some services may not be available.");
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { admin, adminDb, adminStorage };
