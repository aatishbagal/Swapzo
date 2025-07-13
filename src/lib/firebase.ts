// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth,sendEmailVerification, onAuthStateChanged,sendPasswordResetEmail, User } from "firebase/auth";
import { getDatabase, Database, ref, set, get, serverTimestamp } from "firebase/database";
import { generateUsernameFromEmail, validateUsername, reserveUsername } from './username-utils';


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

/**
 * Generates a unique username from email
 */
async function generateUniqueUsername(email: string): Promise<string> {
  let baseUsername = generateUsernameFromEmail(email);
  let username = baseUsername;
  let counter = 1;
  
  // Keep trying until we find a unique username
  while (true) {
    const validation = await validateUsername(username);
    if (validation.isValid) {
      return username;
    }
    
    // Try with a number suffix
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 100) {
      // Fall back to using timestamp
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }
  
  return username;
}

async function sendResetEmail(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Function to create or update user profile
async function createOrUpdateUserProfile(user: User) {
  try {
    const userProfileRef = ref(db, `userProfiles/${user.uid}`);
    
    // Check if profile already exists
    const snapshot = await get(userProfileRef);
    
    if (!snapshot.exists()) {
      // Generate unique username for new users
      const username = await generateUniqueUsername(user.email || '');
      
      // Reserve the username
      await reserveUsername(username, user.uid);
      
      // Create new profile with default values
      const newProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'New Swapper',
        email: user.email || '',
        photoURL: user.photoURL || '',
        username: username,
        trustScore: 50,
        xp: 0,
        lastUsernameChange: null, // Track when username was last changed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await set(userProfileRef, newProfile);
      console.log('New user profile created:', user.uid, 'with username:', username);
    } else {
      // Update existing profile with fresh auth data
      const existingProfile = snapshot.val();
      
      // Handle case where existing users don't have usernames yet
      let username = existingProfile.username;
      if (!username) {
        username = await generateUniqueUsername(user.email || '');
        await reserveUsername(username, user.uid);
      }
      
      const updatedProfile = {
        ...existingProfile,
        displayName: user.displayName || existingProfile.displayName,
        email: user.email || existingProfile.email,
        photoURL: user.photoURL || existingProfile.photoURL,
        username: username,
        updatedAt: serverTimestamp(),
      };
      
      await set(userProfileRef, updatedProfile);
      console.log('User profile updated:', user.uid);
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
  }
}

// ✅ Add this function
async function sendVerificationEmail(user: User) {
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
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

export { app, auth, googleProvider, sendResetEmail, sendVerificationEmail, db, createOrUpdateUserProfile };