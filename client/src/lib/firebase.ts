import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAYM_Of7OtLgvcgWjvgAIZrOH2Uirnfp48",
  authDomain: "gabai-f356b.firebaseapp.com",
  projectId: "gabai-f356b",
  storageBucket: "gabai-f356b.firebasestorage.app",
  appId: "324268053113",
};

console.log('🔥 Firebase config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth provider with custom parameters for mobile
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Force popup mode for mobile apps to prevent redirect
googleProvider.setCustomParameters({
  'prompt': 'select_account'
});

// Firebase auth functions - detect mobile and use appropriate method
export const signInWithGoogle = () => {
  const isMobileWebView = /wv/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isMobileWebView && isAndroid) {
    console.log('🔥 Mobile webview detected - using redirect for compatibility');
    return signInWithRedirect(auth, googleProvider);
  } else {
    console.log('🔥 Using popup authentication');
    return signInWithPopup(auth, googleProvider);
  }
};

export const handleRedirectResult = async () => {
  try {
    console.log('🔥 Checking Firebase redirect result');
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('✅ Firebase redirect result:', result.user.email);
      return result.user;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Firebase redirect error:', error);
    throw error;
  }
};

export const signOutUser = () => {
  console.log('🔥 Firebase sign out');
  return signOut(auth);
};

export const onAuthChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};