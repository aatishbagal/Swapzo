// src/lib/username-utils.ts
import { db } from '@/lib/firebase';
import { ref, get, set, query, orderByChild, equalTo } from 'firebase/database';

export interface UsernameValidationResult {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

/**
 * Generates a username from email
 * Example: john.doe@email.com -> johndoe
 */
export function generateUsernameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // Remove special characters and convert to lowercase
  const cleanUsername = localPart
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  
  return cleanUsername;
}

/**
 * Validates username format and checks for uniqueness
 */
export async function validateUsername(username: string, currentUserId?: string): Promise<UsernameValidationResult> {
  // Format validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  
  if (!username) {
    return {
      isValid: false,
      message: "Username is required"
    };
  }

  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores"
    };
  }

  // Reserved usernames
  const reservedUsernames = [
    'admin', 'root', 'user', 'test', 'api', 'www', 'mail', 'support',
    'help', 'info', 'contact', 'about', 'terms', 'privacy', 'dashboard',
    'profile', 'settings', 'auth', 'login', 'signup', 'register', 'swapzo',
    'offers', 'needs', 'messages', 'history'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return {
      isValid: false,
      message: "This username is reserved"
    };
  }

  // Check uniqueness in Firebase RTDB
  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    
    if (snapshot.exists()) {
      const existingUserId = snapshot.val();
      // If it's the same user, it's valid
      if (currentUserId && existingUserId === currentUserId) {
        return {
          isValid: true,
          message: "Username is available"
        };
      }
      
      // Generate suggestions
      const suggestions = await generateUsernameSuggestions(username);
      
      return {
        isValid: false,
        message: "Username is already taken",
        suggestions
      };
    }

    return {
      isValid: true,
      message: "Username is available"
    };
  } catch (error) {
    console.error('Error validating username:', error);
    return {
      isValid: false,
      message: "Error validating username. Please try again."
    };
  }
}

/**
 * Generates username suggestions when the desired username is taken
 */
export async function generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  const maxSuggestions = 5;
  
  // Add numbers
  for (let i = 1; i <= maxSuggestions; i++) {
    const suggestion = `${baseUsername}${i}`;
    const isAvailable = await isUsernameAvailable(suggestion);
    if (isAvailable) {
      suggestions.push(suggestion);
    }
  }
  
  // Add underscores with numbers
  for (let i = 1; i <= maxSuggestions && suggestions.length < maxSuggestions; i++) {
    const suggestion = `${baseUsername}_${i}`;
    const isAvailable = await isUsernameAvailable(suggestion);
    if (isAvailable) {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Checks if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    return !snapshot.exists();
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Reserves a username for a user
 */
export async function reserveUsername(username: string, userId: string): Promise<boolean> {
  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    await set(usernameRef, userId);
    return true;
  } catch (error) {
    console.error('Error reserving username:', error);
    return false;
  }
}

/**
 * Removes a username reservation
 */
export async function unreserveUsername(username: string): Promise<boolean> {
  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    await set(usernameRef, null);
    return true;
  } catch (error) {
    console.error('Error unreserving username:', error);
    return false;
  }
}

/**
 * Gets user ID from username
 */
export async function getUserIdFromUsername(username: string): Promise<string | null> {
  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting user ID from username:', error);
    return null;
  }
}

/**
 * Checks if user can change their username (60 days cooldown)
 */
export function canChangeUsername(lastUsernameChange: number | null): boolean {
  if (!lastUsernameChange) return true;
  
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
  const now = Date.now();
  
  return (now - lastUsernameChange) >= sixtyDaysInMs;
}

/**
 * Gets the remaining cooldown time in days
 */
export function getUsernameChangeCooldownDays(lastUsernameChange: number | null): number {
  if (!lastUsernameChange) return 0;
  
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const timePassed = now - lastUsernameChange;
  const remainingTime = sixtyDaysInMs - timePassed;
  
  if (remainingTime <= 0) return 0;
  
  return Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
}