import { initializeApp } from "firebase/app";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('🔥 Firebase config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('❌ Missing Firebase configuration! Check environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google OAuth Web SDK removed - using bypass authentication instead

// Note: Google OAuth removed to prevent 403 WebView policy errors
// Using bypass authentication system instead (email/SMS/demo)

// Redirect result handling removed with Google OAuth cleanup

export const signOutUser = () => {
  console.log('🔥 Firebase sign out');
  return signOut(auth);
};

export const onAuthChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};