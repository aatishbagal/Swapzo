// src/lib/enhanced-matcher.ts
// Advanced algorithmic matching with semantic understanding

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  trustScore: number;
  xp: number;
}

interface OfferItem {
  offerId: string;
  userId: string;
  title: string;
  description: string;
  userProfile: UserProfile;
}

interface NeedItem {
  needId: string;
  userId: string;
  title: string;
  description: string;
  userProfile: UserProfile;
}

// Enhanced text preprocessing
function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Extract keywords and phrases
function extractKeywords(text: string): string[] {
  const processed = preprocessText(text);
  const words = processed.split(' ').filter(word => word.length > 2);
  
  // Common stop words to filter out
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
  
  const keywords = words.filter(word => !stopWords.has(word));
  
  // Also extract phrases (2-3 words)
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  return [...keywords, ...phrases];
}

// Technology/skill synonyms mapping
const synonymsMap: Record<string, string[]> = {
  'javascript': ['js', 'javascript', 'node', 'nodejs', 'react', 'vue', 'angular'],
  'python': ['python', 'py', 'django', 'flask', 'pandas', 'numpy'],
  'java': ['java', 'spring', 'springboot', 'jsp', 'servlet'],
  'website': ['website', 'web', 'site', 'webpage', 'webdev', 'frontend', 'backend'],
  'portfolio': ['portfolio', 'showcase', 'profile', 'resume', 'cv'],
  'design': ['design', 'ui', 'ux', 'graphic', 'visual', 'creative'],
  'development': ['development', 'dev', 'coding', 'programming', 'building'],
  'teaching': ['teaching', 'tutoring', 'lessons', 'training', 'education', 'learn'],
  'math': ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'statistics'],
  'english': ['english', 'grammar', 'writing', 'language', 'literature'],
  'music': ['music', 'guitar', 'piano', 'singing', 'drums', 'violin'],
  'fitness': ['fitness', 'gym', 'workout', 'exercise', 'training', 'yoga'],
  'cooking': ['cooking', 'baking', 'chef', 'recipe', 'food', 'culinary'],
  'art': ['art', 'drawing', 'painting', 'sketch', 'illustration', 'digital art'],
  'photography': ['photography', 'photo', 'camera', 'photoshoot', 'editing'],
  'video': ['video', 'editing', 'filming', 'youtube', 'content', 'production'],
};

// Find synonyms for a given word
function findSynonyms(word: string): string[] {
  const lowerWord = word.toLowerCase();
  for (const [key, synonyms] of Object.entries(synonymsMap)) {
    if (synonyms.includes(lowerWord)) {
      return synonyms;
    }
  }
  return [lowerWord];
}

// Advanced similarity calculation
function calculateAdvancedSimilarity(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);
  
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  // 1. Exact keyword matches
  for (const keyword1 of keywords1) {
    maxPossibleScore += 1;
    for (const keyword2 of keywords2) {
      if (keyword1 === keyword2) {
        totalScore += 1;
        break;
      }
    }
  }
  
  // 2. Synonym matches
  for (const keyword1 of keywords1) {
    const synonyms1 = findSynonyms(keyword1);
    for (const keyword2 of keywords2) {
      const synonyms2 = findSynonyms(keyword2);
      
      // Check if any synonyms match
      const hasMatch = synonyms1.some(syn1 => synonyms2.includes(syn1));
      if (hasMatch && keyword1 !== keyword2) {
        totalScore += 0.8; // Synonym match worth 80% of exact match
        break;
      }
    }
  }
  
  // 3. Partial word matches (for compound words)
  for (const keyword1 of keywords1) {
    for (const keyword2 of keywords2) {
      if (keyword1.length > 3 && keyword2.length > 3) {
        if (keyword1.includes(keyword2) || keyword2.includes(keyword1)) {
          totalScore += 0.6; // Partial match worth 60%
          break;
        }
      }
    }
  }
  
  // 4. Contextual scoring
  const context1 = extractContext(text1);
  const context2 = extractContext(text2);
  if (context1 === context2 && context1 !== 'general') {
    totalScore += 0.5; // Same context bonus
  }
  
  return Math.min(totalScore / maxPossibleScore, 1);
}

// Extract context/category from text
function extractContext(text: string): string {
  const keywords = extractKeywords(text);
  
  const contexts = {
    'programming': ['code', 'programming', 'development', 'software', 'app', 'web', 'python', 'java', 'javascript'],
    'design': ['design', 'graphic', 'logo', 'visual', 'creative', 'art', 'ui', 'ux'],
    'education': ['teaching', 'tutoring', 'lessons', 'learning', 'education', 'training'],
    'music': ['music', 'guitar', 'piano', 'singing', 'instrument', 'song'],
    'fitness': ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'health'],
    'business': ['business', 'marketing', 'sales', 'consulting', 'strategy'],
  };
  
  for (const [context, contextKeywords] of Object.entries(contexts)) {
    if (keywords.some(keyword => contextKeywords.includes(keyword))) {
      return context;
    }
  }
  
  return 'general';
}

