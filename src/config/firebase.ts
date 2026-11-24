
import "dotenv/config";

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_PATH is missing in .env"
  );
}

const credentialsPath = resolve(process.cwd(), serviceAccountPath);

const serviceAccount = JSON.parse(
  readFileSync(credentialsPath, "utf8")
) as admin.ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const firestore = admin.firestore();

export default firestore;
