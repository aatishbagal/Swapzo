import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Trophy, 
  MessageCircle, 
  User, 
  ArrowLeftRight,
  Users
} from "lucide-react";

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

interface AlgorithmicMatchDialogProps {
  match: DirectMatch | ChainMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
  onViewProfile: (username: string) => void;
}

export default function AlgorithmicMatchDialog({
  match,
  isOpen,
  onClose,
  onStartChat,
  onViewProfile
}: AlgorithmicMatchDialogProps) {
  if (!match) return null;

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Building";
  };

  const getXPLevel = (xp: number) => {
    if (xp >= 1000) return { level: "Expert", color: "bg-purple-500" };
    if (xp >= 500) return { level: "Advanced", color: "bg-blue-500" };
    if (xp >= 100) return { level: "Intermediate", color: "bg-green-500" };
    return { level: "Beginner", color: "bg-gray-500" };
  };

  const confidencePercentage = Math.round(match.confidence * 100);
  const primaryUser = match.type === 'direct' ? match.matchedUser : match.chainUsers[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {match.type === 'direct' ? (
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            ) : (
              <Users className="h-5 w-5 text-primary" />
            )}
            Swap Match Found!
          </DialogTitle>
          <DialogDescription>
            {match.type === 'direct' 
              ? 'Direct swap opportunity' 
              : `Chain swap with ${match.chainLength} users`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Confidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Match Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Progress value={confidencePercentage} className="flex-1" />
                <span className="text-sm font-medium text-muted-foreground">
                  {confidencePercentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {match.description}
              </p>
            </CardContent>
          </Card>

          {/* Swap Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Swap Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600">You're Offering</h4>
                  <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    {match.userOffer}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-600">You're Getting</h4>
                  <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    {match.userNeed}
                  </p>
                </div>
                {match.type === 'direct' && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-orange-600">They're Offering</h4>
                      <p className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                        {match.matchedUserOffer.title}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-purple-600">They Need</h4>
                      <p className="text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                        {match.matchedUserNeed.title}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Primary User Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {match.type === 'direct' ? 'Direct Match Partner' : 'Primary Contact'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={primaryUser.photoURL} alt={primaryUser.displayName} />
                  <AvatarFallback>{primaryUser.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{primaryUser.displayName}</h3>
                    <Badge variant="secondary" className="text-xs">
                      @{primaryUser.username}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span className={getTrustScoreColor(primaryUser.trustScore)}>
                        {primaryUser.trustScore}/100
                      </span>
                      <span className="text-xs">({getTrustScoreLabel(primaryUser.trustScore)})</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      <span>{primaryUser.xp} XP</span>
                      <Badge className={`text-xs ${getXPLevel(primaryUser.xp).color}`}>
                        {getXPLevel(primaryUser.xp).level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chain Users (if chain match) */}
          {match.type === 'chain' && match.chainUsers.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Other Chain Participants
                </CardTitle>
                <CardDescription>
                  Additional users involved in this chain swap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {match.chainUsers.slice(1).map((user, index) => (
                    <div key={user.uid} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{user.displayName}</span>
                          <Badge variant="outline" className="text-xs">
                            Step {index + 2}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Trust: {user.trustScore}/100</span>
                          <span>XP: {user.xp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Algorithm Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Algorithmic match - reliable and fast</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onViewProfile(primaryUser.username)}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Button>
          <Button 
            onClick={() => onStartChat(primaryUser.uid)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}