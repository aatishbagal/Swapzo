import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, Database, ref, set, get, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Add this if you have a specific RTDB URL
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
const db: Database = getDatabase(app);

// Function to create or update user profile
async function createOrUpdateUserProfile(user: User) {
  try {
    const userProfileRef = ref(db, `userProfiles/${user.uid}`);
    
    // Check if profile already exists
    const snapshot = await get(userProfileRef);
    
    if (!snapshot.exists()) {
      // Create new profile with default values
      const newProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'New Swapper',
        email: user.email || '',
        photoURL: user.photoURL || '',
        trustScore: 50,
        xp: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await set(userProfileRef, newProfile);
      console.log('New user profile created:', user.uid);
    } else {
      // Update existing profile with fresh auth data
      const existingProfile = snapshot.val();
      const updatedProfile = {
        ...existingProfile,
        displayName: user.displayName || existingProfile.displayName,
        email: user.email || existingProfile.email,
        photoURL: user.photoURL || existingProfile.photoURL,
        updatedAt: serverTimestamp(),
      };
      
      await set(userProfileRef, updatedProfile);
      console.log('User profile updated:', user.uid);
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
  }
}

// Set up auth state listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, create/update their profile
      createOrUpdateUserProfile(user);
    }
  });
}

export { app, auth, googleProvider, db, createOrUpdateUserProfile };