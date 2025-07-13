import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Users, 
  Star, 
  Trophy, 
  ArrowLeftRight,
  MessageCircle,
  Eye,
  AlertCircle,
  Loader2,
  User,
  Bot,
  Cpu,
  Info
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { findSwapMatchesAction } from '@/app/(dashboard)/actions';
import AlgorithmicMatchDialog from './algorithmic-match-dialog';

// Types for algorithmic matching
interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL?: string;
  trustScore: number;
  xp: number;
}

interface DirectMatch {
  type: 'direct';
  description: string;
  userOffer: string;
  userNeed: string;
  matchedUser: UserProfile;
  matchedUserOffer: {
    offerId: string;
    title: string;
    description: string;
  };
  matchedUserNeed: {
    needId: string;
    title: string;
    description: string;
  };
  confidence: number;
}

interface ChainMatch {
  type: 'chain';
  description: string;
  userOffer: string;
  userNeed: string;
  chainUsers: UserProfile[];
  chainLength: number;
  confidence: number;
}

interface AlgorithmicMatchesResponse {
  directMatches: DirectMatch[];
  chainMatches: ChainMatch[];
}

export default function SwapMatchesDisplay() {
  const [matches, setMatches] = useState<AlgorithmicMatchesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<DirectMatch | ChainMatch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const router = useRouter();

  // Handle AI toggle change
  const handleAIToggle = (checked: boolean) => {
    if (checked) {
      // User is trying to enable AI - show under development dialog
      setShowAIDialog(true);
    } else {
      // User is switching back to algorithm
      setUseAI(false);
    }
  };

  // Handle AI dialog close - switch back to algorithm
  const handleAIDialogClose = () => {
    setShowAIDialog(false);
    setUseAI(false); // Ensure toggle stays off
  };

  const findMatches = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in to find matches");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await findSwapMatchesAction(user.uid);
      
      if ('error' in result) {
        setError(result.error);
        setMatches(null);
      } else {
        setMatches(result);
      }
    } catch (err) {
      console.error('Error finding matches:', err);
      setError("Failed to find matches. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMatch = (match: DirectMatch | ChainMatch) => {
    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  const handleStartChat = (userId: string) => {
    console.log(`Starting chat with user: ${userId}`);
    setIsDialogOpen(false);
    // TODO: Implement chat functionality
  };

  const handleViewProfile = (username: string) => {
    setIsDialogOpen(false);
    router.push(`/profile/${username}`);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getXPLevel = (xp: number) => {
    if (xp >= 1000) return { level: "Expert", color: "bg-purple-500" };
    if (xp >= 500) return { level: "Advanced", color: "bg-blue-500" };
    if (xp >= 100) return { level: "Intermediate", color: "bg-green-500" };
    return { level: "Beginner", color: "bg-gray-500" };
  };

  // Match card component
  const MatchCard = ({ match }: { match: DirectMatch | ChainMatch }) => {
    const primaryUser = match.type === 'direct' ? match.matchedUser : match.chainUsers[0];
    const confidencePercentage = Math.round(match.confidence * 100);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewMatch(match)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={match.type === 'direct' ? 'default' : 'secondary'}>
                {match.type === 'direct' ? 'Direct' : 'Chain'}
              </Badge>
              {match.type === 'chain' && (
                <Badge variant="outline" className="text-xs">
                  {match.chainLength} users
                </Badge>
              )}
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Algorithm
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Progress value={confidencePercentage} className="w-16 h-2" />
              <span className="text-xs text-muted-foreground">
                {confidencePercentage}%
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={primaryUser.photoURL} alt={primaryUser.displayName} />
              <AvatarFallback>{primaryUser.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{primaryUser.displayName}</h3>
                <Badge variant="secondary" className="text-xs">
                  @{primaryUser.username}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span className={getTrustScoreColor(primaryUser.trustScore)}>
                    {primaryUser.trustScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>{primaryUser.xp} XP</span>
                </div>
                <Badge className={`text-xs ${getXPLevel(primaryUser.xp).color}`}>
                  {getXPLevel(primaryUser.xp).level}
                </Badge>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <span className="font-medium text-green-600">You offer:</span>
              <p className="bg-green-50 dark:bg-green-900/20 p-1 rounded truncate">
                {match.userOffer}
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-blue-600">You get:</span>
              <p className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded truncate">
                {match.userNeed}
              </p>
            </div>
            {match.type === 'direct' && (
              <>
                <div className="space-y-1">
                  <span className="font-medium text-orange-600">They offer:</span>
                  <p className="bg-orange-50 dark:bg-orange-900/20 p-1 rounded truncate">
                    {match.matchedUserOffer.title}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-purple-600">They need:</span>
                  <p className="bg-purple-50 dark:bg-purple-900/20 p-1 rounded truncate">
                    {match.matchedUserNeed.title}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              {match.description}
            </p>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Swap Matches</h2>
          <p className="text-muted-foreground">
            {useAI ? 'AI-powered matching (Beta)' : 'Algorithmic matching - fast and reliable'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Matching Mode Toggle */}
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <Label htmlFor="algorithm-mode" className="text-sm font-medium">
                Algorithm
              </Label>
            </div>
            <Switch
              id="matching-mode"
              checked={useAI}
              onCheckedChange={handleAIToggle}
            />
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" />
              <Label htmlFor="ai-mode" className="text-sm font-medium">
                AI
              </Label>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={findMatches} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoading ? 'Finding...' : 'Find Matches'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Finding your perfect matches...</p>
          </div>
        </div>
      )}

      {/* Matches Display */}
      {matches && !isLoading && (
        <div className="space-y-6">
          {/* Direct Matches */}
          {matches.directMatches && matches.directMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Direct Matches</h3>
                <Badge variant="secondary">{matches.directMatches.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.directMatches.map((match, index) => (
                  <MatchCard key={`direct-${index}-${match.matchedUser.uid}`} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* Chain Matches */}
          {matches.chainMatches && matches.chainMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Chain Matches</h3>
                <Badge variant="secondary">{matches.chainMatches.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.chainMatches.map((match, index) => (
                  <MatchCard key={`chain-${index}-${match.chainUsers[0].uid}`} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* No Matches */}
          {(!matches.directMatches || matches.directMatches.length === 0) && 
           (!matches.chainMatches || matches.chainMatches.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  We couldn't find any swap matches at the moment. Try adding more offers or needs to your profile.
                </p>
                <Button variant="outline" onClick={() => router.push('/offers')}>
                  Add More Offers
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AI Under Development Dialog */}
      <AlertDialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              AI Matching - Under Development
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI-Powered Matching is Currently in Development
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    We're working on integrating advanced AI models like DeepSeek and Gemini to provide even smarter matching. This feature will be available soon!
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">What's coming:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Better semantic understanding</li>
                  <li>• Context-aware matching</li>
                  <li>• Multi-language support</li>
                  <li>• Improved confidence scoring</li>
                </ul>
              </div>
              
              <p className="text-sm">
                For now, please use our enhanced algorithmic matching which already provides excellent results!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAIDialogClose}>
              Continue with Algorithm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Match Dialog */}
      <AlgorithmicMatchDialog
        match={selectedMatch}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onStartChat={handleStartChat}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}