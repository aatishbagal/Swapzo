'use server';

import { ref, get, child } from "firebase/database";
import { db } from '@/lib/firebase'; 
import { findSwapMatches, type MatchingResult } from '@/lib/swap-matcher';
import type { User } from 'firebase/auth';

// Interface for search results (unchanged)
export interface UserSearchResult {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
}

// Helper to get user profile data
async function getUserProfile(userId: string) {
  try {
    const userProfileRef = ref(db, `userProfiles/${userId}`);
    const snapshot = await get(userProfileRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        uid: userData.uid,
        displayName: userData.displayName || 'Anonymous Swapper',
        username: userData.username,
        photoURL: userData.photoURL || undefined,
        trustScore: userData.trustScore || 50,
        xp: userData.xp || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Keep the existing searchUsersAction unchanged
export async function searchUsersAction(searchQuery: string, currentUserId?: string): Promise<UserSearchResult[]> {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  try {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const userProfilesRef = ref(db, 'userProfiles');
    const snapshot = await get(userProfilesRef);
    const usersData = snapshot.val() || {};
    
    const searchResults: UserSearchResult[] = [];
    const maxResults = 10;

    Object.entries(usersData).forEach(([uid, userData]: [string, any]) => {
      if (uid === currentUserId) return;
      if (!userData.username) return;

      const username = userData.username.toLowerCase();
      const displayName = userData.displayName?.toLowerCase() || '';
      
      const matchesUsername = username.includes(normalizedQuery);
      const matchesDisplayName = displayName.includes(normalizedQuery);
      const exactUsernameMatch = username === normalizedQuery;
      const exactDisplayNameMatch = displayName === normalizedQuery;

      if (matchesUsername || matchesDisplayName) {
        const result: UserSearchResult = {
          uid,
          username: userData.username,
          displayName: userData.displayName || 'Anonymous Swapper',
          photoURL: userData.photoURL || undefined,
          trustScore: userData.trustScore || 50,
          xp: userData.xp || 0,
        };

        if (exactUsernameMatch || exactDisplayNameMatch) {
          searchResults.unshift(result);
        } else {
          searchResults.push(result);
        }
      }
    });

    return searchResults.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// New algorithmic matching action
export async function findSwapMatchesAction(userId: string): Promise<MatchingResult | { error: string }> {
  if (!userId) {
    return { error: "User not authenticated." };
  }

  try {
    console.log("=== ALGORITHMIC MATCHING ===");
    console.log("User ID:", userId);

    // 1. Fetch current user's offers and needs
    const userOffersSnapshot = await get(child(ref(db), `userOffers/${userId}`));
    const userOffersData = userOffersSnapshot.val() || {};
    const userOffersList = Object.values(userOffersData)
        .map((offer: any) => offer.title || offer.description)
        .filter(Boolean) as string[];
    
    console.log("User offers:", userOffersList);

    const userNeedsSnapshot = await get(child(ref(db), `userNeeds/${userId}`));
    const userNeedsData = userNeedsSnapshot.val() || {};
    const userNeedsList = Object.values(userNeedsData)
        .map((need: any) => need.title || need.description)
        .filter(Boolean) as string[];
    
    console.log("User needs:", userNeedsList);

    if (userOffersList.length === 0 && userNeedsList.length === 0) {
        return { error: "Please add some offers or needs to your profile first to find relevant matches." };
    }

    // 2. Fetch all offers and needs with user profiles
    const allOffersSnapshot = await get(child(ref(db), 'allOffers'));
    const allOffersData = allOffersSnapshot.val() || {};

    const allNeedsSnapshot = await get(child(ref(db), 'allNeeds'));
    const allNeedsData = allNeedsSnapshot.val() || {};

    // Build offers with user profiles
    const allOffersWithProfiles: any[] = [];
    for (const [offerId, offer] of Object.entries(allOffersData)) {
      const offerData = offer as any;
      
      if (offerData.userId === userId) continue; // Skip current user's offers
      
      if (offerData.userId) {
        const userProfile = await getUserProfile(offerData.userId);
        if (userProfile) {
          allOffersWithProfiles.push({
            offerId,
            userId: offerData.userId,
            title: offerData.title || '',
            description: offerData.description || '',
            userProfile,
          });
        }
      }
    }

    // Build needs with user profiles
    const allNeedsWithProfiles: any[] = [];
    for (const [needId, need] of Object.entries(allNeedsData)) {
      const needData = need as any;
      
      if (needData.userId === userId) continue; // Skip current user's needs
      
      if (needData.userId) {
        const userProfile = await getUserProfile(needData.userId);
        if (userProfile) {
          allNeedsWithProfiles.push({
            needId,
            userId: needData.userId,
            title: needData.title || '',
            description: needData.description || '',
            userProfile,
          });
        }
      }
    }

    console.log("Processed offers:", allOffersWithProfiles.length);
    console.log("Processed needs:", allNeedsWithProfiles.length);

    // 3. Run algorithmic matching
    const matchingResult = findSwapMatches(
      userOffersList,
      userNeedsList,
      allOffersWithProfiles,
      allNeedsWithProfiles
    );

    console.log("Direct matches found:", matchingResult.directMatches.length);
    console.log("Chain matches found:", matchingResult.chainMatches.length);
    
    return matchingResult;

  } catch (error: any) {
    console.error("[Server Action] Error in findSwapMatchesAction:", error);
    return { error: error.message || "Failed to find matches due to a server error." };
  }
}

// Helper function to get user profile by username (unchanged)
export async function getUserProfileByUsername(username: string) {
  try {
    const userProfilesRef = ref(db, 'userProfiles');
    const snapshot = await get(userProfilesRef);
    const usersData = snapshot.val() || {};
    
    for (const [uid, userData] of Object.entries(usersData)) {
      const user = userData as any;
      if (user.username === username) {
        return {
          uid,
          displayName: user.displayName || 'Anonymous Swapper',
          username: user.username,
          photoURL: user.photoURL || undefined,
          trustScore: user.trustScore || 50,
          xp: user.xp || 0,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile by username:', error);
    return null;
  }
}