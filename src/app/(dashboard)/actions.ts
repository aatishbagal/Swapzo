
'use server'; // Ensures all functions in this file are Server Actions

import { ref, get, child } from "firebase/database";
import { db } from '@/lib/firebase'; 
import { suggestSwapMatches, type SuggestSwapMatchesInput, type SuggestSwapMatchesOutput } from '@/ai/flows/suggest-swap-matches';
import type { User } from 'firebase/auth';

// Helper to get display name, ensure it's also a server-side utility or pass display name if needed
async function getUserDisplayName(userId: string): Promise<string> {
    const userProfileRef = ref(db, `userProfiles/${userId}/displayName`);
    const snapshot = await get(userProfileRef);
    return snapshot.val() || "Anonymous Swapper";
}


export async function findSwapMatchesAction(userId: string): Promise<SuggestSwapMatchesOutput | { error: string }> {
  if (!userId) {
    return { error: "User not authenticated." };
  }

  try {
    // Fetch user's offers
    const userOffersSnapshot = await get(child(ref(db), `userOffers/${userId}`));
    const userOffersData = userOffersSnapshot.val() || {};
    const userOffersList = Object.values(userOffersData).map((offer: any) => offer.title || offer.description).filter(Boolean) as string[];

    // Fetch user's needs
    const userNeedsSnapshot = await get(child(ref(db), `userNeeds/${userId}`));
    const userNeedsData = userNeedsSnapshot.val() || {};
    const userNeedsList = Object.values(userNeedsData).map((need: any) => need.title || need.description).filter(Boolean) as string[];

    // Fetch all offers (excluding current user's)
    const allOffersSnapshot = await get(child(ref(db), 'allOffers')); // In a real app, this would be more complex (querying, pagination)
    const allOffersData = allOffersSnapshot.val() || {};
    const allSystemOffersList = Object.values(allOffersData)
      .filter((offer: any) => offer.userId !== userId)
      .map((offer: any) => offer.title || offer.description)
      .filter(Boolean) as string[];

    // Fetch all needs (excluding current user's)
    const allNeedsSnapshot = await get(child(ref(db), 'allNeeds')); // Similarly, complex in real app
    const allNeedsData = allNeedsSnapshot.val() || {};
    const allSystemNeedsList = Object.values(allNeedsData)
      .filter((need: any) => need.userId !== userId)
      .map((need: any) => need.title || need.description)
      .filter(Boolean) as string[];
    
    if (userOffersList.length === 0 && userNeedsList.length === 0) {
        return { error: "Please add some offers or needs to your profile first to find relevant matches." };
    }

    const aiInput: SuggestSwapMatchesInput = {
      userOffers: userOffersList,
      userNeeds: userNeedsList,
      allOffers: allSystemOffersList,
      allNeeds: allSystemNeedsList,
    };
    
    const matches = await suggestSwapMatches(aiInput);
    return matches;

  } catch (error: any) {
    console.error("[Server Action] Error in findSwapMatchesAction:", error);
    return { error: error.message || "Failed to find matches due to a server error." };
  }
}