// Enhanced confidence scoring
function calculateEnhancedConfidence(
  offerSimilarity: number,
  needSimilarity: number,
  userProfile: UserProfile,
  matchType: 'direct' | 'chain'
): number {
  const baseSimilarity = (offerSimilarity + needSimilarity) / 2;
  
  // Trust score factor (0-1)
  const trustFactor = userProfile.trustScore / 100;
  
  // Experience factor (0-1, capped)
  const expFactor = Math.min(userProfile.xp / 1000, 1);
  
  // Match type factor
  const typeFactor = matchType === 'direct' ? 1 : 0.85;
  
  // Weighted calculation
  const confidence = (
    baseSimilarity * 0.6 +          // 60% similarity
    trustFactor * 0.25 +            // 25% trust
    expFactor * 0.15                // 15% experience
  ) * typeFactor;
  
  return Math.min(confidence, 1);
}

// Enhanced direct matching
export function findEnhancedDirectMatches(
  userOffers: string[],
  userNeeds: string[],
  allOffers: OfferItem[],
  allNeeds: NeedItem[]
): any[] {
  const directMatches: any[] = [];
  const threshold = 0.5; // Lower threshold to catch more semantic matches
  
  for (const userOffer of userOffers) {
    for (const userNeed of userNeeds) {
      
      // Find users who need what we offer
      const usersWhoNeedOurOffer = allNeeds.filter(need => {
        const similarity = calculateAdvancedSimilarity(userOffer, need.title);
        return similarity >= threshold;
      });
      
      // For each user who needs our offer, check if they offer what we need
      for (const needItem of usersWhoNeedOurOffer) {
        const theirOffers = allOffers.filter(offer => offer.userId === needItem.userId);
        
        for (const theirOffer of theirOffers) {
          const offerSimilarity = calculateAdvancedSimilarity(userNeed, theirOffer.title);
          
          if (offerSimilarity >= threshold) {
            const needSimilarity = calculateAdvancedSimilarity(userOffer, needItem.title);
            const confidence = calculateEnhancedConfidence(
              needSimilarity,
              offerSimilarity,
              needItem.userProfile,
              'direct'
            );
            
            if (confidence >= 0.4) { // Only include confident matches
              directMatches.push({
                type: 'direct',
                description: `Enhanced match: Your "${userOffer}" for their "${theirOffer.title}" (${Math.round(confidence * 100)}% confidence)`,
                userOffer,
                userNeed,
                matchedUser: needItem.userProfile,
                matchedUserOffer: theirOffer,
                matchedUserNeed: needItem,
                confidence,
                similarity: {
                  offer: offerSimilarity,
                  need: needSimilarity
                }
              });
            }
          }
        }
      }
    }
  }
  
  // Remove duplicates and sort by confidence
  const uniqueMatches = directMatches.filter((match, index, self) => 
    index === self.findIndex(m => m.matchedUser.uid === match.matchedUser.uid)
  );
  
  return uniqueMatches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

// Enhanced chain matching (similar improvements)
export function findEnhancedChainMatches(
  userOffers: string[],
  userNeeds: string[],
  allOffers: OfferItem[],
  allNeeds: NeedItem[]
): any[] {
  // Similar logic but with enhanced similarity calculation
  // Implementation would follow same pattern as direct matches
  // but for 3-way chains with the new similarity algorithm
  
  return []; // Placeholder - would implement full chain logic
}

// Main enhanced matching function
export interface MatchingResult {
  directMatches: any[];
  chainMatches: any[];
  algorithm?: 'enhanced';
  stats?: {
    totalComparisons: number;
    threshold: number;
    averageConfidence: number;
  };
}

export function findSwapMatches(
  userOffers: string[],
  userNeeds: string[],
  allOffers: OfferItem[],
  allNeeds: NeedItem[]
): MatchingResult {
  
  const directMatches = findEnhancedDirectMatches(userOffers, userNeeds, allOffers, allNeeds);
  const chainMatches = findEnhancedChainMatches(userOffers, userNeeds, allOffers, allNeeds);
  
  const allMatches = [...directMatches, ...chainMatches];
  const averageConfidence = allMatches.length > 0 
    ? allMatches.reduce((sum, match) => sum + match.confidence, 0) / allMatches.length 
    : 0;
  
  return {
    directMatches,
    chainMatches,
    algorithm: 'enhanced',
    stats: {
      totalComparisons: userOffers.length * userNeeds.length * allOffers.length,
      threshold: 0.5,
      averageConfidence
    }
  };
}