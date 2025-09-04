// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This is the important change. We check if the service account credentials
// are present in the environment variables. If so, we parse them.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!admin.apps.length) {
  // If the service account is available, we initialize with full credentials.
  // This is required for services like Firebase Storage to work from the backend.
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  } else {
    // If no credentials, we initialize for local development.
    // This might have limitations, especially with services like Storage.
    console.warn("Firebase Admin SDK initialized without service account credentials. Some services may not be available.");
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { admin, adminDb, adminStorage };
