import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
// const validateConfig = () => {
//   const requiredFields = [
//     "apiKey",
//     "authDomain",
//     "projectId",
//     "storageBucket",
//     "messagingSenderId",
//     "appId",
//   ];

  // const missingFields = requiredFields.filter(
  //   (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
  // );

  // if (missingFields.length > 0) {
  //   throw new Error(
  //     `Missing required Firebase configuration fields: ${missingFields.join(
  //       ", "
  //     )}`
  //   );
  // }
// };

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
