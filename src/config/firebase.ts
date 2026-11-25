import "dotenv/config";

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is missing in .env");
}

const credentialsPath = resolve(process.cwd(), serviceAccountPath);

const serviceAccount = JSON.parse(
  readFileSync(credentialsPath, "utf8")
) as ServiceAccount;

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firestore = getFirestore();
export default firestore;